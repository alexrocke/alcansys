INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'alexrockefragasb@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles SET status = 'ativo'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'alexrockefragasb@gmail.com');