
-- Fix permissive INSERT policy: restrict to authenticated users inserting their own logs
DROP POLICY "System can insert logs" ON public.activity_logs;

-- The log_activity function uses SECURITY DEFINER so it bypasses RLS.
-- We don't need an INSERT policy for regular users.
