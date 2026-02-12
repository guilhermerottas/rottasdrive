
CREATE POLICY "Anyone can validate invites by token"
ON public.invites
FOR SELECT
TO anon, authenticated
USING (true);
