UPDATE public.landing_config
SET config = jsonb_set(coalesce(config,'{}'::jsonb), '{whatsapp_url}', '"https://wa.me/5548988660826"')
WHERE section = 'footer';