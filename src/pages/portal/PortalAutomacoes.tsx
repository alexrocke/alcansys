import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Zap, MessageCircle, ArrowDownLeft, ArrowUpRight, Headphones, TrendingUp, Megaphone, LifeBuoy, ShoppingCart, Check, Sparkles, Package } from 'lucide-react';
import { UazapInstanceSetup } from '@/components/automacoes/UazapInstanceSetup';
import { toast } from 'sonner';

const categoryIcons: Record<string, React.ElementType> = {
  atendimento: Headphones,
  vendas: TrendingUp,
  marketing: Megaphone,
  suporte: LifeBuoy,
};

const categoryLabels: Record<string, string> = {
  atendimento: 'Atendimento',
  vendas: 'Vendas',
  marketing: 'Marketing',
  suporte: 'Suporte',
};

export default function PortalAutomacoes() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [requestNote, setRequestNote] = useState('');
  const [selectedCombo, setSelectedCombo] = useState<any>(null);

  // Active automations
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

  // Available templates (marketplace)
  const { data: templates } = useQuery({
    queryKey: ['portal-workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('ativo', true)
        .order('categoria')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Available combos
  const { data: combos } = useQuery({
    queryKey: ['portal-automation-combos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_combos')
        .select('*, automation_combo_items(template_id, workflow_templates:template_id(nome, categoria))')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
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

  // IDs of templates already active for this client
  const activeTemplateIds = new Set((automations || []).map((a: any) => a.template_id));

  // Request automation mutation - creates a quote_request
  const requestMutation = useMutation({
    mutationFn: async ({ templateId, templateName, note }: { templateId: string; templateName: string; note: string }) => {
      if (!currentCompany) throw new Error('Sem empresa');
      const { error } = await supabase.from('quote_requests').insert({
        company_id: currentCompany.id,
        nome_contato: currentCompany.nome,
        mensagem: `Solicitação de automação: ${templateName}${note ? `\n\nObservação: ${note}` : ''}`,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitação enviada! Nossa equipe entrará em contato para ativar sua automação.');
      setSelectedTemplate(null);
      setSelectedCombo(null);
      setRequestNote('');
      queryClient.invalidateQueries({ queryKey: ['portal-quote-requests'] });
    },
    onError: () => toast.error('Erro ao enviar solicitação'),
  });

  // Filter templates not yet active
  const availableTemplates = (templates || []).filter((t: any) => !activeTemplateIds.has(t.id));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Automações</h1>
        <p className="text-muted-foreground">Seus workflows ativos e catálogo de automações disponíveis.</p>
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

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Minhas Automações
            {automations?.length ? <Badge variant="secondary" className="ml-1">{automations.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        {/* Marketplace / Catalog */}
        <TabsContent value="marketplace" className="space-y-8">
          {/* Combos Section */}
          {combos && combos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pacotes Promocionais</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {combos.map((combo: any) => {
                  const comboTemplateNames = (combo.automation_combo_items || []).map(
                    (item: any) => item.workflow_templates?.nome
                  ).filter(Boolean);
                  
                  return (
                    <Card key={combo.id} className="border-2 border-primary/20 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {combo.nome}
                          </CardTitle>
                          <Badge className="bg-primary/10 text-primary border-primary/20">Combo</Badge>
                        </div>
                        {combo.descricao && <CardDescription>{combo.descricao}</CardDescription>}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {comboTemplateNames.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Inclui:</p>
                            {comboTemplateNames.map((name: string, i: number) => (
                              <p key={i} className="text-sm flex items-center gap-1.5">
                                <Check className="h-3 w-3 text-primary" /> {name}
                              </p>
                            ))}
                          </div>
                        )}
                        <div className="flex items-end justify-between pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground line-through">
                              R$ {Number(combo.preco_original).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              R$ {Number(combo.preco_combo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </p>
                          </div>
                          <Button onClick={() => setSelectedCombo(combo)}>
                            <ShoppingCart className="h-4 w-4 mr-2" /> Contratar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Templates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Automações Individuais</h2>
            </div>
            {!availableTemplates.length ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Check className="h-12 w-12 text-primary mb-4" />
                  <p className="text-muted-foreground">Você já possui todas as automações disponíveis!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableTemplates.map((template: any) => {
                  const Icon = categoryIcons[template.categoria] || Zap;
                  const features = (template.features as string[]) || [];

                  return (
                    <Card key={template.id} className="border-2 rounded-2xl hover:shadow-md transition-shadow flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.nome}</CardTitle>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {categoryLabels[template.categoria] || template.categoria}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        {template.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{template.descricao}</p>
                        )}
                        {features.length > 0 && (
                          <ul className="space-y-1">
                            {features.slice(0, 3).map((f: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Check className="h-3 w-3 text-primary" /> {f}
                              </li>
                            ))}
                            {features.length > 3 && (
                              <li className="text-xs text-muted-foreground">+{features.length - 3} mais</li>
                            )}
                          </ul>
                        )}
                        <div className="mt-auto pt-3 border-t flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            {Number(template.preco) > 0
                              ? `R$ ${Number(template.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
                              : 'Gratuito'}
                          </span>
                          <Button size="sm" onClick={() => setSelectedTemplate(template)}>
                            <ShoppingCart className="h-4 w-4 mr-1" /> Contratar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Active Automations */}
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !automations?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma automação ativa.</p>
                <p className="text-sm text-muted-foreground mt-1">Explore o catálogo para contratar automações!</p>
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
        </TabsContent>
      </Tabs>

      {/* Request Dialog - Individual Template */}
      <Dialog open={!!selectedTemplate} onOpenChange={(v) => { if (!v) { setSelectedTemplate(null); setRequestNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Contratar: {selectedTemplate?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{selectedTemplate?.descricao}</p>
              <p className="text-lg font-bold text-primary mt-2">
                {Number(selectedTemplate?.preco) > 0
                  ? `R$ ${Number(selectedTemplate?.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
                  : 'Gratuito'}
              </p>
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Alguma necessidade específica ou personalização?"
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              disabled={requestMutation.isPending}
              onClick={() => {
                if (selectedTemplate) {
                  requestMutation.mutate({
                    templateId: selectedTemplate.id,
                    templateName: selectedTemplate.nome,
                    note: requestNote,
                  });
                }
              }}
            >
              {requestMutation.isPending ? 'Enviando...' : 'Solicitar Ativação'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Nossa equipe irá configurar e ativar a automação para você.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Dialog - Combo */}
      <Dialog open={!!selectedCombo} onOpenChange={(v) => { if (!v) { setSelectedCombo(null); setRequestNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Contratar Pacote: {selectedCombo?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {selectedCombo?.descricao && (
                <p className="text-sm text-muted-foreground">{selectedCombo.descricao}</p>
              )}
              <div className="flex items-end gap-2">
                <p className="text-xs text-muted-foreground line-through">
                  R$ {Number(selectedCombo?.preco_original || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-lg font-bold text-primary">
                  R$ {Number(selectedCombo?.preco_combo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </p>
              </div>
            </div>
            <div>
              <Label>Observação (opcional)</Label>
              <Textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Alguma necessidade específica?"
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              disabled={requestMutation.isPending}
              onClick={() => {
                if (selectedCombo) {
                  requestMutation.mutate({
                    templateId: selectedCombo.id,
                    templateName: `Pacote: ${selectedCombo.nome}`,
                    note: requestNote,
                  });
                }
              }}
            >
              {requestMutation.isPending ? 'Enviando...' : 'Solicitar Ativação do Pacote'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Nossa equipe irá configurar todas as automações do pacote para você.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
