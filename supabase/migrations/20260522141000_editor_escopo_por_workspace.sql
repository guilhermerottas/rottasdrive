-- Editores ganham poderes plenos, MAS apenas nos workspaces em que são membros.
-- Admin continua com acesso global. Viewers seguem por membership + permissões.

-- 1) can_access_obra: admin bypass; editor/viewer precisam ser membros do workspace.
CREATE OR REPLACE FUNCTION public.can_access_obra(_user_id uuid, _obra_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR (
      EXISTS (
        SELECT 1 FROM public.obras o
        WHERE o.id = _obra_id
          AND public.is_workspace_member(_user_id, o.workspace_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.obra_restrictions r
        WHERE r.obra_id = _obra_id AND r.user_id = _user_id
      )
    );
$$;

-- 2) pasta_acoes_efetivas: admin = todas; sem acesso à obra = nenhuma;
--    editor com acesso à obra = todas; senão, override explícito ou {ver,baixar}.
CREATE OR REPLACE FUNCTION public.pasta_acoes_efetivas(_user_id uuid, _pasta_id uuid)
RETURNS public.pasta_acao[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _obra_id uuid;
  _acoes public.pasta_acao[];
BEGIN
  SELECT obra_id INTO _obra_id FROM public.pastas WHERE id = _pasta_id;
  IF _obra_id IS NULL THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;

  IF public.has_role(_user_id, 'admin') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  IF NOT public.can_access_obra(_user_id, _obra_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;

  IF public.has_role(_user_id, 'editor') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  WITH RECURSIVE chain AS (
    SELECT id, pasta_pai_id, 0 AS depth
    FROM public.pastas WHERE id = _pasta_id
    UNION ALL
    SELECT p.id, p.pasta_pai_id, c.depth + 1
    FROM public.pastas p
    JOIN chain c ON p.id = c.pasta_pai_id
    WHERE c.depth < 50
  )
  SELECT pp.acoes INTO _acoes
  FROM chain c
  JOIN public.pasta_permissoes pp
    ON pp.pasta_id = c.id AND pp.user_id = _user_id
  ORDER BY c.depth ASC
  LIMIT 1;

  RETURN COALESCE(_acoes, ARRAY['ver','baixar']::public.pasta_acao[]);
END $$;

-- 3) Helper: pode gerenciar permissões/compartilhamento de pasta = admin OU editor membro.
CREATE OR REPLACE FUNCTION public.pode_gerenciar_pasta(_user_id uuid, _pasta_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'editor')
      AND EXISTS (
        SELECT 1 FROM public.pastas p
        WHERE p.id = _pasta_id
          AND public.can_access_obra(_user_id, p.obra_id)
      )
    );
$$;

-- 4) workspaces SELECT: membros + admin (sem o bypass de can_edit).
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_workspace_member(auth.uid(), id));

-- 5) obras INSERT/UPDATE/DELETE: admin global; editor só nos seus workspaces.
DROP POLICY IF EXISTS "Editors can insert obras" ON public.obras;
CREATE POLICY "Editors can insert obras"
  ON public.obras FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'editor')
        AND public.is_workspace_member(auth.uid(), workspace_id))
  );

DROP POLICY IF EXISTS "Editors can update obras" ON public.obras;
CREATE POLICY "Editors can update obras"
  ON public.obras FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'editor')
        AND public.is_workspace_member(auth.uid(), workspace_id))
  );

DROP POLICY IF EXISTS "Editors can delete obras" ON public.obras;
CREATE POLICY "Editors can delete obras"
  ON public.obras FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'editor')
        AND public.is_workspace_member(auth.uid(), workspace_id))
  );

-- 6) pastas: as policies já passam por pasta_tem_acao -> pasta_acoes_efetivas,
--    que agora exige can_access_obra para editor. Mas a policy INSERT tem um ramo
--    `can_edit(uid)` que continuaria liberando editor globalmente para raiz.
--    Reescrever sem o atalho de can_edit.
DROP POLICY IF EXISTS "Inserir pastas" ON public.pastas;
CREATE POLICY "Inserir pastas"
  ON public.pastas FOR INSERT TO authenticated
  WITH CHECK (
    -- Raiz: precisa de admin OU editor com acesso à obra
    (pasta_pai_id IS NULL AND (
      public.has_role(auth.uid(), 'admin')
      OR (public.has_role(auth.uid(), 'editor')
          AND public.can_access_obra(auth.uid(), obra_id))
    ))
    -- Subpasta: precisa de 'add' na pasta pai (editor/admin recebem via função)
    OR (pasta_pai_id IS NOT NULL
        AND public.pasta_tem_acao(auth.uid(), pasta_pai_id, 'add'))
  );

-- 7) arquivos: o ramo `pasta_id IS NULL` usa can_edit -> trocar para
--    admin OR editor+can_access_obra.
DROP POLICY IF EXISTS "Inserir arquivos" ON public.arquivos;
CREATE POLICY "Inserir arquivos"
  ON public.arquivos FOR INSERT TO authenticated
  WITH CHECK (
    CASE WHEN pasta_id IS NULL
      THEN (
        public.has_role(auth.uid(), 'admin')
        OR (public.has_role(auth.uid(), 'editor')
            AND public.can_access_obra(auth.uid(), obra_id))
      )
      ELSE public.pasta_tem_acao(auth.uid(), pasta_id, 'add')
    END
  );

DROP POLICY IF EXISTS "Atualizar arquivos" ON public.arquivos;
CREATE POLICY "Atualizar arquivos"
  ON public.arquivos FOR UPDATE TO authenticated
  USING (
    CASE WHEN pasta_id IS NULL
      THEN (
        public.has_role(auth.uid(), 'admin')
        OR (public.has_role(auth.uid(), 'editor')
            AND public.can_access_obra(auth.uid(), obra_id))
      )
      ELSE (
        public.pasta_tem_acao(auth.uid(), pasta_id, 'editar')
        OR public.pasta_tem_acao(auth.uid(), pasta_id, 'excluir')
      )
    END
  );

DROP POLICY IF EXISTS "Excluir arquivos" ON public.arquivos;
CREATE POLICY "Excluir arquivos"
  ON public.arquivos FOR DELETE TO authenticated
  USING (
    CASE WHEN pasta_id IS NULL
      THEN (
        public.has_role(auth.uid(), 'admin')
        OR (public.has_role(auth.uid(), 'editor')
            AND public.can_access_obra(auth.uid(), obra_id))
      )
      ELSE public.pasta_tem_acao(auth.uid(), pasta_id, 'excluir')
    END
  );

-- 8) pasta_permissoes: gestão exige admin OU editor com acesso à obra da pasta.
DROP POLICY IF EXISTS "Editores gerenciam permissoes" ON public.pasta_permissoes;
CREATE POLICY "Editores gerenciam permissoes"
  ON public.pasta_permissoes FOR ALL TO authenticated
  USING (public.pode_gerenciar_pasta(auth.uid(), pasta_id))
  WITH CHECK (public.pode_gerenciar_pasta(auth.uid(), pasta_id));
