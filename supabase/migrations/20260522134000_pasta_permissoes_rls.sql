-- Fase 2: RLS de pasta_permissoes e reescrita do RLS de pastas/arquivos.

-- pasta_permissoes: só editores/admins gerenciam.
CREATE POLICY "Editores gerenciam permissoes"
  ON public.pasta_permissoes FOR ALL TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

-- ===== PASTAS =====
DROP POLICY IF EXISTS "Users can view pastas" ON public.pastas;
DROP POLICY IF EXISTS "Editors can insert pastas" ON public.pastas;
DROP POLICY IF EXISTS "Editors can update pastas" ON public.pastas;
DROP POLICY IF EXISTS "Editors can delete pastas" ON public.pastas;

CREATE POLICY "Ver pastas"
  ON public.pastas FOR SELECT TO authenticated
  USING (public.pasta_tem_acao(auth.uid(), id, 'ver'));

CREATE POLICY "Inserir pastas"
  ON public.pastas FOR INSERT TO authenticated
  WITH CHECK (
    public.can_edit(auth.uid())
    OR (pasta_pai_id IS NOT NULL AND public.pasta_tem_acao(auth.uid(), pasta_pai_id, 'add'))
  );

CREATE POLICY "Atualizar pastas"
  ON public.pastas FOR UPDATE TO authenticated
  USING (
    public.pasta_tem_acao(auth.uid(), id, 'editar')
    OR public.pasta_tem_acao(auth.uid(), id, 'excluir')
  );

CREATE POLICY "Excluir pastas"
  ON public.pastas FOR DELETE TO authenticated
  USING (public.pasta_tem_acao(auth.uid(), id, 'excluir'));

-- ===== ARQUIVOS =====
-- Arquivos na raiz da obra (pasta_id IS NULL) seguem o acesso do workspace/obra.
DROP POLICY IF EXISTS "Viewers can view arquivos" ON public.arquivos;
DROP POLICY IF EXISTS "Editors can insert arquivos" ON public.arquivos;
DROP POLICY IF EXISTS "Editors can update arquivos" ON public.arquivos;
DROP POLICY IF EXISTS "Editors can delete arquivos" ON public.arquivos;

CREATE POLICY "Ver arquivos"
  ON public.arquivos FOR SELECT TO authenticated
  USING (
    CASE WHEN pasta_id IS NULL
      THEN public.can_access_obra(auth.uid(), obra_id)
      ELSE public.pasta_tem_acao(auth.uid(), pasta_id, 'ver')
    END
  );

CREATE POLICY "Inserir arquivos"
  ON public.arquivos FOR INSERT TO authenticated
  WITH CHECK (
    CASE WHEN pasta_id IS NULL
      THEN public.can_edit(auth.uid())
      ELSE (public.can_edit(auth.uid()) OR public.pasta_tem_acao(auth.uid(), pasta_id, 'add'))
    END
  );

CREATE POLICY "Atualizar arquivos"
  ON public.arquivos FOR UPDATE TO authenticated
  USING (
    CASE WHEN pasta_id IS NULL
      THEN public.can_edit(auth.uid())
      ELSE (
        public.pasta_tem_acao(auth.uid(), pasta_id, 'editar')
        OR public.pasta_tem_acao(auth.uid(), pasta_id, 'excluir')
      )
    END
  );

CREATE POLICY "Excluir arquivos"
  ON public.arquivos FOR DELETE TO authenticated
  USING (
    CASE WHEN pasta_id IS NULL
      THEN public.can_edit(auth.uid())
      ELSE public.pasta_tem_acao(auth.uid(), pasta_id, 'excluir')
    END
  );
