-- Chat: conversas + mensagens com tracking de tokens/custo + RPC de analytics para admin.

CREATE TABLE public.chat_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  titulo text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_conversas_user ON public.chat_conversas(user_id, updated_at DESC);

CREATE TABLE public.chat_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.chat_conversas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text NOT NULL DEFAULT '',
  tool_calls jsonb,
  citacoes jsonb,
  model text,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int GENERATED ALWAYS AS (COALESCE(prompt_tokens,0) + COALESCE(completion_tokens,0)) STORED,
  cost_usd numeric(10,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_mensagens_conversa ON public.chat_mensagens(conversa_id, created_at);
CREATE INDEX idx_chat_mensagens_assistant_date ON public.chat_mensagens(created_at) WHERE role = 'assistant';

-- RLS: usuário só vê suas próprias conversas/mensagens
ALTER TABLE public.chat_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_conversas_owner ON public.chat_conversas
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY chat_mensagens_via_conversa ON public.chat_mensagens
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversas c
    WHERE c.id = chat_mensagens.conversa_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversas c
    WHERE c.id = chat_mensagens.conversa_id AND c.user_id = auth.uid()
  ));

-- Trigger pra atualizar updated_at na conversa
CREATE TRIGGER update_chat_conversas_updated_at BEFORE UPDATE ON public.chat_conversas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View interna (não exposta na API: sem GRANT pra anon/authenticated)
CREATE OR REPLACE VIEW public.chat_usage_por_usuario AS
SELECT
  c.user_id,
  COUNT(*) FILTER (WHERE m.role = 'user') AS perguntas,
  COALESCE(SUM(m.prompt_tokens), 0)::bigint AS prompt_tokens,
  COALESCE(SUM(m.completion_tokens), 0)::bigint AS completion_tokens,
  COALESCE(SUM(m.total_tokens), 0)::bigint AS total_tokens,
  COALESCE(SUM(m.cost_usd), 0)::numeric AS cost_usd,
  MAX(m.created_at) AS ultima_mensagem,
  date_trunc('day', m.created_at)::date AS dia
FROM public.chat_conversas c
JOIN public.chat_mensagens m ON m.conversa_id = c.id
GROUP BY c.user_id, date_trunc('day', m.created_at)::date;

REVOKE ALL ON public.chat_usage_por_usuario FROM anon, authenticated;

-- RPC pra admin obter ranking por usuário
CREATE OR REPLACE FUNCTION public.chat_usage_admin(p_dias int DEFAULT 30)
RETURNS TABLE (
  user_id uuid,
  perguntas bigint,
  prompt_tokens bigint,
  completion_tokens bigint,
  total_tokens bigint,
  cost_usd numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.user_id,
    SUM(u.perguntas)::bigint,
    SUM(u.prompt_tokens)::bigint,
    SUM(u.completion_tokens)::bigint,
    SUM(u.total_tokens)::bigint,
    SUM(u.cost_usd)::numeric
  FROM public.chat_usage_por_usuario u
  WHERE u.dia >= (now() - (p_dias || ' days')::interval)::date
  GROUP BY u.user_id
  ORDER BY SUM(u.total_tokens) DESC;
END;
$$;

-- RPC pra totalizar custos/tokens globais (cards do admin)
CREATE OR REPLACE FUNCTION public.chat_usage_admin_totais(p_dias int DEFAULT 30)
RETURNS TABLE (
  total_perguntas bigint,
  total_tokens bigint,
  total_prompt_tokens bigint,
  total_completion_tokens bigint,
  total_cost_usd numeric,
  usuarios_ativos bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(u.perguntas), 0)::bigint,
    COALESCE(SUM(u.total_tokens), 0)::bigint,
    COALESCE(SUM(u.prompt_tokens), 0)::bigint,
    COALESCE(SUM(u.completion_tokens), 0)::bigint,
    COALESCE(SUM(u.cost_usd), 0)::numeric,
    COUNT(DISTINCT u.user_id)::bigint
  FROM public.chat_usage_por_usuario u
  WHERE u.dia >= (now() - (p_dias || ' days')::interval)::date;
END;
$$;
