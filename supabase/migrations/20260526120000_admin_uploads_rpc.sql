-- RPC admin_uploads_list: lista paginada de uploads com filtros para o painel admin

CREATE OR REPLACE FUNCTION public.admin_uploads_list(
  _from timestamptz,
  _to timestamptz,
  _workspace_id uuid DEFAULT NULL,
  _uploaded_by uuid DEFAULT NULL,
  _tipo_prefix text DEFAULT NULL,
  _limit int DEFAULT 200
)
RETURNS TABLE (
  arquivo_id uuid,
  nome text,
  tipo text,
  tamanho bigint,
  created_at timestamptz,
  obra_id uuid,
  obra_nome text,
  pasta_id uuid,
  pasta_nome text,
  workspace_id uuid,
  workspace_nome text,
  uploaded_by uuid,
  uploader_nome text
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
  SELECT
    arq.id AS arquivo_id,
    arq.nome,
    arq.tipo,
    COALESCE(arq.tamanho, 0) AS tamanho,
    arq.created_at,
    o.id AS obra_id,
    o.nome AS obra_nome,
    p.id AS pasta_id,
    p.nome AS pasta_nome,
    w.id AS workspace_id,
    w.nome AS workspace_nome,
    arq.uploaded_by,
    pr.nome AS uploader_nome
  FROM public.arquivos arq
  JOIN public.obras o ON o.id = arq.obra_id
  JOIN public.workspaces w ON w.id = o.workspace_id
  LEFT JOIN public.pastas p ON p.id = arq.pasta_id
  LEFT JOIN public.profiles pr ON pr.user_id = arq.uploaded_by
  WHERE arq.deleted_at IS NULL
    AND arq.created_at >= _from
    AND arq.created_at <= _to
    AND (_workspace_id IS NULL OR o.workspace_id = _workspace_id)
    AND (_uploaded_by IS NULL OR arq.uploaded_by = _uploaded_by)
    AND (_tipo_prefix IS NULL OR arq.tipo LIKE _tipo_prefix || '%')
  ORDER BY arq.created_at DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_uploads_list(timestamptz, timestamptz, uuid, uuid, text, int) TO authenticated;
