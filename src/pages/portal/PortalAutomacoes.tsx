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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, MessageCircle, ArrowDownLeft, ArrowUpRight, Headphones, TrendingUp, Megaphone, LifeBuoy, ShoppingCart, Check, Sparkles, Package, CreditCard, QrCode, Copy, Settings, Save, Loader2 } from 'lucide-react';
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
  const [selectedCombo, setSelectedCombo] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerName, setPayerName] = useState('');
  const [pixData, setPixData] = useState<{ qr: string; qrBase64: string } | null>(null);
  const [configDialog, setConfigDialog] = useState<any>(null);
  const [configPrompt, setConfigPrompt] = useState('');
  const [configCompanyInfo, setConfigCompanyInfo] = useState('');
  const [configInstructions, setConfigInstructions] = useState('');

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

  const activeTemplateIds = new Set((automations || []).map((a: any) => a.template_id));

  // Payment mutation - creates payment via Mercado Pago
  const paymentMutation = useMutation({
    mutationFn: async ({ templateIds, name, price, isCombo }: { templateIds: string[]; name: string; price: number; isCombo: boolean }) => {
      if (!currentCompany) throw new Error('Sem empresa');

      const { data, error } = await supabase.functions.invoke('mp-create-payment', {
        body: {
          company_id: currentCompany.id,
          valor: price,
          descricao: `Automação: ${name}`,
          method: paymentMethod,
          payer_email: payerEmail || undefined,
          payer_name: payerName || undefined,
          automation_provision: {
            template_ids: templateIds,
            is_combo: isCombo,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (paymentMethod === 'pix' && data?.payment?.pix_qr_code) {
        setPixData({ qr: data.payment.pix_qr_code, qrBase64: data.payment.pix_qr_code_base64 || '' });
        setSelectedTemplate(null);
        setSelectedCombo(null);
        toast.success('Pix gerado! Escaneie o QR Code para pagar.');
      } else if (paymentMethod === 'credit_card' && data?.init_point) {
        window.open(data.init_point, '_blank');
        toast.success('Checkout aberto em nova aba. Após o pagamento, sua automação será ativada automaticamente.');
        setSelectedTemplate(null);
        setSelectedCombo(null);
      } else if (paymentMethod === 'boleto' && data?.payment?.boleto_url) {
        window.open(data.payment.boleto_url, '_blank');
        toast.success('Boleto gerado! Após o pagamento, sua automação será ativada automaticamente.');
        setSelectedTemplate(null);
        setSelectedCombo(null);
      } else {
        toast.success('Pagamento processado!');
        setSelectedTemplate(null);
        setSelectedCombo(null);
      }
      queryClient.invalidateQueries({ queryKey: ['portal-client-automations'] });
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar pagamento'),
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ automationId, prompt, config }: { automationId: string; prompt: string; config: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('client_automations')
        .update({
          prompt,
          config: config as any,
          status: 'ativa' as any,
        })
        .eq('id', automationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuração salva! Automação ativada.');
      setConfigDialog(null);
      queryClient.invalidateQueries({ queryKey: ['portal-client-automations'] });
    },
    onError: () => toast.error('Erro ao salvar configuração'),
  });

  const availableTemplates = (templates || []).filter((t: any) => !activeTemplateIds.has(t.id));

  const openConfig = (automation: any) => {
    setConfigDialog(automation);
    setConfigPrompt(automation.prompt || automation.workflow_templates?.prompt_template || '');
    const cfg = automation.config as Record<string, unknown> || {};
    setConfigCompanyInfo((cfg.company_info as string) || '');
    setConfigInstructions((cfg.ai_instructions as string) || '');
  };

  const handleSaveConfig = () => {
    if (!configDialog) return;
    const existingConfig = (configDialog.config as Record<string, unknown>) || {};
    saveConfigMutation.mutate({
      automationId: configDialog.id,
      prompt: configPrompt,
      config: {
        ...existingConfig,
        company_info: configCompanyInfo,
        ai_instructions: configInstructions,
        configured_at: new Date().toISOString(),
      },
    });
  };

  const handleFreeActivation = async (templateId: string, templateName: string) => {
    if (!currentCompany) return;
    const { error } = await supabase.from('client_automations').insert({
      company_id: currentCompany.id,
      template_id: templateId,
      status: 'configurando' as any,
      config: { auto_provisioned: true, free: true },
    });
    if (error) {
      toast.error('Erro ao ativar automação');
    } else {
      toast.success(`${templateName} ativada! Configure seu WhatsApp e prompts.`);
      queryClient.invalidateQueries({ queryKey: ['portal-client-automations'] });
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Automações</h1>
        <p className="text-muted-foreground">Contrate, configure e ative suas automações de WhatsApp com IA.</p>
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

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-8">
          {/* Combos */}
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
                            <CreditCard className="h-4 w-4 mr-2" /> Contratar
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
                  const price = Number(template.preco) || 0;
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
                            {price > 0
                              ? `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
                              : 'Gratuito'}
                          </span>
                          <Button size="sm" onClick={() => setSelectedTemplate(template)}>
                            <CreditCard className="h-4 w-4 mr-1" /> Contratar
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
            <div className="space-y-6">
              {automations.map((auto: any) => {
                const template = auto.workflow_templates;
                const Icon = categoryIcons[template?.categoria] || Zap;
                const whatsappConnected = auto.whatsapp_instances?.status === 'connected';
                const isConfiguring = auto.status === 'configurando';
                const cfg = (auto.config as Record<string, unknown>) || {};
                const hasConfig = !!cfg.configured_at;

                // Determine step
                let step = 1; // 1 = connect whatsapp, 2 = configure, 3 = done
                if (whatsappConnected || auto.whatsapp_instance_id) step = 2;
                if (hasConfig && whatsappConnected) step = 3;

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
                        <Badge className={
                          auto.status === 'ativa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : auto.status === 'configurando' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-muted text-muted-foreground'
                        }>
                          {auto.status === 'ativa' ? '✅ Ativa' : auto.status === 'configurando' ? '⚙️ Configurando' : 'Inativa'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Steps progress */}
                      {isConfiguring && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">Passos para ativar:</p>
                          <div className="space-y-2">
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${step >= 2 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-primary/5 border-primary/20'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                                {step >= 2 ? <Check className="h-3 w-3" /> : '1'}
                              </div>
                              <span className="text-sm">Conectar WhatsApp</span>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${step >= 3 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : step === 2 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-green-500 text-white' : step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {step >= 3 ? <Check className="h-3 w-3" /> : '2'}
                              </div>
                              <span className="text-sm">Configurar prompts e informações</span>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${step >= 3 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-muted/50 border-border'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                {step >= 3 ? <Check className="h-3 w-3" /> : '3'}
                              </div>
                              <span className="text-sm">Automação ativa!</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 1: WhatsApp setup */}
                      {!whatsappConnected && currentCompany && (
                        <UazapInstanceSetup
                          companyId={currentCompany.id}
                          automationId={auto.id}
                          instanceId={auto.whatsapp_instance_id}
                          onConnected={() => queryClient.invalidateQueries({ queryKey: ['portal-client-automations'] })}
                        />
                      )}

                      {/* Step 2: Configure button */}
                      {(step === 2 || auto.status === 'ativa') && (
                        <Button variant={isConfiguring ? 'default' : 'outline'} className="w-full gap-2" onClick={() => openConfig(auto)}>
                          <Settings className="h-4 w-4" />
                          {isConfiguring ? 'Configurar Prompts e Informações' : 'Editar Configuração'}
                        </Button>
                      )}

                      {/* Active stats */}
                      {auto.status === 'ativa' && whatsappConnected && auto.whatsapp_instances && (
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog - Individual Template */}
      <Dialog open={!!selectedTemplate} onOpenChange={(v) => { if (!v) { setSelectedTemplate(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
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

            {Number(selectedTemplate?.preco) > 0 ? (
              <>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
                <div className="space-y-2">
                  <Label>Nome do pagador</Label>
                  <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>Email do pagador</Label>
                  <Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <Button
                  className="w-full"
                  disabled={paymentMutation.isPending}
                  onClick={() => {
                    if (selectedTemplate) {
                      paymentMutation.mutate({
                        templateIds: [selectedTemplate.id],
                        name: selectedTemplate.nome,
                        price: Number(selectedTemplate.preco),
                        isCombo: false,
                      });
                    }
                  }}
                >
                  {paymentMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : 'Pagar e Ativar'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Após o pagamento, sua automação será ativada automaticamente.
                </p>
              </>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={() => selectedTemplate && handleFreeActivation(selectedTemplate.id, selectedTemplate.nome)}
                >
                  Ativar Gratuitamente
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Automação gratuita — ative e configure em minutos.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog - Combo */}
      <Dialog open={!!selectedCombo} onOpenChange={(v) => { if (!v) { setSelectedCombo(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Contratar Pacote: {selectedCombo?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {selectedCombo?.descricao && <p className="text-sm text-muted-foreground">{selectedCombo.descricao}</p>}
              <div className="flex items-end gap-2">
                <p className="text-xs text-muted-foreground line-through">
                  R$ {Number(selectedCombo?.preco_original || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-lg font-bold text-primary">
                  R$ {Number(selectedCombo?.preco_combo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </p>
              </div>
            </div>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            <div className="space-y-2">
              <Label>Nome do pagador</Label>
              <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Email do pagador</Label>
              <Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <Button
              className="w-full"
              disabled={paymentMutation.isPending}
              onClick={() => {
                if (selectedCombo) {
                  const templateIds = (selectedCombo.automation_combo_items || []).map((i: any) => i.template_id);
                  paymentMutation.mutate({
                    templateIds,
                    name: `Pacote: ${selectedCombo.nome}`,
                    price: Number(selectedCombo.preco_combo),
                    isCombo: true,
                  });
                }
              }}
            >
              {paymentMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</> : 'Pagar e Ativar Pacote'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Todas as automações do pacote serão ativadas automaticamente após o pagamento.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX QR Code Dialog */}
      <Dialog open={!!pixData} onOpenChange={() => setPixData(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" /> Pague com Pix
            </DialogTitle>
          </DialogHeader>
          {pixData?.qrBase64 && (
            <img src={`data:image/png;base64,${pixData.qrBase64}`} alt="QR Code Pix" className="mx-auto w-64 h-64 rounded-lg" />
          )}
          {pixData?.qr && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Ou copie o código Pix:</p>
              <div className="flex gap-2">
                <Input value={pixData.qr} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(pixData.qr);
                  toast.success('Código copiado!');
                }}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Após o pagamento ser confirmado, sua automação será ativada automaticamente. Isso pode levar alguns segundos.
          </p>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={(v) => { if (!v) setConfigDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar: {configDialog?.workflow_templates?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="font-medium">Informações da Empresa</Label>
              <Textarea
                value={configCompanyInfo}
                onChange={(e) => setConfigCompanyInfo(e.target.value)}
                placeholder="Descreva sua empresa: nome, segmento, produtos/serviços oferecidos, horário de funcionamento, etc."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Essas informações ajudam a IA a responder com precisão sobre sua empresa.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Instruções para a IA</Label>
              <Textarea
                value={configInstructions}
                onChange={(e) => setConfigInstructions(e.target.value)}
                placeholder="Ex: Sempre cumprimente pelo nome. Ofereça desconto de 10% na primeira compra. Nunca fale sobre concorrentes. Encaminhe reclamações para um humano."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Regras de comportamento para a IA seguir durante o atendimento.</p>
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Prompt do Atendimento (Avançado)</Label>
              <Textarea
                value={configPrompt}
                onChange={(e) => setConfigPrompt(e.target.value)}
                placeholder="Prompt personalizado para o agente de IA..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">O prompt base do template foi carregado automaticamente. Edite para personalizar.</p>
            </div>
            <Button className="w-full gap-2" onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
              {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar e Ativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentMethodSelector({ value, onChange }: { value: string; onChange: (v: 'pix' | 'credit_card' | 'boleto') => void }) {
  return (
    <div className="space-y-2">
      <Label>Forma de pagamento</Label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'pix' as const, label: 'Pix', icon: QrCode },
          { id: 'credit_card' as const, label: 'Cartão', icon: CreditCard },
          { id: 'boleto' as const, label: 'Boleto', icon: CreditCard },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              value === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
            onClick={() => onChange(m.id)}
          >
            <m.icon className={`h-5 w-5 ${value === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-medium ${value === m.id ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
