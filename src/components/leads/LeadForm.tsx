import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const leadSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  empresa: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  status: z.enum(['novo', 'contatado', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido']),
  origem: z.enum(['site', 'whatsapp', 'indicacao', 'campanha', 'organico', 'outro']),
  valor_estimado: z.string().optional().or(z.literal('')),
  responsavel_id: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  salesperson_id: z.string().optional().or(z.literal('')),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: any;
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LeadForm({ lead, companyId, onSuccess, onCancel }: LeadFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: lead?.nome || '',
      email: lead?.email || '',
      telefone: lead?.telefone || '',
      empresa: lead?.empresa || '',
      cargo: lead?.cargo || '',
      status: lead?.status || 'novo',
      origem: lead?.origem || 'outro',
      valor_estimado: lead?.valor_estimado?.toString() || '',
      responsavel_id: lead?.responsavel_id || '',
      notas: lead?.notas || '',
      tags: lead?.tags?.join(', ') || '',
      salesperson_id: lead?.salesperson_id || '',
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, nome').eq('status', 'ativo').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: salespeople } = useQuery({
    queryKey: ['salespeople-select', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('salespeople').select('id, nome').eq('company_id', companyId).eq('status', 'ativo').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    try {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const leadData = {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        empresa: data.empresa || null,
        cargo: data.cargo || null,
        status: data.status,
        origem: data.origem,
        valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
        responsavel_id: data.responsavel_id || null,
        notas: data.notas || null,
        tags: tagsArray,
        company_id: companyId,
        data_conversao: data.status === 'ganho' ? new Date().toISOString().split('T')[0] : lead?.data_conversao || null,
      };

      if (lead?.id) {
        const { error } = await supabase.from('leads').update(leadData).eq('id', lead.id);
        if (error) throw error;
        toast({ title: 'Lead atualizado' });
      } else {
        const { error } = await supabase.from('leads').insert([leadData]);
        if (error) throw error;
        toast({ title: 'Lead criado' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Nome *</Label>
          <Input {...register('nome')} placeholder="Nome do lead" />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input {...register('telefone')} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input {...register('empresa')} placeholder="Nome da empresa" />
        </div>
        <div className="space-y-2">
          <Label>Cargo</Label>
          <Input {...register('cargo')} placeholder="Cargo do contato" />
        </div>
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="contatado">Contatado</SelectItem>
              <SelectItem value="qualificado">Qualificado</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="negociacao">Negociação</SelectItem>
              <SelectItem value="ganho">Ganho</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origem *</Label>
          <Select value={watch('origem')} onValueChange={(v) => setValue('origem', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="site">Site</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="campanha">Campanha</SelectItem>
              <SelectItem value="organico">Orgânico</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor Estimado (R$)</Label>
          <Input {...register('valor_estimado')} type="number" step="0.01" placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select value={watch('responsavel_id') || 'none'} onValueChange={(v) => setValue('responsavel_id', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Tags</Label>
          <Input {...register('tags')} placeholder="Ex: urgente, premium (separadas por vírgula)" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Notas</Label>
          <Textarea {...register('notas')} placeholder="Observações sobre o lead..." rows={3} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {lead ? 'Salvar' : 'Criar Lead'}
        </Button>
      </div>
    </form>
  );
}
