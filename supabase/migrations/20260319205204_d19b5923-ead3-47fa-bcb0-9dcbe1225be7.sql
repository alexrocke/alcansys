-- Create default company
INSERT INTO public.companies (id, nome, slug, plano, ativo)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alcansys', 'alcansys', 'enterprise', true)
ON CONFLICT DO NOTHING;

-- Create membership linking the admin user to the company as owner
INSERT INTO public.memberships (user_id, company_id, role)
VALUES ('7d5b6c13-b3d4-4164-9098-88e87cf6b2bd', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'owner')
ON CONFLICT DO NOTHING;