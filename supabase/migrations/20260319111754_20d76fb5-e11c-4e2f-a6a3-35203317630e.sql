INSERT INTO public.user_roles (user_id, role)
VALUES ('7d5b6c13-b3d4-4164-9098-88e87cf6b2bd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;