-- Fase 6: permissões de pasta agora são por (pasta, workspace, usuário).

ALTER TABLE public.pasta_permissoes
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

UPDATE public.pasta_permissoes pp
SET workspace_id = o.workspace_id
FROM public.pastas p
JOIN public.obras o ON o.id = p.obra_id
WHERE pp.pasta_id = p.id;

ALTER TABLE public.pasta_permissoes ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.pasta_permissoes
  DROP CONSTRAINT IF EXISTS pasta_permissoes_pasta_id_user_id_key;

ALTER TABLE public.pasta_permissoes
  ADD CONSTRAINT pasta_permissoes_pasta_ws_user_key
  UNIQUE (pasta_id, workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_pasta_permissoes_pasta_ws
  ON public.pasta_permissoes(pasta_id, workspace_id);
