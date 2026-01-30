-- Adicionar coluna uploaded_by para rastrear quem fez o upload
ALTER TABLE public.arquivos
ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id);

-- Comentário para documentação
COMMENT ON COLUMN public.arquivos.uploaded_by IS 'ID do usuário que fez o upload do arquivo';