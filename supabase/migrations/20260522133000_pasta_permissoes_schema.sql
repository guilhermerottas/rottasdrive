-- Fase 2: permissões por pasta e por usuário.

-- Ações possíveis numa pasta
CREATE TYPE public.pasta_acao AS ENUM ('ver', 'baixar', 'link', 'add', 'editar', 'excluir');

-- Override de permissões por (pasta, usuário). Sem linha = padrão de membro do workspace.
CREATE TABLE public.pasta_permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id uuid NOT NULL REFERENCES public.pastas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  acoes public.pasta_acao[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pasta_id, user_id)
);
ALTER TABLE public.pasta_permissoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pasta_permissoes_pasta ON public.pasta_permissoes(pasta_id);
CREATE INDEX idx_pasta_permissoes_user ON public.pasta_permissoes(user_id);
CREATE TRIGGER update_pasta_permissoes_updated_at BEFORE UPDATE ON public.pasta_permissoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ações efetivas de um usuário numa pasta.
-- admin/editor -> todas; senão exige acesso à obra; herda do ancestral mais próximo
-- com configuração explícita; sem nenhuma -> padrão {ver, baixar} de membro do workspace.
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

  IF public.can_edit(_user_id) THEN
    RETURN ARRAY['ver','baixar','link','add','editar','excluir']::public.pasta_acao[];
  END IF;

  IF NOT public.can_access_obra(_user_id, _obra_id) THEN
    RETURN ARRAY[]::public.pasta_acao[];
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

-- Conveniência: o usuário tem determinada ação na pasta?
CREATE OR REPLACE FUNCTION public.pasta_tem_acao(_user_id uuid, _pasta_id uuid, _acao public.pasta_acao)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _acao = ANY(public.pasta_acoes_efetivas(_user_id, _pasta_id));
$$;
