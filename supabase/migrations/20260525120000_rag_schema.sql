-- RAG: extensões, status de indexação em arquivos, tabela arquivo_chunks com RLS + RPCs de busca.

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- 2. Status de indexação em arquivos
CREATE TYPE public.status_indexacao AS ENUM ('pendente','processando','indexado','falhou','nao_aplicavel');

ALTER TABLE public.arquivos
  ADD COLUMN status_indexacao public.status_indexacao NOT NULL DEFAULT 'pendente',
  ADD COLUMN indexacao_erro text,
  ADD COLUMN indexado_em timestamptz,
  ADD COLUMN paginas_total int;

-- Arquivos antigos: marcar como pendente (default) — botão "Indexar para o chat" vai processá-los.
-- Tipos não suportados serão marcados como nao_aplicavel ao tentar indexar.

-- 3. Tabela de chunks (texto + embedding + tsvector pra hybrid search)
CREATE TABLE public.arquivo_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_id uuid NOT NULL REFERENCES public.arquivos(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', content)) STORED,
  embedding vector(1536),
  page_number int,
  source text NOT NULL CHECK (source IN ('pdf_text','pdf_ocr','transcription','vision','plaintext')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (arquivo_id, chunk_index)
);

CREATE INDEX idx_chunks_arquivo ON public.arquivo_chunks(arquivo_id);
CREATE INDEX idx_chunks_tsv ON public.arquivo_chunks USING GIN(content_tsv);
CREATE INDEX idx_chunks_embedding ON public.arquivo_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. RLS: chunks visíveis para quem pode ver o arquivo (segue permissão da pasta + admin/editor + obra)
ALTER TABLE public.arquivo_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY chunks_visiveis ON public.arquivo_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.arquivos a
    WHERE a.id = arquivo_chunks.arquivo_id
      AND a.deleted_at IS NULL
      AND (
        -- Arquivo na raiz da obra: precisa acesso à obra
        (a.pasta_id IS NULL AND public.can_access_obra(auth.uid(), a.obra_id))
        -- Arquivo em pasta: usa pasta_acoes_efetivas (já cobre admin/editor + workspace + override)
        OR (a.pasta_id IS NOT NULL AND 'ver' = ANY(public.pasta_acoes_efetivas(auth.uid(), a.pasta_id)))
      )
  )
);

-- Service role bypassa RLS automaticamente — edge function `indexar-arquivo` usa service role.

-- 5. Queue de jobs de indexação
SELECT pgmq.create('indexacao_jobs');

-- 6. RPC: busca de conteúdo (hybrid vector + tsvector)
CREATE OR REPLACE FUNCTION public.buscar_conteudo_chunks(
  query_embedding vector(1536),
  query_text text,
  p_workspace_id uuid DEFAULT NULL,
  p_obra_id uuid DEFAULT NULL,
  match_count int DEFAULT 8
) RETURNS TABLE (
  arquivo_id uuid,
  chunk_id uuid,
  content text,
  page_number int,
  arquivo_nome text,
  score double precision
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH semantic AS (
    SELECT c.id AS chunk_id, c.arquivo_id, c.content, c.page_number,
           (1 - (c.embedding <=> query_embedding))::double precision AS score
    FROM public.arquivo_chunks c
    JOIN public.arquivos a ON a.id = c.arquivo_id
    WHERE c.embedding IS NOT NULL
      AND (p_obra_id IS NULL OR a.obra_id = p_obra_id)
      AND (p_workspace_id IS NULL OR EXISTS (
        SELECT 1 FROM public.obras o WHERE o.id = a.obra_id AND o.workspace_id = p_workspace_id))
    ORDER BY c.embedding <=> query_embedding
    LIMIT GREATEST(match_count * 2, 16)
  ),
  full_text AS (
    SELECT c.id AS chunk_id, c.arquivo_id, c.content, c.page_number,
           ts_rank(c.content_tsv, plainto_tsquery('portuguese', query_text))::double precision AS score
    FROM public.arquivo_chunks c
    JOIN public.arquivos a ON a.id = c.arquivo_id
    WHERE c.content_tsv @@ plainto_tsquery('portuguese', query_text)
      AND (p_obra_id IS NULL OR a.obra_id = p_obra_id)
      AND (p_workspace_id IS NULL OR EXISTS (
        SELECT 1 FROM public.obras o WHERE o.id = a.obra_id AND o.workspace_id = p_workspace_id))
    ORDER BY 5 DESC
    LIMIT GREATEST(match_count * 2, 16)
  ),
  fused AS (
    SELECT
      COALESCE(s.chunk_id, f.chunk_id) AS chunk_id,
      COALESCE(s.arquivo_id, f.arquivo_id) AS arquivo_id,
      COALESCE(s.content, f.content) AS content,
      COALESCE(s.page_number, f.page_number) AS page_number,
      (COALESCE(s.score, 0) * 0.7 + COALESCE(f.score, 0) * 0.3)::double precision AS score
    FROM semantic s
    FULL OUTER JOIN full_text f ON s.chunk_id = f.chunk_id
  )
  SELECT fused.arquivo_id, fused.chunk_id, fused.content, fused.page_number,
         a.nome AS arquivo_nome, fused.score
  FROM fused
  JOIN public.arquivos a ON a.id = fused.arquivo_id
  ORDER BY fused.score DESC
  LIMIT match_count;
$$;

-- 7. RPC: busca de arquivo por nome (full-text em nome/descrição) — para o tool buscar_arquivo
CREATE OR REPLACE FUNCTION public.buscar_arquivo_por_nome(
  termo text,
  p_workspace_id uuid DEFAULT NULL,
  p_obra_id uuid DEFAULT NULL,
  match_count int DEFAULT 5
) RETURNS TABLE (
  arquivo_id uuid,
  nome text,
  tipo text,
  pasta_id uuid,
  pasta_nome text,
  obra_id uuid,
  obra_nome text,
  status_indexacao public.status_indexacao,
  score double precision
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    a.id,
    a.nome,
    a.tipo,
    a.pasta_id,
    COALESCE(p.nome, 'Raiz da obra') AS pasta_nome,
    a.obra_id,
    o.nome AS obra_nome,
    a.status_indexacao,
    ts_rank(
      to_tsvector('portuguese', a.nome || ' ' || COALESCE(a.descricao,'')),
      plainto_tsquery('portuguese', termo)
    )::double precision AS score
  FROM public.arquivos a
  JOIN public.obras o ON o.id = a.obra_id
  LEFT JOIN public.pastas p ON p.id = a.pasta_id
  WHERE a.deleted_at IS NULL
    AND to_tsvector('portuguese', a.nome || ' ' || COALESCE(a.descricao,''))
        @@ plainto_tsquery('portuguese', termo)
    AND (p_obra_id IS NULL OR a.obra_id = p_obra_id)
    AND (p_workspace_id IS NULL OR o.workspace_id = p_workspace_id)
  ORDER BY score DESC
  LIMIT match_count;
$$;
