import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const automationSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().trim().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  tipo: z.string().trim().min(1, 'Tipo é obrigatório').max(50, 'Tipo muito longo'),
  status: z.enum(['ativa', 'inativa']),
  custo: z.string().optional().or(z.literal('')),
  retorno: z.string().optional().or(z.literal('')),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationFormProps {
  automation?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AutomationForm({ automation, onSuccess, onCancel }: AutomationFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      nome: automation?.nome || '',
      descricao: automation?.descricao || '',
      tipo: automation?.tipo || '',
      status: automation?.status || 'ativa',
      custo: automation?.custo?.toString() || '',
      retorno: automation?.retorno?.toString() || '',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = async (data: AutomationFormData) => {
    try {
      const automationData = {
        nome: data.nome,
        descricao: data.descricao || null,
        tipo: data.tipo,
        status: data.status,
        custo: data.custo ? parseFloat(data.custo) : null,
        retorno: data.retorno ? parseFloat(data.retorno) : null,
      };

      if (automation) {
        const { error } = await supabase
          .from('automations')
          .update(automationData)
          .eq('id', automation.id);

        if (error) throw error;

        toast({
          title: 'Automação atualizada',
          description: 'A automação foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('automations')
          .insert([automationData]);

        if (error) throw error;

        toast({
          title: 'Automação criada',
          description: 'A nova automação foi criada com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving automation:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar a automação.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome da Automação *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Envio automático de relatórios"
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            {...register('descricao')}
            placeholder="Descreva o que essa automação faz"
            rows={3}
          />
          {errors.descricao && (
            <p className="text-sm text-red-500">{errors.descricao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Input
            id="tipo"
            {...register('tipo')}
            placeholder="Ex: Email, Integração, Workflow"
          />
          {errors.tipo && (
            <p className="text-sm text-red-500">{errors.tipo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="inativa">Inativa</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="custo">Custo Mensal (R$)</Label>
          <Input
            id="custo"
            type="number"
            step="0.01"
            {...register('custo')}
            placeholder="0.00"
          />
          {errors.custo && (
            <p className="text-sm text-red-500">{errors.custo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="retorno">Retorno Mensal (R$)</Label>
          <Input
            id="retorno"
            type="number"
            step="0.01"
            {...register('retorno')}
            placeholder="0.00"
          />
          {errors.retorno && (
            <p className="text-sm text-red-500">{errors.retorno.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : automation ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
