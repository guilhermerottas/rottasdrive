-- Fase 6: funções de permissão de pasta passam a considerar vínculos cross-workspace
-- e a matriz por workspace. A versão sem workspace (usada pela RLS) faz união.

CREATE OR REPLACE FUNCTION public.pasta_workspaces(_pasta_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.workspace_id
  FROM public.pastas p JOIN public.obras o ON o.id = p.obra_id
  WHERE p.id = _pasta_id
  UNION
  SELECT workspace_destino_id FROM public.pasta_workspace_vinculos WHERE pasta_id = _pasta_id;
$$;

CREATE OR REPLACE FUNCTION public.pasta_acoes_efetivas_ws(
  _user_id uuid, _pasta_id uuid, _workspace_id uuid
)
RETURNS public.pasta_acao[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _acoes public.pasta_acao[];
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  IF NOT public.is_workspace_member(_user_id, _workspace_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pasta_workspaces(_pasta_id) ws WHERE ws = _workspace_id
  ) THEN
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
    ON pp.pasta_id = c.id
    AND pp.user_id = _user_id
    AND pp.workspace_id = _workspace_id
  ORDER BY c.depth ASC
  LIMIT 1;

  RETURN COALESCE(_acoes, ARRAY['ver','baixar']::public.pasta_acao[]);
END $$;

CREATE OR REPLACE FUNCTION public.pasta_acoes_efetivas(_user_id uuid, _pasta_id uuid)
RETURNS public.pasta_acao[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ws uuid;
  _result public.pasta_acao[] := '{}'::public.pasta_acao[];
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  FOR _ws IN SELECT * FROM public.pasta_workspaces(_pasta_id) LOOP
    _result := _result || public.pasta_acoes_efetivas_ws(_user_id, _pasta_id, _ws);
  END LOOP;

  RETURN ARRAY(SELECT DISTINCT unnest(_result));
END $$;

CREATE OR REPLACE FUNCTION public.pastas_raiz_da_obra(_obra_id uuid)
RETURNS TABLE (
  id uuid,
  obra_id uuid,
  pasta_pai_id uuid,
  nome text,
  cor text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  is_vinculo boolean,
  origem_workspace_id uuid
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.id, p.obra_id, p.pasta_pai_id, p.nome, p.cor,
         p.created_at, p.updated_at, p.deleted_at,
         false AS is_vinculo, NULL::uuid AS origem_workspace_id
  FROM public.pastas p
  WHERE p.obra_id = _obra_id AND p.pasta_pai_id IS NULL AND p.deleted_at IS NULL
  UNION ALL
  SELECT p.id, p.obra_id, p.pasta_pai_id, p.nome, p.cor,
         p.created_at, p.updated_at, p.deleted_at,
         true AS is_vinculo, o.workspace_id AS origem_workspace_id
  FROM public.pasta_workspace_vinculos v
  JOIN public.pastas p ON p.id = v.pasta_id
  JOIN public.obras o ON o.id = p.obra_id
  WHERE v.obra_destino_id = _obra_id AND p.deleted_at IS NULL;
$$;
