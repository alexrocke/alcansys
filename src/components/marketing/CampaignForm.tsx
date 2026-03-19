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
import { format } from 'date-fns';

const campaignSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().trim().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  status: z.enum(['ativa', 'pausada', 'concluida']),
  orcamento: z.string().min(1, 'Orçamento é obrigatório'),
  roi: z.string().optional().or(z.literal('')),
  data_inicio: z.string().optional().or(z.literal('')),
  data_fim: z.string().optional().or(z.literal('')),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  campaign?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CampaignForm({ campaign, onSuccess, onCancel }: CampaignFormProps) {
  const { currentCompany } = useCompany();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      nome: campaign?.nome || '',
      descricao: campaign?.descricao || '',
      status: campaign?.status || 'ativa',
      orcamento: campaign?.orcamento?.toString() || '',
      roi: campaign?.roi?.toString() || '',
      data_inicio: campaign?.data_inicio ? format(new Date(campaign.data_inicio), 'yyyy-MM-dd') : '',
      data_fim: campaign?.data_fim ? format(new Date(campaign.data_fim), 'yyyy-MM-dd') : '',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData = {
        nome: data.nome,
        descricao: data.descricao || null,
        status: data.status,
        orcamento: parseFloat(data.orcamento),
        roi: data.roi ? parseFloat(data.roi) : null,
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
        company_id: currentCompany?.id || null,
      };

      if (campaign) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;

        toast({
          title: 'Campanha atualizada',
          description: 'A campanha foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('marketing_campaigns')
          .insert([campaignData]);

        if (error) throw error;

        toast({
          title: 'Campanha criada',
          description: 'A nova campanha foi criada com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar a campanha.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome da Campanha *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Campanha de Lançamento Q1"
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
            placeholder="Descreva os objetivos e estratégias da campanha"
            rows={3}
          />
          {errors.descricao && (
            <p className="text-sm text-red-500">{errors.descricao.message}</p>
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
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orcamento">Orçamento (R$) *</Label>
          <Input
            id="orcamento"
            type="number"
            step="0.01"
            {...register('orcamento')}
            placeholder="0.00"
          />
          {errors.orcamento && (
            <p className="text-sm text-red-500">{errors.orcamento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roi">ROI (%)</Label>
          <Input
            id="roi"
            type="number"
            step="0.01"
            {...register('roi')}
            placeholder="Ex: 15.5"
          />
          {errors.roi && (
            <p className="text-sm text-red-500">{errors.roi.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data de Início</Label>
          <Input
            id="data_inicio"
            type="date"
            {...register('data_inicio')}
          />
          {errors.data_inicio && (
            <p className="text-sm text-red-500">{errors.data_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data de Término</Label>
          <Input
            id="data_fim"
            type="date"
            {...register('data_fim')}
          />
          {errors.data_fim && (
            <p className="text-sm text-red-500">{errors.data_fim.message}</p>
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
          {isSubmitting ? 'Salvando...' : campaign ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
