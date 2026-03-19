import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MessageCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function PortalAutomacoes() {
  const { currentCompany } = useCompany();

  const { data: automations, isLoading } = useQuery({
    queryKey: ['portal-automations', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('status', 'ativa')
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany,
  });

  const { data: stats } = useQuery({
    queryKey: ['portal-automation-stats', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return { conversations: 0, messagesSent: 0, messagesReceived: 0 };
      const [convResult, instanceResult] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('company_id', currentCompany.id),
        supabase.from('whatsapp_instances').select('messages_sent, messages_received').eq('company_id', currentCompany.id),
      ]);
      const instances = instanceResult.data || [];
      return {
        conversations: convResult.count || 0,
        messagesSent: instances.reduce((sum, i) => sum + (i.messages_sent || 0), 0),
        messagesReceived: instances.reduce((sum, i) => sum + (i.messages_received || 0), 0),
      };
    },
    enabled: !!currentCompany,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automações</h1>
        <p className="text-muted-foreground">Acompanhe suas automações ativas e métricas de mensagens.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.conversations || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enviadas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.messagesSent || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebidas</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.messagesReceived || 0}</p></CardContent>
        </Card>
      </div>

      {/* Automations List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !automations?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma automação ativa no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {automations.map((auto) => (
            <Card key={auto.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {auto.nome}
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {auto.descricao && <p className="text-sm text-muted-foreground">{auto.descricao}</p>}
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Tipo: <strong>{auto.tipo}</strong></span>
                  {auto.retorno && (
                    <span className="text-muted-foreground">
                      Retorno: <strong className="text-green-600">R$ {Number(auto.retorno).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
