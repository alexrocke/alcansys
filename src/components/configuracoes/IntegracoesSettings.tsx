import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Trash2, ArrowRightLeft, Globe, Smartphone, Copy, Check,
  Building2, ShoppingCart, Stethoscope, GraduationCap, Wrench
} from 'lucide-react';

// Presets pré-configurados para sistemas comuns
const RELAY_PRESETS = [
  {
    id: 'imobiliaria',
    nome: 'Imobiliária',
    descricao: 'Sistema de atendimento para imobiliárias',
    icon: Building2,
    defaults: {
      descricao: 'Imobiliária',
      relay_url: '',
      relay_secret: '',
    },
  },
  {
    id: 'ecommerce',
    nome: 'E-commerce',
    descricao: 'Atendimento para lojas virtuais',
    icon: ShoppingCart,
    defaults: {
      descricao: 'E-commerce',
      relay_url: '',
      relay_secret: '',
    },
  },
  {
    id: 'clinica',
    nome: 'Clínica / Saúde',
    descricao: 'Agendamentos e atendimento médico',
    icon: Stethoscope,
    defaults: {
      descricao: 'Clínica',
      relay_url: '',
      relay_secret: '',
    },
  },
  {
    id: 'educacao',
    nome: 'Educação',
    descricao: 'Instituições de ensino e cursos',
    icon: GraduationCap,
    defaults: {
      descricao: 'Educação',
      relay_url: '',
      relay_secret: '',
    },
  },
  {
    id: 'custom',
    nome: 'Personalizado',
    descricao: 'Configure manualmente para qualquer sistema',
    icon: Wrench,
    defaults: {
      descricao: '',
      relay_url: '',
      relay_secret: '',
    },
  },
];

interface RelayForm {
  descricao: string;
  instance_name: string;
  phone_number: string;
  relay_url: string;
  relay_secret: string;
  whatsapp_instance_id: string;
}

const emptyForm: RelayForm = {
  descricao: '',
  instance_name: '',
  phone_number: '',
  relay_url: '',
  relay_secret: '',
  whatsapp_instance_id: '',
};

export function IntegracoesSettings() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<RelayForm>({ ...emptyForm });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['webhook-relay-configs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_relay_configs')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: instances } = useQuery({
    queryKey: ['whatsapp-instances-settings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, status')
        .eq('company_id', companyId!);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('webhook_relay_configs').insert({
        company_id: companyId!,
        descricao: form.descricao || null,
        instance_name: form.instance_name || null,
        phone_number: form.phone_number || null,
        relay_url: form.relay_url,
        relay_secret: form.relay_secret || null,
        whatsapp_instance_id: form.whatsapp_instance_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-relay-configs'] });
      toast({ title: 'Integração configurada com sucesso!' });
      setIsOpen(false);
      setForm({ ...emptyForm });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('webhook_relay_configs').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhook-relay-configs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_relay_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-relay-configs'] });
      toast({ title: 'Integração removida' });
    },
  });

  const handleInstanceSelect = (instanceId: string) => {
    const inst = instances?.find((i) => i.id === instanceId);
    setForm((f) => ({
      ...f,
      whatsapp_instance_id: instanceId,
      instance_name: inst?.instance_name || '',
      phone_number: inst?.phone_number || '',
    }));
  };

  const handlePresetSelect = (preset: typeof RELAY_PRESETS[0]) => {
    setForm({
      ...emptyForm,
      ...preset.defaults,
    });
    setIsOpen(true);
  };

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'URL copiada!' });
  };

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div>
        <h3 className="text-sm font-medium mb-2">URL do Webhook (configure no UAZAP)</h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-muted px-3 py-2 rounded border break-all">
            {webhookUrl}
          </code>
          <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Presets */}
      <div>
        <h3 className="text-sm font-medium mb-3">Criar Nova Integração</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {RELAY_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <Card
                key={preset.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handlePresetSelect(preset)}
              >
                <CardContent className="flex flex-col items-center text-center p-4 gap-2">
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">{preset.nome}</span>
                  <span className="text-xs text-muted-foreground">{preset.descricao}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Existing configs */}
      <div>
        <h3 className="text-sm font-medium mb-3">Integrações Configuradas</h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !configs?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center py-8 text-center">
              <ArrowRightLeft className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma integração configurada.</p>
              <p className="text-muted-foreground text-xs mt-1">
                Selecione um tipo acima para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {configs.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{c.descricao || 'Sem descrição'}</span>
                      <Badge variant={c.ativo ? 'default' : 'secondary'} className="text-xs">
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {c.instance_name && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {c.instance_name}
                        </span>
                      )}
                      {c.phone_number && (
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" /> {c.phone_number}
                        </span>
                      )}
                      <span className="truncate max-w-[250px]">→ {c.relay_url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.ativo}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, ativo: v })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de criação */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição / Nome do Sistema</Label>
              <Input
                placeholder="Ex: Imobiliária ABC"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            {instances && instances.length > 0 && (
              <div>
                <Label>Instância WhatsApp (preenche automaticamente)</Label>
                <Select onValueChange={handleInstanceSelect} value={form.whatsapp_instance_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar instância..." />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.instance_name} {i.phone_number ? `(${i.phone_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome da Instância</Label>
                <Input
                  placeholder="Nome no UAZAP"
                  value={form.instance_name}
                  onChange={(e) => setForm((f) => ({ ...f, instance_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Número de Telefone</Label>
                <Input
                  placeholder="5511999999999"
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>URL de Destino *</Label>
              <Input
                placeholder="https://projeto.supabase.co/functions/v1/whatsapp-webhook"
                value={form.relay_url}
                onChange={(e) => setForm((f) => ({ ...f, relay_url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Endpoint do sistema externo que receberá as mensagens
              </p>
            </div>

            <div>
              <Label>Secret (x-relay-secret)</Label>
              <Input
                placeholder="Token secreto do sistema destino"
                value={form.relay_secret}
                onChange={(e) => setForm((f) => ({ ...f, relay_secret: e.target.value }))}
              />
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.relay_url || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Integração'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
