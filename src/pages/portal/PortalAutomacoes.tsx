import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, MessageCircle, ArrowDownLeft, ArrowUpRight, Headphones, TrendingUp, Megaphone, LifeBuoy } from 'lucide-react';
import { UazapInstanceSetup } from '@/components/automacoes/UazapInstanceSetup';

const categoryIcons: Record<string, React.ElementType> = {
  atendimento: Headphones,
  vendas: TrendingUp,
  marketing: Megaphone,
  suporte: LifeBuoy,
};

export default function PortalAutomacoes() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery({
    queryKey: ['portal-client-automations', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from('client_automations')
        .select('*, workflow_templates:template_id(*), whatsapp_instances:whatsapp_instance_id(status, phone_number, messages_sent, messages_received)')
        .eq('company_id', currentCompany.id)
        .order('created_at');
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
        <p className="text-muted-foreground">Seus workflows ativos e conexões WhatsApp.</p>
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

      {/* Automations */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !automations?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma automação atribuída no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {automations.map((auto: any) => {
            const template = auto.workflow_templates;
            const Icon = categoryIcons[template?.categoria] || Zap;
            const features = (template?.features as string[]) || [];
            const whatsappConnected = auto.whatsapp_instances?.status === 'connected';

            return (
              <Card key={auto.id} className="border-2 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {template?.nome || 'Workflow'}
                    </CardTitle>
                    <Badge className={auto.status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}>
                      {auto.status === 'ativa' ? 'Ativa' : auto.status === 'configurando' ? 'Configurando' : 'Inativa'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template?.descricao && (
                    <p className="text-sm text-muted-foreground">{template.descricao}</p>
                  )}

                  {features.length > 0 && (
                    <ul className="space-y-1">
                      {features.map((f: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* WhatsApp instance stats */}
                  {whatsappConnected && auto.whatsapp_instances && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                        <p className="font-bold">{auto.whatsapp_instances.messages_sent || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Recebidas</p>
                        <p className="font-bold">{auto.whatsapp_instances.messages_received || 0}</p>
                      </div>
                    </div>
                  )}

                  {/* UAZAP Setup if not connected */}
                  {!whatsappConnected && currentCompany && (
                    <UazapInstanceSetup
                      companyId={currentCompany.id}
                      automationId={auto.id}
                      instanceId={auto.whatsapp_instance_id}
                      onConnected={() => queryClient.invalidateQueries({ queryKey: ['portal-client-automations'] })}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
