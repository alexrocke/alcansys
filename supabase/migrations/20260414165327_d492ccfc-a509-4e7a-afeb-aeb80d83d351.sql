-- Add missing memberships for existing users
INSERT INTO public.memberships (user_id, company_id, role)
VALUES 
  ('b8c1cf39-1154-4549-be12-369d1bec7299', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'member'),
  ('af5b62c8-a54b-44a1-8896-4a8ad154332d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin')
ON CONFLICT DO NOTHING;