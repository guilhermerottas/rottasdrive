-- Adicionar campo de cor na tabela pastas
ALTER TABLE public.pastas 
ADD COLUMN cor TEXT DEFAULT 'default';

-- Comentário para documentar os valores possíveis
COMMENT ON COLUMN public.pastas.cor IS 'Cor da pasta: default, documents, photos, videos, music';