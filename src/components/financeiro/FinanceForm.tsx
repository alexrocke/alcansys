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
import { useCompany } from '@/hooks/useCompany';
import { Loader2 } from 'lucide-react';

const financeSchema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(500),
  valor: z.string().min(1, 'Valor é obrigatório'),
  area: z.string().optional().nullable(),
  project_id: z.string().uuid('Projeto inválido').optional().nullable(),
  data: z.string().min(1, 'Data é obrigatória'),
});

type FinanceFormData = z.infer<typeof financeSchema>;

interface FinanceFormProps {
  finance?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FinanceForm({ finance, onSuccess, onCancel }: FinanceFormProps) {
  const { currentCompany } = useCompany();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      tipo: finance?.tipo || 'receita',
      descricao: finance?.descricao || '',
      valor: finance?.valor?.toString() || '',
      area: finance?.area || null,
      project_id: finance?.project_id || null,
      data: finance?.data || new Date().toISOString().split('T')[0],
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['areas-finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('valor')
        .eq('chave', 'areas_ativas')
        .single();
      if (error) throw error;
      const areasValue = data?.valor as { areas?: string[] } | null;
      return areasValue?.areas || ['Desenvolvimento', 'Marketing', 'Design', 'Consultoria'];
    },
  });

  const onSubmit = async (data: FinanceFormData) => {
    try {
      const financeData = {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        area: data.area || null,
        project_id: data.project_id || null,
        data: data.data,
      };

      if (finance?.id) {
        const { error } = await supabase
          .from('finances')
          .update(financeData)
          .eq('id', finance.id);

        if (error) throw error;

        toast({
          title: 'Transação atualizada',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('finances')
          .insert([financeData]);

        if (error) throw error;

        toast({
          title: 'Transação criada',
          description: 'A transação foi registrada com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving finance:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar a transação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={watch('tipo')}
            onValueChange={(value) => setValue('tipo', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            {...register('data')}
          />
          {errors.data && (
            <p className="text-sm text-destructive">{errors.data.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva a transação..."
          rows={3}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$) *</Label>
        <Input
          id="valor"
          type="number"
          step="0.01"
          {...register('valor')}
          placeholder="0.00"
        />
        {errors.valor && (
          <p className="text-sm text-destructive">{errors.valor.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="area">Área</Label>
          <Select
            value={watch('area') || 'none'}
            onValueChange={(value) => setValue('area', value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem área</SelectItem>
              {areas?.map((area: string) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto</Label>
          <Select
            value={watch('project_id') || 'none'}
            onValueChange={(value) => setValue('project_id', value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem projeto</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {finance ? 'Salvar Alterações' : 'Criar Transação'}
        </Button>
      </div>
    </form>
  );
}
