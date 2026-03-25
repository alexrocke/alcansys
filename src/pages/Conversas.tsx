import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Send, Bot, User, Phone, ArrowLeftRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando: 'Aguardando',
  resolvida: 'Resolvida',
  arquivada: 'Arquivada',
};

const statusColors: Record<string, string> = {
  aberta: 'bg-blue-500/10 text-blue-700 border-blue-200',
  em_atendimento: 'bg-green-500/10 text-green-700 border-green-200',
  aguardando: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  resolvida: 'bg-gray-500/10 text-gray-700 border-gray-200',
  arquivada: 'bg-gray-500/10 text-gray-500 border-gray-200',
};

export default function Conversas() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const companyId = currentCompany?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !selectedConversation || !companyId) return;

      // Try to send via WhatsApp if conversation has an instance
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

      // Update conversation
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
      {/* Sidebar - Conversation List */}
      <div className="w-full md:w-96 border-r border-border flex flex-col bg-background" style={{ display: selectedConversation && window.innerWidth < 768 ? 'none' : 'flex' }}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Conversas</h1>
            <div className="flex gap-2">
              <Badge variant="outline">{openCount} abertas</Badge>
              <Badge variant="secondary" className="gap-1"><Bot className="h-3 w-3" />{iaCount} IA</Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <p className="p-4 text-center text-muted-foreground">Carregando...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma conversa</p>
            </div>
          ) : (
            filteredConversations.map((conv: any) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{conv.contato_nome}</p>
                      {conv.atendente_tipo === 'ia' ? (
                        <Bot className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.ultima_mensagem || 'Sem mensagens'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[conv.status]}`}>
                      {statusLabels[conv.status]}
                    </Badge>
                    {conv.ultima_mensagem_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(conv.ultima_mensagem_at), 'HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col" style={{ display: !selectedConversation && window.innerWidth < 768 ? 'none' : 'flex' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-background">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedConversation(null)}>←</Button>
                <div>
                  <p className="font-semibold text-foreground">{selectedConversation.contato_nome}</p>
                  <div className="flex items-center gap-2">
                    {selectedConversation.contato_telefone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{selectedConversation.contato_telefone}
                      </span>
                    )}
                    <Badge variant="outline" className={statusColors[selectedConversation.status]}>
                      {statusLabels[selectedConversation.status]}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleHandoff} className="gap-1">
                  <ArrowLeftRight className="h-4 w-4" />
                  {selectedConversation.atendente_tipo === 'ia' ? 'Assumir' : 'Passar p/ IA'}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.direction === 'outgoing'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {msg.direction === 'outgoing' && msg.sender_type && (
                        <div className="flex items-center gap-1 mb-1">
                          {msg.sender_type === 'ia' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          <span className="text-[10px] opacity-75">
                            {msg.sender_type === 'ia' ? 'IA' : msg.sender?.nome || 'Agente'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.direction === 'outgoing' ? 'opacity-75' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage.mutate();
                    }
                  }}
                />
                <Button onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Selecione uma conversa</h2>
              <p className="text-muted-foreground">Escolha uma conversa na lista ao lado para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
