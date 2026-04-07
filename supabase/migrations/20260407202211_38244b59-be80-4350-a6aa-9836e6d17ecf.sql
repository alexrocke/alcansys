
-- Remove the broad SELECT policy that exposes api_token to all company members
DROP POLICY IF EXISTS "Company members can view their instances" ON public.whatsapp_instances;

-- Add restricted SELECT: only admins and company owners/admins can see the full table
CREATE POLICY "Company admins can view their instances"
  ON public.whatsapp_instances
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR user_has_company_role(auth.uid(), company_id, 'owner'::membership_role)
    OR user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );

-- Grant SELECT on the safe view to authenticated users so non-admin members can still see basic instance info
GRANT SELECT ON public.whatsapp_instances_safe TO authenticated;
