-- Adicionar colunas para lixeira na tabela arquivos
ALTER TABLE public.arquivos 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN deleted_by UUID DEFAULT NULL;

-- Criar índice para queries de lixeira
CREATE INDEX idx_arquivos_deleted_at ON public.arquivos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Função para limpeza automática de arquivos com mais de 30 dias na lixeira
CREATE OR REPLACE FUNCTION public.cleanup_deleted_arquivos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.arquivos 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;