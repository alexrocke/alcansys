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

const projectSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  client_id: z.string().uuid('Cliente inválido').optional().nullable(),
  area: z.string().min(1, 'Área é obrigatória').max(100),
  status: z.enum(['planejamento', 'em_andamento', 'concluido', 'cancelado']),
  gestor_id: z.string().uuid('Gestor inválido').optional().nullable(),
  orcamento: z.string().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { currentCompany } = useCompany();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nome: project?.nome || '',
      client_id: project?.client_id || null,
      area: project?.area || '',
      status: project?.status || 'planejamento',
      gestor_id: project?.gestor_id || null,
      orcamento: project?.orcamento?.toString() || '',
      data_inicio: project?.data_inicio || '',
      data_fim: project?.data_fim || '',
      descricao: project?.descricao || '',
    },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: gestores } = useQuery({
    queryKey: ['gestores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
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

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const projectData = {
        nome: data.nome,
        area: data.area,
        status: data.status,
        orcamento: data.orcamento ? parseFloat(data.orcamento) : null,
        client_id: data.client_id || null,
        gestor_id: data.gestor_id || null,
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
        descricao: data.descricao || null,
      };

      if (project?.id) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);

        if (error) throw error;

        toast({
          title: 'Projeto atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;

        toast({
          title: 'Projeto criado',
          description: 'O projeto foi criado com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o projeto.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Projeto *</Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Sistema de Gestão"
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_id">Cliente</Label>
          <Select
            value={watch('client_id') || 'none'}
            onValueChange={(value) => setValue('client_id', value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem cliente</SelectItem>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Área *</Label>
          <Select
            value={watch('area')}
            onValueChange={(value) => setValue('area', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {areas?.map((area: string) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.area && (
            <p className="text-sm text-destructive">{errors.area.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planejamento">Planejamento</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gestor_id">Gestor Responsável</Label>
          <Select
            value={watch('gestor_id') || 'none'}
            onValueChange={(value) => setValue('gestor_id', value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um gestor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem gestor</SelectItem>
              {gestores?.map((gestor) => (
                <SelectItem key={gestor.id} value={gestor.id}>
                  {gestor.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orcamento">Orçamento (R$)</Label>
          <Input
            id="orcamento"
            type="number"
            step="0.01"
            {...register('orcamento')}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input
            id="data_inicio"
            type="date"
            {...register('data_inicio')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input
            id="data_fim"
            type="date"
            {...register('data_fim')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descreva o projeto..."
          rows={4}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {project ? 'Salvar Alterações' : 'Criar Projeto'}
        </Button>
      </div>
    </form>
  );
}
