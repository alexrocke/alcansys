
-- Drop overly permissive "USING true" SELECT policies that leak data across companies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Authenticated users can view automations" ON public.automations;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON public.marketing_campaigns;

-- Add restrictive policy on user_roles to prevent non-admin self-insert
CREATE POLICY "Only admins can write roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
