import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const HEARTBEAT_INTERVAL = 30000; // 30s

export function useAgentPresence(companyId: string | undefined) {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const upsertPresence = useCallback(async () => {
    if (!user?.id || !companyId) return;
    await supabase
      .from('agent_presence' as any)
      .upsert(
        {
          user_id: user.id,
          company_id: companyId,
          last_seen_at: new Date().toISOString(),
          status: 'online',
        },
        { onConflict: 'user_id,company_id' }
      );
  }, [user?.id, companyId]);

  const setOffline = useCallback(async () => {
    if (!user?.id || !companyId) return;
    await supabase
      .from('agent_presence' as any)
      .update({ status: 'offline', last_seen_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('company_id', companyId);
  }, [user?.id, companyId]);

  useEffect(() => {
    if (!user?.id || !companyId) return;

    upsertPresence();
    intervalRef.current = setInterval(upsertPresence, HEARTBEAT_INTERVAL);

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page close
      const url = `${(supabase as any).supabaseUrl}/rest/v1/agent_presence?user_id=eq.${user.id}&company_id=eq.${companyId}`;
      const body = JSON.stringify({ status: 'offline', last_seen_at: new Date().toISOString() });
      navigator.sendBeacon?.(url); // best-effort
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user?.id, companyId, upsertPresence, setOffline]);
}
