-- Create blocked_users table to track users who have been blocked
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  blocked_by uuid,
  reason text
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view blocked users
CREATE POLICY "Admins can view blocked users"
ON public.blocked_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can block users
CREATE POLICY "Admins can block users"
ON public.blocked_users
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can unblock users
CREATE POLICY "Admins can unblock users"
ON public.blocked_users
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_users
    WHERE user_id = _user_id
  )
$$;