import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Wifi, WifiOff, Trash2, Building2, Zap } from 'lucide-react';
import { UazapInstanceSetup } from './UazapInstanceSetup';

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inativa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  configurando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export function InternalAutomationManager() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [prompt, setPrompt] = useState('');

  const { data: internalAutomations, isLoading } = useQuery({
    queryKey: ['internal-automations', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      // Internal automations: company_id matches current company AND config has internal flag
      const { data, error } = await supabase
        .from('client_automations')
        .select('*, workflow_templates:template_id(nome, categoria, features), whatsapp_instances:whatsapp_instance_id(status, phone_number, messages_sent, messages_received)')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Filter to only internal ones (config.internal === true)
      return (data || []).filter((a: any) => (a.config as any)?.internal === true);
    },
    enabled: !!currentCompany,
  });

  const { data: templates } = useQuery({
    queryKey: ['workflow-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workflow_templates').select('id, nome, prompt_template').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const handleAssign = async () => {
    if (!selectedTemplate || !currentCompany) return;

    const { error } = await supabase.from('client_automations').insert([{
      company_id: currentCompany.id,
      template_id: selectedTemplate,
      prompt: prompt || null,
      status: 'configurando',
      config: { internal: true, company_nome: currentCompany.nome },
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Automação interna criada' });
      queryClient.invalidateQueries({ queryKey: ['internal-automations'] });
      setIsAssigning(false);
      setSelectedTemplate('');
      setPrompt('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta automação interna?')) return;
    const { error } = await supabase.from('client_automations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Automação removida' });
      queryClient.invalidateQueries({ queryKey: ['internal-automations'] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('client_automations').update({ status: newStatus as 'ativa' | 'inativa' | 'configurando' }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['internal-automations'] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure automações para uso interno da sua empresa ({currentCompany?.nome}).
        </p>
        <Button onClick={() => setIsAssigning(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Automação Interna
        </Button>
      </div>

      {!internalAutomations?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma automação interna configurada.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsAssigning(true)}>
              <Plus className="h-4 w-4" /> Configurar primeira automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {internalAutomations.map((ca: any) => {
            const whatsappConnected = ca.whatsapp_instances?.status === 'connected';
            return (
              <Card key={ca.id} className="border rounded-xl">
                <CardContent className="py-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {ca.workflow_templates?.nome || 'Workflow'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uso interno • {ca.workflow_templates?.categoria}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={statusColors[ca.status] || ''}>
                        {ca.status === 'ativa' ? 'Ativa' : ca.status === 'inativa' ? 'Inativa' : 'Configurando'}
                      </Badge>
                      {ca.whatsapp_instances ? (
                        <Badge variant="outline" className="gap-1">
                          {whatsappConnected ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-destructive" />}
                          {ca.whatsapp_instances.phone_number || (whatsappConnected ? 'Conectado' : 'Desconectado')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Sem WhatsApp</Badge>
                      )}
                      <Select value={ca.status} onValueChange={(v) => handleStatusChange(ca.id, v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">Ativa</SelectItem>
                          <SelectItem value="inativa">Inativa</SelectItem>
                          <SelectItem value="configurando">Configurando</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ca.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* WhatsApp setup for internal */}
                  {!whatsappConnected && currentCompany && (
                    <UazapInstanceSetup
                      companyId={currentCompany.id}
                      automationId={ca.id}
                      instanceId={ca.whatsapp_instance_id}
                      onConnected={() => queryClient.invalidateQueries({ queryKey: ['internal-automations'] })}
                    />
                  )}

                  {/* Stats if connected */}
                  {whatsappConnected && ca.whatsapp_instances && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                        <p className="font-bold">{ca.whatsapp_instances.messages_sent || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Recebidas</p>
                        <p className="font-bold">{ca.whatsapp_instances.messages_received || 0}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Automação Interna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template de Workflow</label>
              <Select value={selectedTemplate} onValueChange={(v) => {
                setSelectedTemplate(v);
                const tmpl = templates?.find((t) => t.id === v);
                if (tmpl?.prompt_template) setPrompt(tmpl.prompt_template);
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt da IA</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Configure o prompt da IA para uso interno..."
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAssigning(false)}>Cancelar</Button>
              <Button onClick={handleAssign} disabled={!selectedTemplate}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
