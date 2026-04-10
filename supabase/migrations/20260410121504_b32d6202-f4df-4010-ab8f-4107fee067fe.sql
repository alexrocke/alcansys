-- 1. Fix user_roles: change permissive ALL policy from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix services: scope SELECT to company members
DROP POLICY IF EXISTS "Authenticated can view active services" ON public.services;
CREATE POLICY "Company members can view active services"
  ON public.services
  FOR SELECT
  TO authenticated
  USING (
    ativo = true
    AND (
      company_id IN (SELECT get_user_company_ids(auth.uid()))
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 3. Remove sensitive columns from whatsapp_instances (already migrated to secrets table)
ALTER TABLE public.whatsapp_instances DROP COLUMN IF EXISTS api_token;

-- 4. Remove whatsapp_instances from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'whatsapp_instances'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.whatsapp_instances;
  END IF;
END $$;