import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAgentPresence } from '@/hooks/useAgentPresence';
import { useConversationNotifier } from '@/hooks/useConversationNotifier';
import { ConversationList } from '@/components/conversas/ConversationList';
import { ChatArea } from '@/components/conversas/ChatArea';

export default function Conversas() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const companyId = currentCompany?.id;
  const lockHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

  useAgentPresence(companyId);
  useConversationNotifier(companyId);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', companyId, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('conversations')
        .select('*, atendente:profiles(id, nome)')
        .eq('company_id', companyId)
        .order('ultima_mensagem_at', { ascending: false, nullsFirst: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, nome)')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation?.id,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation?.id) return;
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id, queryClient]);

  // Realtime for conversations list
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `company_id=eq.${companyId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  // Lock heartbeat - refresh lock every 30s while conversation is open
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;

    lockHeartbeatRef.current = setInterval(async () => {
      await supabase
        .from('conversations')
        .update({ locked_at: new Date().toISOString() } as any)
        .eq('id', selectedConversation.id)
        .eq('locked_by', user.id);
    }, 30000);

    return () => {
      if (lockHeartbeatRef.current) clearInterval(lockHeartbeatRef.current);
    };
  }, [selectedConversation?.id, user?.id]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation?.id && user?.id) {
        (supabase
          .from('conversations') as any)
          .update({ locked_by: null, locked_at: null })
          .eq('id', selectedConversation.id)
          .eq('locked_by', user.id);
      }
    };
  }, []);

  const tryLockConversation = useCallback(async (conv: any) => {
    if (!user?.id) return false;

    // Try to acquire lock with conditional update
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await (supabase
      .from('conversations') as any)
      .update({ locked_by: user.id, locked_at: new Date().toISOString() })
      .eq('id', conv.id)
      .or(`locked_by.is.null,locked_by.eq.${user.id},locked_at.lt.${fiveMinAgo}`)
      .select('id');

    if (error || !data?.length) {
      // Lock failed - find who has it
      const { data: lockedConv } = await supabase
        .from('conversations')
        .select('locked_by')
        .eq('id', conv.id)
        .single();

      if (lockedConv?.locked_by) {
        const { data: locker } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', lockedConv.locked_by as string)
          .single();

        toast({
          title: 'Conversa bloqueada',
          description: `Esta conversa está sendo atendida por ${locker?.nome || 'outro atendente'}`,
          variant: 'destructive',
        });
      }
      return false;
    }
    return true;
  }, [user?.id, toast]);

  const releaseLock = useCallback(async (convId: string) => {
    if (!user?.id) return;
    await (supabase
      .from('conversations') as any)
      .update({ locked_by: null, locked_at: null })
      .eq('id', convId)
      .eq('locked_by', user.id);
  }, [user?.id]);

  const handleSelectConversation = useCallback(async (conv: any) => {
    // Release previous lock
    if (selectedConversation?.id && selectedConversation.id !== conv.id) {
      await releaseLock(selectedConversation.id);
    }

    const locked = await tryLockConversation(conv);
    if (locked) {
      setSelectedConversation(conv);
    }
  }, [selectedConversation?.id, tryLockConversation, releaseLock]);

  const handleDeselectConversation = useCallback(async () => {
    if (selectedConversation?.id) {
      await releaseLock(selectedConversation.id);
    }
    setSelectedConversation(null);
  }, [selectedConversation?.id, releaseLock]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !selectedConversation || !companyId) return;

      if (selectedConversation.instance_id && selectedConversation.contato_telefone) {
        try {
          const { error: fnError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              instance_id: selectedConversation.instance_id,
              phone: selectedConversation.contato_telefone,
              message: newMessage,
            },
          });
          if (fnError) {
            console.error('WhatsApp send error:', fnError);
            toast({ title: 'Erro ao enviar via WhatsApp', description: fnError.message, variant: 'destructive' });
          }
        } catch (err) {
          console.error('WhatsApp send exception:', err);
        }
      }

      const { error } = await supabase.from('messages').insert([{
        conversation_id: selectedConversation.id,
        company_id: companyId,
        direction: 'outgoing' as const,
        content: newMessage,
        sender_type: 'humano' as const,
        sender_id: user?.id,
      }]);
      if (error) throw error;

      await supabase.from('conversations').update({
        ultima_mensagem: newMessage,
        ultima_mensagem_at: new Date().toISOString(),
        mensagens_count: (selectedConversation.mensagens_count || 0) + 1,
        atendente_tipo: 'humano' as const,
        atendente_id: user?.id,
        status: 'em_atendimento' as const,
      }).eq('id', selectedConversation.id);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleHandoff = async () => {
    if (!selectedConversation) return;
    const newType = selectedConversation.atendente_tipo === 'ia' ? 'humano' : 'ia';
    await supabase.from('conversations').update({
      atendente_tipo: newType as any,
      atendente_id: newType === 'humano' ? user?.id : null,
    }).eq('id', selectedConversation.id);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    toast({ title: `Atendimento transferido para ${newType === 'ia' ? 'IA' : 'humano'}` });
  };

  const filteredConversations = conversations.filter((c: any) =>
    c.contato_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contato_telefone?.includes(searchQuery)
  );

  const openCount = conversations.filter((c: any) => c.status === 'aberta' || c.status === 'em_atendimento').length;
  const iaCount = conversations.filter((c: any) => c.atendente_tipo === 'ia').length;

  if (!currentCompany) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma empresa para ver conversas.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={isLoading}
        openCount={openCount}
        iaCount={iaCount}
        isMobile={isMobile}
        companyId={companyId}
        userId={user?.id}
      />

      <ChatArea
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        onSendMessage={() => sendMessage.mutate()}
        isSending={sendMessage.isPending}
        onHandoff={handleHandoff}
        onBack={handleDeselectConversation}
        isMobile={isMobile}
      />
    </div>
  );
}
