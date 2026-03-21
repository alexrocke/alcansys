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
import { Plus, Trash2, ArrowRightLeft, Globe, Smartphone } from 'lucide-react';

export function WebhookRelayConfig() {
  const { currentCompany } = useCompany();
  const selectedCompany = currentCompany?.id;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: '',
    instance_name: '',
    phone_number: '',
    relay_url: '',
    relay_secret: '',
    whatsapp_instance_id: '',
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['webhook-relay-configs', selectedCompany],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_relay_configs')
        .select('*')
        .eq('company_id', selectedCompany!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const { data: instances } = useQuery({
    queryKey: ['whatsapp-instances', selectedCompany],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone_number, status')
        .eq('company_id', selectedCompany!);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('webhook_relay_configs').insert({
        company_id: selectedCompany!,
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
      toast({ title: 'Relay configurado com sucesso!' });
      setIsOpen(false);
      setForm({ descricao: '', instance_name: '', phone_number: '', relay_url: '', relay_secret: '', whatsapp_instance_id: '' });
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
      toast({ title: 'Relay removido' });
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

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground mb-1">URL do Webhook (configure no UAZAP):</p>
          <code className="text-xs bg-muted px-3 py-2 rounded block break-all select-all">{webhookUrl}</code>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regras de Relay</h3>
        <Button onClick={() => setIsOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Nova Regra
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !configs?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma regra de relay configurada.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Configure para encaminhar mensagens do WhatsApp para sistemas externos.
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
                    <span className="truncate max-w-[200px]">→ {c.relay_url}</span>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra de Relay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: Imobiliária XYZ"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>

            {instances && instances.length > 0 && (
              <div>
                <Label>Instância WhatsApp (opcional)</Label>
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

            <div>
              <Label>Nome da Instância (verificação)</Label>
              <Input
                placeholder="Nome da instância no UAZAP"
                value={form.instance_name}
                onChange={(e) => setForm((f) => ({ ...f, instance_name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Número de Telefone (verificação)</Label>
              <Input
                placeholder="Ex: 5511999999999"
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div>
              <Label>URL de Destino *</Label>
              <Input
                placeholder="https://..."
                value={form.relay_url}
                onChange={(e) => setForm((f) => ({ ...f, relay_url: e.target.value }))}
              />
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
              {createMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
