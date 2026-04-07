
-- 1. Fix storage: scope documents bucket SELECT to company members only
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

CREATE POLICY "Company members can view their documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.companies
      WHERE id IN (SELECT public.get_user_company_ids(auth.uid()))
    )
  );

-- 2. Create a secure view for whatsapp_instances that excludes sensitive fields
CREATE OR REPLACE VIEW public.whatsapp_instances_safe AS
  SELECT id, channel_id, company_id, instance_name, phone_number, status,
         messages_sent, messages_received, last_sync, error_message,
         uazap_instance_id, created_at, updated_at
  FROM public.whatsapp_instances;

-- 3. Add webhook secret validation support
-- Add a webhook_secret column to whatsapp_instances for signature verification
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS webhook_secret text;
