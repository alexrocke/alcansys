import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  meta_mensal: z.string().optional().or(z.literal('')),
  percentual_comissao: z.string().optional().or(z.literal('')),
  user_id: z.string().optional().or(z.literal('')),
  status: z.enum(['ativo', 'inativo']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  salesperson?: any;
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SalespersonForm({ salesperson, companyId, onSuccess, onCancel }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: salesperson?.nome || '',
      email: salesperson?.email || '',
      telefone: salesperson?.telefone || '',
      meta_mensal: salesperson?.meta_mensal?.toString() || '',
      percentual_comissao: salesperson?.percentual_comissao?.toString() || '10',
      user_id: salesperson?.user_id || '',
      status: salesperson?.status || 'ativo',
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-salesperson'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, nome, email').eq('status', 'ativo').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        meta_mensal: data.meta_mensal ? parseFloat(data.meta_mensal) : 0,
        percentual_comissao: data.percentual_comissao ? parseFloat(data.percentual_comissao) : 10,
        user_id: data.user_id || null,
        status: data.status,
        company_id: companyId,
      };

      if (salesperson?.id) {
        const { error } = await supabase.from('salespeople').update(payload).eq('id', salesperson.id);
        if (error) throw error;
        toast({ title: 'Vendedor atualizado' });
      } else {
        const { error } = await supabase.from('salespeople').insert([payload]);
        if (error) throw error;
        toast({ title: 'Vendedor criado' });
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
          <Input {...register('nome')} placeholder="Nome do vendedor" />
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
          <Label>Meta Mensal (R$)</Label>
          <Input {...register('meta_mensal')} type="number" step="0.01" placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Comissão (%)</Label>
          <Input {...register('percentual_comissao')} type="number" step="0.1" placeholder="10" />
        </div>
        <div className="space-y-2">
          <Label>Vincular Usuário (Portal)</Label>
          <Select value={watch('user_id') || 'none'} onValueChange={(v) => setValue('user_id', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem vínculo</SelectItem>
              {profiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} ({p.email})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {salesperson ? 'Salvar' : 'Criar Vendedor'}
        </Button>
      </div>
    </form>
  );
}
