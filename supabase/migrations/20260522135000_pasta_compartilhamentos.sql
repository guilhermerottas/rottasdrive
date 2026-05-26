-- Fase 3: compartilhamento público de pastas por link.

CREATE TABLE public.pasta_compartilhamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id uuid NOT NULL UNIQUE REFERENCES public.pastas(id) ON DELETE CASCADE,
  short_code text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  permite_download boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pasta_compartilhamentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_compart_shortcode ON public.pasta_compartilhamentos(short_code);
CREATE TRIGGER update_pasta_compart_updated_at BEFORE UPDATE ON public.pasta_compartilhamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quem tem a ação 'link' na pasta (ou é editor/admin) gerencia o compartilhamento.
CREATE POLICY "Ver compartilhamentos"
  ON public.pasta_compartilhamentos FOR SELECT TO authenticated
  USING (public.pasta_tem_acao(auth.uid(), pasta_id, 'link'));
CREATE POLICY "Criar compartilhamentos"
  ON public.pasta_compartilhamentos FOR INSERT TO authenticated
  WITH CHECK (public.pasta_tem_acao(auth.uid(), pasta_id, 'link'));
CREATE POLICY "Atualizar compartilhamentos"
  ON public.pasta_compartilhamentos FOR UPDATE TO authenticated
  USING (public.pasta_tem_acao(auth.uid(), pasta_id, 'link'));
CREATE POLICY "Excluir compartilhamentos"
  ON public.pasta_compartilhamentos FOR DELETE TO authenticated
  USING (public.pasta_tem_acao(auth.uid(), pasta_id, 'link'));

-- Todas as pastas descendentes (incluindo a raiz) de uma pasta compartilhada.
-- Usada pela edge function para validar navegação dentro do link público.
CREATE OR REPLACE FUNCTION public.pasta_share_descendentes(_root_pasta_id uuid)
RETURNS TABLE(id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE sub AS (
    SELECT p.id, 0 AS depth FROM public.pastas p WHERE p.id = _root_pasta_id
    UNION ALL
    SELECT p.id, s.depth + 1 FROM public.pastas p
    JOIN sub s ON p.pasta_pai_id = s.id
    WHERE s.depth < 50
  )
  SELECT id FROM sub;
$$;
