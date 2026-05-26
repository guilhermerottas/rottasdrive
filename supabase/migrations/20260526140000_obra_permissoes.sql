-- Fase 7: matriz de permissões por coleção (obra), análoga a pasta_permissoes.
-- Vira o default das pastas (pasta sem override + obra com matriz → matriz da obra).

CREATE TABLE public.obra_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  acoes public.pasta_acao[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (obra_id, user_id)
);
ALTER TABLE public.obra_permissoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_obra_permissoes_obra ON public.obra_permissoes(obra_id);
CREATE INDEX idx_obra_permissoes_user ON public.obra_permissoes(user_id);
CREATE TRIGGER update_obra_permissoes_updated_at BEFORE UPDATE ON public.obra_permissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.pode_gerenciar_obra(_user_id uuid, _obra_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR (public.has_role(_user_id, 'editor')
        AND public.can_access_obra(_user_id, _obra_id));
$$;

CREATE POLICY "Gerenciar permissoes obra"
  ON public.obra_permissoes FOR ALL TO authenticated
  USING (public.pode_gerenciar_obra(auth.uid(), obra_id))
  WITH CHECK (public.pode_gerenciar_obra(auth.uid(), obra_id));

CREATE OR REPLACE FUNCTION public.obra_acoes_efetivas(_user_id uuid, _obra_id uuid)
RETURNS public.pasta_acao[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _acoes public.pasta_acao[]; BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;
  IF NOT public.can_access_obra(_user_id, _obra_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;
  IF public.has_role(_user_id, 'editor') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;
  SELECT acoes INTO _acoes FROM public.obra_permissoes
    WHERE obra_id = _obra_id AND user_id = _user_id;
  RETURN COALESCE(_acoes, ARRAY['ver','baixar']::public.pasta_acao[]);
END $$;

CREATE OR REPLACE FUNCTION public.pasta_acoes_efetivas_ws(
  _user_id uuid, _pasta_id uuid, _workspace_id uuid
) RETURNS public.pasta_acao[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _acoes public.pasta_acao[];
  _obra_contexto uuid;
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;
  IF NOT public.is_workspace_member(_user_id, _workspace_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pasta_workspaces(_pasta_id) ws WHERE ws = _workspace_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;
  IF public.has_role(_user_id, 'editor') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  WITH RECURSIVE chain AS (
    SELECT id, pasta_pai_id, 0 AS depth FROM public.pastas WHERE id = _pasta_id
    UNION ALL
    SELECT p.id, p.pasta_pai_id, c.depth + 1
    FROM public.pastas p JOIN chain c ON p.id = c.pasta_pai_id WHERE c.depth < 50
  )
  SELECT pp.acoes INTO _acoes FROM chain c
  JOIN public.pasta_permissoes pp
    ON pp.pasta_id = c.id AND pp.user_id = _user_id AND pp.workspace_id = _workspace_id
  ORDER BY c.depth ASC LIMIT 1;
  IF _acoes IS NOT NULL THEN RETURN _acoes; END IF;

  SELECT CASE
    WHEN o.workspace_id = _workspace_id THEN o.id
    ELSE (SELECT v.obra_destino_id FROM public.pasta_workspace_vinculos v
          WHERE v.pasta_id = _pasta_id AND v.workspace_destino_id = _workspace_id LIMIT 1)
  END INTO _obra_contexto
  FROM public.pastas p JOIN public.obras o ON o.id = p.obra_id WHERE p.id = _pasta_id;

  IF _obra_contexto IS NULL THEN
    RETURN ARRAY['ver','baixar']::public.pasta_acao[];
  END IF;
  RETURN public.obra_acoes_efetivas(_user_id, _obra_contexto);
END $$;
