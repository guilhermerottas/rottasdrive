
-- Allow newly registered users to mark their invite as accepted
CREATE POLICY "Users can accept their own invites"
ON public.invites
FOR UPDATE
TO anon, authenticated
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status = 'accepted');
