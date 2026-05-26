-- Admin analytics: access log + aggregation RPCs

-- ============================================================
-- Tabela de log de acesso (login)
-- ============================================================
CREATE TABLE public.access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_log_accessed_at ON public.access_log (accessed_at);

ALTER TABLE public.access_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins leem; inserção só via RPC SECURITY DEFINER
CREATE POLICY "Admins can read access_log"
  ON public.access_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- Backfill do histórico a partir do audit log do Supabase Auth
-- ============================================================
INSERT INTO public.access_log (user_id, accessed_at)
SELECT (payload->>'actor_id')::uuid, created_at
FROM auth.audit_log_entries
WHERE payload->>'action' = 'login'
  AND payload->>'actor_id' IS NOT NULL;

-- ============================================================
-- RPC: registra um acesso para o usuário autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.access_log (user_id, accessed_at)
    VALUES (auth.uid(), now());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_access() TO authenticated;

-- ============================================================
-- RPC: acessos por dia
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_access_by_day(_days int DEFAULT 30)
RETURNS TABLE (dia date, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT d::date AS dia,
         COUNT(a.id) AS total
  FROM generate_series(
         (CURRENT_DATE - (_days - 1)),
         CURRENT_DATE,
         '1 day'::interval
       ) AS d
  LEFT JOIN public.access_log a
    ON a.accessed_at >= d AND a.accessed_at < d + '1 day'::interval
  GROUP BY d
  ORDER BY d;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_access_by_day(int) TO authenticated;

-- ============================================================
-- RPC: uploads por mês
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_uploads_by_month(_months int DEFAULT 12)
RETURNS TABLE (mes date, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT m::date AS mes,
         COUNT(arq.id) AS total
  FROM generate_series(
         date_trunc('month', CURRENT_DATE) - ((_months - 1) || ' months')::interval,
         date_trunc('month', CURRENT_DATE),
         '1 month'::interval
       ) AS m
  LEFT JOIN public.arquivos arq
    ON arq.deleted_at IS NULL
   AND arq.created_at >= m
   AND arq.created_at < m + '1 month'::interval
  GROUP BY m
  ORDER BY m;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_uploads_by_month(int) TO authenticated;

-- ============================================================
-- RPC: uploads por semana
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_uploads_by_week(_weeks int DEFAULT 12)
RETURNS TABLE (semana date, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT w::date AS semana,
         COUNT(arq.id) AS total
  FROM generate_series(
         date_trunc('week', CURRENT_DATE) - ((_weeks - 1) || ' weeks')::interval,
         date_trunc('week', CURRENT_DATE),
         '1 week'::interval
       ) AS w
  LEFT JOIN public.arquivos arq
    ON arq.deleted_at IS NULL
   AND arq.created_at >= w
   AND arq.created_at < w + '1 week'::interval
  GROUP BY w
  ORDER BY w;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_uploads_by_week(int) TO authenticated;

-- ============================================================
-- RPC: pastas com mais arquivos
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_folders_top(_limit int DEFAULT 10)
RETURNS TABLE (pasta_id uuid, pasta_nome text, obra_nome text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT p.id AS pasta_id,
         p.nome AS pasta_nome,
         o.nome AS obra_nome,
         COUNT(arq.id) AS total
  FROM public.pastas p
  JOIN public.obras o ON o.id = p.obra_id
  LEFT JOIN public.arquivos arq
    ON arq.pasta_id = p.id AND arq.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.nome, o.nome
  HAVING COUNT(arq.id) > 0
  ORDER BY COUNT(arq.id) DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_folders_top(int) TO authenticated;

-- ============================================================
-- RPC: arquivos mais pesados
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_heaviest_files(_limit int DEFAULT 20)
RETURNS TABLE (
  arquivo_id uuid,
  nome text,
  tamanho bigint,
  obra_nome text,
  pasta_nome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT arq.id AS arquivo_id,
         arq.nome,
         COALESCE(arq.tamanho, 0) AS tamanho,
         o.nome AS obra_nome,
         p.nome AS pasta_nome
  FROM public.arquivos arq
  JOIN public.obras o ON o.id = arq.obra_id
  LEFT JOIN public.pastas p ON p.id = arq.pasta_id
  WHERE arq.deleted_at IS NULL
  ORDER BY COALESCE(arq.tamanho, 0) DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_heaviest_files(int) TO authenticated;
