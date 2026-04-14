import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAgentPresence } from "@/hooks/useAgentPresence";
import { useConversationNotifier } from "@/hooks/useConversationNotifier";
import { toast as sonnerToast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationList } from "@/components/conversas/ConversationList";
import { ChatArea } from "@/components/conversas/ChatArea";
import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Loader2,
  
  CheckCircle2,
  MessageSquare,
  Settings,
} from "lucide-react";

interface InstanceData {
  id: string;
  instance_name: string;
  device_name: string;
  server_url: string;
  status: string;
  is_connected: boolean;
  phone_number: string | null;
  last_connection_at: string | null;
  created_at: string;
}

export default function WhatsApp() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const companyId = currentCompany?.id;

  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const lockRef = useRef(false);
  const lockHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Conversation state
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

  useAgentPresence(companyId);
  useConversationNotifier(companyId);

  // ── Instance management ──
  const callManageFunction = useCallback(async (action: string) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-manage", {
      body: { action },
    });
    if (error) throw new Error(error.message || "Erro na comunicação");
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadInstance = useCallback(async () => {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      setError("");
      const data = await callManageFunction("get");
      setInstance(data.instance || null);
      if (data.instance && !data.instance.is_connected) await fetchQrCode();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  }, [callManageFunction]);

  const createInstance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await callManageFunction("get-or-create");
      setInstance(data.instance);
      if (data.is_new) sonnerToast.success("Instância WhatsApp criada!");
      if (data.instance && !data.instance.is_connected) await fetchQrCode();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [callManageFunction]);

  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const data = await callManageFunction("qrcode");
      if (data.connected) {
        setInstance((prev) => prev ? { ...prev, status: "connected", is_connected: true } : prev);
        setQrCode("");
        sonnerToast.success("WhatsApp Conectado!");
      } else if (data.qrcode) {
        setQrCode(data.qrcode);
      }
    } catch (e: any) {
      console.error("fetchQrCode error:", e);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      await callManageFunction("disconnect");
      setInstance((prev) => prev ? { ...prev, status: "disconnected", is_connected: false } : prev);
      setQrCode("");
      sonnerToast.info("Instância desconectada");
      await fetchQrCode();
    } catch (e: any) {
      sonnerToast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a instância? Isso é irreversível.")) return;
    setActionLoading(true);
    try {
      await callManageFunction("delete");
      setInstance(null);
      setQrCode("");
      sonnerToast.success("Instância removida");
    } catch (e: any) {
      sonnerToast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadInstance();
  }, [user, loadInstance]);

  useEffect(() => {
    if (!instance || instance.is_connected) return;
    const interval = setInterval(async () => {
      try {
        const data = await callManageFunction("get");
        if (data?.instance?.is_connected) {
          setInstance(data.instance);
          setQrCode("");
          sonnerToast.success("WhatsApp Conectado!");
        }
      } catch (e) {}
    }, 15000);
    return () => clearInterval(interval);
  }, [instance, callManageFunction]);

  // ── Conversations ──
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['whatsapp-conversations', companyId, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('conversations')
        .select('*, atendente:profiles(id, nome)')
        .eq('company_id', companyId)
        .order('ultima_mensagem_at', { ascending: false, nullsFirst: false });
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!instance?.is_connected,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversation?.id],
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

  // Realtime messages
  useEffect(() => {
    if (!selectedConversation?.id) return;
    const channel = supabase
      .channel(`wa-messages-${selectedConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', selectedConversation.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id, queryClient]);

  // Realtime conversations list
  useEffect(() => {
    if (!companyId || !instance?.is_connected) return;
    const channel = supabase
      .channel('wa-conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `company_id=eq.${companyId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, instance?.is_connected, queryClient]);

  // Lock heartbeat
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;
    lockHeartbeatRef.current = setInterval(async () => {
      await supabase
        .from('conversations')
        .update({ locked_at: new Date().toISOString() } as any)
        .eq('id', selectedConversation.id)
        .eq('locked_by', user.id);
    }, 30000);
    return () => { if (lockHeartbeatRef.current) clearInterval(lockHeartbeatRef.current); };
  }, [selectedConversation?.id, user?.id]);

  const tryLockConversation = useCallback(async (conv: any) => {
    if (!user?.id) return false;
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await (supabase.from('conversations') as any)
      .update({ locked_by: user.id, locked_at: new Date().toISOString() })
      .eq('id', conv.id)
      .or(`locked_by.is.null,locked_by.eq.${user.id},locked_at.lt.${fiveMinAgo}`)
      .select('id');
    if (error || !data?.length) {
      const { data: lockedConv } = await supabase.from('conversations').select('locked_by').eq('id', conv.id).single();
      if (lockedConv?.locked_by) {
        const { data: locker } = await supabase.from('profiles').select('nome').eq('id', lockedConv.locked_by as string).single();
        toast({ title: 'Conversa bloqueada', description: `Atendida por ${locker?.nome || 'outro atendente'}`, variant: 'destructive' });
      }
      return false;
    }
    return true;
  }, [user?.id, toast]);

  const releaseLock = useCallback(async (convId: string) => {
    if (!user?.id) return;
    await (supabase.from('conversations') as any).update({ locked_by: null, locked_at: null }).eq('id', convId).eq('locked_by', user.id);
  }, [user?.id]);

  const handleSelectConversation = useCallback(async (conv: any) => {
    if (selectedConversation?.id && selectedConversation.id !== conv.id) await releaseLock(selectedConversation.id);
    const locked = await tryLockConversation(conv);
    if (locked) setSelectedConversation(conv);
  }, [selectedConversation?.id, tryLockConversation, releaseLock]);

  const handleDeselectConversation = useCallback(async () => {
    if (selectedConversation?.id) await releaseLock(selectedConversation.id);
    setSelectedConversation(null);
  }, [selectedConversation?.id, releaseLock]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !selectedConversation || !companyId) return;
      if (selectedConversation.instance_id && selectedConversation.contato_telefone) {
        try {
          const { error: fnError } = await supabase.functions.invoke('send-whatsapp', {
            body: { instance_id: selectedConversation.instance_id, phone: selectedConversation.contato_telefone, message: newMessage },
          });
          if (fnError) toast({ title: 'Erro ao enviar via WhatsApp', description: fnError.message, variant: 'destructive' });
        } catch (err) { console.error('WhatsApp send exception:', err); }
      }
      const { error } = await supabase.from('messages').insert([{
        conversation_id: selectedConversation.id, company_id: companyId, direction: 'outgoing' as const,
        content: newMessage, sender_type: 'humano' as const, sender_id: user?.id,
      }]);
      if (error) throw error;
      await supabase.from('conversations').update({
        ultima_mensagem: newMessage, ultima_mensagem_at: new Date().toISOString(),
        mensagens_count: (selectedConversation.mensagens_count || 0) + 1,
        atendente_tipo: 'humano' as const, atendente_id: user?.id, status: 'em_atendimento' as const,
      }).eq('id', selectedConversation.id);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  const handleHandoff = async () => {
    if (!selectedConversation) return;
    const newType = selectedConversation.atendente_tipo === 'ia' ? 'humano' : 'ia';
    await supabase.from('conversations').update({
      atendente_tipo: newType as any, atendente_id: newType === 'humano' ? user?.id : null,
    }).eq('id', selectedConversation.id);
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    toast({ title: `Atendimento transferido para ${newType === 'ia' ? 'IA' : 'humano'}` });
  };

  const filteredConversations = conversations.filter((c: any) =>
    c.contato_nome.toLowerCase().includes(searchQuery.toLowerCase()) || c.contato_telefone?.includes(searchQuery)
  );
  const openCount = conversations.filter((c: any) => c.status === 'aberta' || c.status === 'em_atendimento').length;
  const iaCount = conversations.filter((c: any) => c.atendente_tipo === 'ia').length;

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Faça login para gerenciar seu WhatsApp.</p>
      </div>
    );
  }

  // Show loading/error/no-instance states
  if (loading || error || !instance) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conexão WhatsApp</p>
        </div>
        {loading ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando instância...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <Smartphone className="h-10 w-10 text-muted-foreground" />
              <p className="text-foreground font-medium">Instância não encontrada</p>
              <p className="text-sm text-muted-foreground text-center">Não foi possível localizar sua instância WhatsApp. Clique abaixo para criar uma nova.</p>
              <Button onClick={createInstance}>Criar Instância</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4">
              <Smartphone className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma instância encontrada.</p>
              <Button onClick={createInstance}>Criar Instância</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Not connected — show QR code
  if (!instance.is_connected) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Conecte seu WhatsApp</p>
        </div>
        <Card>
          <CardContent className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Escaneie o QR Code</h2>
              <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Desconectado</Badge>
            </div>
            <div className="flex justify-center">
              {qrLoading ? (
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 rounded-lg border border-border" />
              ) : (
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm text-center px-4">Clique em "Atualizar QR" para gerar o código</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo → Escaneie o código
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchQrCode} disabled={qrLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${qrLoading ? "animate-spin" : ""}`} />Atualizar QR
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                <Trash2 className="h-4 w-4 mr-2" />Remover
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center italic">O status é verificado automaticamente a cada 15 segundos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── CONNECTED: Tabs with Conversations + Settings ──
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <Tabs defaultValue="conversas" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 pt-4 pb-0 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />Conectado
              </Badge>
              {instance.phone_number && (
                <span className="text-xs text-muted-foreground">{instance.phone_number}</span>
              )}
            </div>
          </div>
          <TabsList>
            <TabsTrigger value="conversas" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Conversas</span>
              {openCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{openCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="conexao" className="gap-1.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Conexão</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversas" className="flex-1 overflow-hidden mt-0 p-0">
          <div className="flex h-full overflow-hidden">
            <ConversationList
              conversations={filteredConversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              isLoading={convsLoading}
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
        </TabsContent>

        <TabsContent value="conexao" className="flex-1 overflow-auto mt-0 p-4">
          <Card className="border-green-500/30 bg-green-500/5 max-w-2xl mx-auto">
            <CardContent className="py-8 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">WhatsApp Conectado!</h2>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground text-center">
                <p>Instância: <span className="font-mono text-foreground">{instance.instance_name}</span></p>
                {instance.phone_number && <p>Número: <span className="text-foreground">{instance.phone_number}</span></p>}
                {instance.last_connection_at && <p>Última conexão: {new Date(instance.last_connection_at).toLocaleString("pt-BR")}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={handleDisconnect} disabled={actionLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? "animate-spin" : ""}`} />Reconectar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                  <Trash2 className="h-4 w-4 mr-2" />Remover Instância
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
