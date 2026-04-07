
-- Fix security definer view issue
ALTER VIEW public.whatsapp_instances_safe SET (security_invoker = on);
