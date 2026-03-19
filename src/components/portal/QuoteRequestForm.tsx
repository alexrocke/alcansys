import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { toast } from '@/hooks/use-toast';

interface QuoteRequestFormProps {
  serviceId?: string;
  serviceName?: string;
  trigger: React.ReactNode;
}

export function QuoteRequestForm({ serviceId, serviceName, trigger }: QuoteRequestFormProps) {
  const { currentCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome_contato: '', email: '', telefone: '', mensagem: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    setLoading(true);
    const { error } = await supabase.from('quote_requests').insert({
      company_id: currentCompany.id,
      service_id: serviceId || null,
      nome_contato: form.nome_contato,
      email: form.email || null,
      telefone: form.telefone || null,
      mensagem: form.mensagem || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao enviar solicitação', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação enviada!', description: 'Entraremos em contato em breve.' });
      setForm({ nome_contato: '', email: '', telefone: '', mensagem: '' });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Orçamento{serviceName ? ` - ${serviceName}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_contato">Nome *</Label>
            <Input id="nome_contato" required value={form.nome_contato} onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea id="mensagem" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Descreva o que precisa..." />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
