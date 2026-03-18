
-- Enum for channel type
CREATE TYPE public.channel_type AS ENUM ('whatsapp', 'telegram', 'email', 'sms', 'webchat');

-- Enum for channel/instance status
CREATE TYPE public.channel_status AS ENUM ('connected', 'disconnected', 'connecting', 'error', 'pending');

-- Channels table
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo channel_type NOT NULL DEFAULT 'whatsapp',
  status channel_status NOT NULL DEFAULT 'pending',
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp instances table
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  status channel_status NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  webhook_url TEXT,
  api_token TEXT,
  last_sync TIMESTAMPTZ,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_received INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_channels_company ON public.channels(company_id);
CREATE INDEX idx_whatsapp_instances_channel ON public.whatsapp_instances(channel_id);
CREATE INDEX idx_whatsapp_instances_company ON public.whatsapp_instances(company_id);
CREATE INDEX idx_whatsapp_instances_status ON public.whatsapp_instances(status);

-- RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Channels RLS
CREATE POLICY "Admins can manage all channels" ON public.channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company members can view their channels" ON public.channels FOR SELECT TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company owners/admins can manage channels" ON public.channels FOR ALL TO authenticated
  USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin'));

-- WhatsApp instances RLS
CREATE POLICY "Admins can manage all instances" ON public.whatsapp_instances FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company members can view their instances" ON public.whatsapp_instances FOR SELECT TO authenticated
  USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Company owners/admins can manage instances" ON public.whatsapp_instances FOR ALL TO authenticated
  USING (user_has_company_role(auth.uid(), company_id, 'owner') OR user_has_company_role(auth.uid(), company_id, 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
