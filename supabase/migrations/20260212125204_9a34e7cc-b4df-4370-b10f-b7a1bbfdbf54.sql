
-- Drop the overly permissive policy
DROP POLICY "Anyone can validate invites by token" ON public.invites;

-- Create a more restrictive policy: anon users can only see pending, non-expired invites
CREATE POLICY "Anyone can validate pending invites"
ON public.invites
FOR SELECT
TO anon, authenticated
USING (status = 'pending' AND expires_at > now());
