-- Set Guilherme as admin (first user)
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = '9992def5-ed49-461b-b1f1-7d263ffa50a7';