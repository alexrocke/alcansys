-- Add new columns for WhatsApi.my integration
ALTER TABLE public.whatsapp_instances 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS server_url TEXT,
  ADD COLUMN IF NOT EXISTS instance_token TEXT,
  ADD COLUMN IF NOT EXISTS token TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT DEFAULT 'Alcansys',
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_connection_at TIMESTAMPTZ;

-- Add RLS policy for users to manage their own instances
CREATE POLICY "Users can manage own instances"
  ON public.whatsapp_instances
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);