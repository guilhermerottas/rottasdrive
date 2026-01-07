-- Tabela de Obras
CREATE TABLE public.obras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Pastas (hierárquica)
CREATE TABLE public.pastas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  pasta_pai_id UUID REFERENCES public.pastas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Arquivos
CREATE TABLE public.arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  pasta_id UUID REFERENCES public.pastas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  tipo TEXT,
  tamanho BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_pastas_obra_id ON public.pastas(obra_id);
CREATE INDEX idx_pastas_pasta_pai_id ON public.pastas(pasta_pai_id);
CREATE INDEX idx_arquivos_obra_id ON public.arquivos(obra_id);
CREATE INDEX idx_arquivos_pasta_id ON public.arquivos(pasta_id);

-- Enable RLS (políticas públicas por enquanto)
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sem autenticação)
CREATE POLICY "Acesso público obras" ON public.obras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público pastas" ON public.pastas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público arquivos" ON public.arquivos FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pastas_updated_at BEFORE UPDATE ON public.pastas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_arquivos_updated_at BEFORE UPDATE ON public.arquivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para arquivos
INSERT INTO storage.buckets (id, name, public) VALUES ('arquivos', 'arquivos', true);

-- Políticas de storage públicas
CREATE POLICY "Acesso público upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'arquivos');
CREATE POLICY "Acesso público download" ON storage.objects FOR SELECT USING (bucket_id = 'arquivos');
CREATE POLICY "Acesso público delete" ON storage.objects FOR DELETE USING (bucket_id = 'arquivos');
CREATE POLICY "Acesso público update" ON storage.objects FOR UPDATE USING (bucket_id = 'arquivos');