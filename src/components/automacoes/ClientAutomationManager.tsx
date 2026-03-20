import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

const statusColors: Record<string, string> = {
  ativa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inativa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  configurando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export function ClientAutomationManager() {
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [clientPrompt, setClientPrompt] = useState('');

  const { data: clientAutomations, isLoading } = useQuery({
    queryKey: ['client-automations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_automations')
        .select('*, companies:company_id(nome), workflow_templates:template_id(nome, categoria), whatsapp_instances:whatsapp_instance_id(status, phone_number)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
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
    if (!selectedCompany || !selectedTemplate) return;
    const { error } = await supabase.from('client_automations').insert([{
      company_id: selectedCompany,
      template_id: selectedTemplate,
      prompt: clientPrompt || null,
      status: 'configurando',
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Workflow atribuído ao cliente' });
      queryClient.invalidateQueries({ queryKey: ['client-automations'] });
      setIsAssigning(false);
      setSelectedCompany('');
      setSelectedTemplate('');
      setClientPrompt('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta automação do cliente?')) return;
    const { error } = await supabase.from('client_automations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Automação removida' });
      queryClient.invalidateQueries({ queryKey: ['client-automations'] });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('client_automations').update({ status: newStatus as 'ativa' | 'inativa' | 'configurando' }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['client-automations'] });
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
      <div className="flex justify-end">
        <Button onClick={() => setIsAssigning(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Atribuir Workflow
        </Button>
      </div>

      {!clientAutomations?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma automação atribuída a clientes ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clientAutomations.map((ca: any) => {
            const whatsappConnected = ca.whatsapp_instances?.status === 'connected';
            return (
              <Card key={ca.id} className="border rounded-xl">
                <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{ca.companies?.nome || 'Empresa'}</p>
                    <p className="text-sm text-muted-foreground">{ca.workflow_templates?.nome || 'Template'}</p>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isAssigning} onOpenChange={setIsAssigning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Workflow a Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {companies?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Template de Workflow</label>
              <Select value={selectedTemplate} onValueChange={(v) => {
                setSelectedTemplate(v);
                const tmpl = templates?.find((t) => t.id === v);
                if (tmpl?.prompt_template) setClientPrompt(tmpl.prompt_template);
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
              <label className="text-sm font-medium">Prompt da IA (personalizado para este cliente)</label>
              <Textarea
                value={clientPrompt}
                onChange={(e) => setClientPrompt(e.target.value)}
                placeholder="Personalize o prompt da IA para este cliente..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">O prompt do template será carregado automaticamente ao selecionar. Edite para personalizar.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAssigning(false)}>Cancelar</Button>
              <Button onClick={handleAssign} disabled={!selectedCompany || !selectedTemplate}>Atribuir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
