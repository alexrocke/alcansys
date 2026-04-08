CREATE OR REPLACE FUNCTION public.log_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _action text;
  _entity_name text;
  _user_id uuid;
  _company_id uuid;
  _record jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _record := to_jsonb(OLD);
    _action := 'excluiu';
  ELSE
    _record := to_jsonb(NEW);
    IF TG_OP = 'INSERT' THEN
      _action := 'criou';
    ELSE
      _action := 'atualizou';
    END IF;
  END IF;

  _entity_name := COALESCE(
    _record->>'nome',
    _record->>'titulo',
    _record->>'descricao',
    _record->>'instance_name',
    ''
  );
  _company_id := (_record->>'company_id')::uuid;
  _user_id := auth.uid();

  INSERT INTO public.activity_logs (user_id, company_id, action, entity_type, entity_id, entity_name)
  VALUES (
    _user_id,
    _company_id,
    _action,
    TG_TABLE_NAME,
    (_record->>'id')::uuid,
    _entity_name
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;