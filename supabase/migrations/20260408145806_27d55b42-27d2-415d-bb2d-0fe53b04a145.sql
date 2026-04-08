-- Drop and recreate view with new columns
DROP VIEW IF EXISTS public.whatsapp_instances_safe;

CREATE VIEW public.whatsapp_instances_safe AS
SELECT 
  id,
  channel_id,
  company_id,
  user_id,
  instance_name,
  device_name,
  phone_number,
  status,
  is_connected,
  messages_sent,
  messages_received,
  last_sync,
  last_connection_at,
  error_message,
  webhook_url,
  created_at,
  updated_at
FROM whatsapp_instances;

-- Drop the overly permissive company-member SELECT policy that exposes tokens
DROP POLICY IF EXISTS "Company admins can view their instances" ON public.whatsapp_instances;

-- Create a restricted SELECT policy
CREATE POLICY "Admins and owners can view raw instances"
  ON public.whatsapp_instances
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR user_has_company_role(auth.uid(), company_id, 'owner'::membership_role)
    OR user_has_company_role(auth.uid(), company_id, 'admin'::membership_role)
  );