import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Could not play notification sound', e);
  }
}

export function useConversationNotifier(companyId: string | undefined) {
  const { toast } = useToast();
  const knownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`new-conversations-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const conv = payload.new as any;
          if (knownIds.current.has(conv.id)) return;
          knownIds.current.add(conv.id);

          playBeep();

          toast({
            title: '📩 Nova conversa',
            description: `${conv.contato_nome}${conv.contato_telefone ? ' (' + conv.contato_telefone + ')' : ''}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, toast]);
}
