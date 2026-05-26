-- Fase 1: Workspaces (setores da empresa). Nova hierarquia Workspace -> Obra -> Pasta -> Arquivo.

-- Tabela de workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Membros de cada workspace (relação N:N usuário <-> workspace)
CREATE TABLE public.workspace_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_membros ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_workspace_membros_user ON public.workspace_membros(user_id);
CREATE INDEX idx_workspace_membros_ws ON public.workspace_membros(workspace_id);

-- Coluna de workspace na obra (nullable durante a migração de dados)
ALTER TABLE public.obras ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id);

-- Migração de dados: app já em uso. Cria workspace "Marketing", move todas as
-- obras para dentro dele e adiciona todos os usuários atuais como membros.
DO $$
DECLARE mkt_id uuid;
BEGIN
  INSERT INTO public.workspaces (nome, descricao, cor)
  VALUES ('Marketing', 'Workspace inicial — migração das obras existentes', '#f59e0b')
  RETURNING id INTO mkt_id;

  UPDATE public.obras SET workspace_id = mkt_id WHERE workspace_id IS NULL;

  INSERT INTO public.workspace_membros (workspace_id, user_id)
  SELECT mkt_id, p.user_id FROM public.profiles p
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
END $$;

-- Agora toda obra tem workspace
ALTER TABLE public.obras ALTER COLUMN workspace_id SET NOT NULL;
CREATE INDEX idx_obras_workspace ON public.obras(workspace_id);
