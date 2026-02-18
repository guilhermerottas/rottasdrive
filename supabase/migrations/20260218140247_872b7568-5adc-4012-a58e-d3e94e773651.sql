
-- Table to store which viewers are restricted from accessing specific obras
CREATE TABLE public.obra_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  restricted_by uuid,
  UNIQUE(obra_id, user_id)
);

-- Enable RLS
ALTER TABLE public.obra_restrictions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage restrictions
CREATE POLICY "Admins can view restrictions"
  ON public.obra_restrictions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert restrictions"
  ON public.obra_restrictions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete restrictions"
  ON public.obra_restrictions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the obras SELECT policy to hide restricted obras from viewers
-- Drop the old permissive-like policy and create a new one
DROP POLICY IF EXISTS "Users can view obras" ON public.obras;

CREATE POLICY "Users can view obras"
  ON public.obras FOR SELECT
  USING (
    -- Admins and editors see everything
    can_edit(auth.uid())
    OR
    -- Others see obras they are NOT restricted from
    NOT EXISTS (
      SELECT 1 FROM public.obra_restrictions
      WHERE obra_restrictions.obra_id = obras.id
        AND obra_restrictions.user_id = auth.uid()
    )
  );
