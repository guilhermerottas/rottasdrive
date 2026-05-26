-- Fase 6: vínculos de pasta entre workspaces.
-- Permite que uma pasta raiz de obra apareça também dentro de obras de outros workspaces.

CREATE TABLE public.pasta_workspace_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pasta_id uuid NOT NULL REFERENCES public.pastas(id) ON DELETE CASCADE,
  obra_destino_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  workspace_destino_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pasta_id, workspace_destino_id)
);

CREATE INDEX idx_pwv_obra_destino ON public.pasta_workspace_vinculos(obra_destino_id);
CREATE INDEX idx_pwv_workspace_destino ON public.pasta_workspace_vinculos(workspace_destino_id);
CREATE INDEX idx_pwv_pasta ON public.pasta_workspace_vinculos(pasta_id);

ALTER TABLE public.pasta_workspace_vinculos ENABLE ROW LEVEL SECURITY;

-- Trigger de validação
CREATE OR REPLACE FUNCTION public.pwv_validar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pasta_pai uuid;
  _pasta_obra uuid;
  _origem_ws uuid;
  _destino_obra_ws uuid;
BEGIN
  SELECT pasta_pai_id, obra_id INTO _pasta_pai, _pasta_obra
  FROM public.pastas WHERE id = NEW.pasta_id;

  IF _pasta_pai IS NOT NULL THEN
    RAISE EXCEPTION 'Apenas pastas raiz da obra podem ser vinculadas a outros workspaces';
  END IF;

  SELECT workspace_id INTO _origem_ws FROM public.obras WHERE id = _pasta_obra;
  SELECT workspace_id INTO _destino_obra_ws FROM public.obras WHERE id = NEW.obra_destino_id;

  IF _destino_obra_ws IS NULL THEN
    RAISE EXCEPTION 'Obra de destino inválida';
  END IF;

  IF _destino_obra_ws <> NEW.workspace_destino_id THEN
    RAISE EXCEPTION 'Obra de destino não pertence ao workspace de destino';
  END IF;

  IF _origem_ws = NEW.workspace_destino_id THEN
    RAISE EXCEPTION 'Não é possível vincular a pasta no próprio workspace de origem';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER pwv_validar_trigger
  BEFORE INSERT OR UPDATE ON public.pasta_workspace_vinculos
  FOR EACH ROW EXECUTE FUNCTION public.pwv_validar();

-- RLS
CREATE POLICY "Ver vinculos"
  ON public.pasta_workspace_vinculos FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_workspace_member(auth.uid(), workspace_destino_id)
    OR EXISTS (
      SELECT 1 FROM public.pastas p
      JOIN public.obras o ON o.id = p.obra_id
      WHERE p.id = pasta_id
        AND public.is_workspace_member(auth.uid(), o.workspace_id)
    )
  );

CREATE POLICY "Gerenciar vinculos"
  ON public.pasta_workspace_vinculos FOR INSERT TO authenticated
  WITH CHECK (public.pode_gerenciar_pasta(auth.uid(), pasta_id));

CREATE POLICY "Remover vinculos"
  ON public.pasta_workspace_vinculos FOR DELETE TO authenticated
  USING (public.pode_gerenciar_pasta(auth.uid(), pasta_id));

CREATE POLICY "Atualizar vinculos"
  ON public.pasta_workspace_vinculos FOR UPDATE TO authenticated
  USING (public.pode_gerenciar_pasta(auth.uid(), pasta_id))
  WITH CHECK (public.pode_gerenciar_pasta(auth.uid(), pasta_id));
