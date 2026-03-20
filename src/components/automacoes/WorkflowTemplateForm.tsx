import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WorkflowStepBuilder, type WorkflowStep } from './WorkflowStepBuilder';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional().or(z.literal('')),
  categoria: z.enum(['atendimento', 'vendas', 'marketing', 'suporte']),
  preco: z.string().optional().or(z.literal('')),
  prompt_template: z.string().optional().or(z.literal('')),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  template?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WorkflowTemplateForm({ template, onSuccess, onCancel }: Props) {
  const [features, setFeatures] = useState<string[]>(template?.features || []);
  const [newFeature, setNewFeature] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>(
    (template?.config_schema as any)?.steps || []
  );

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: template?.nome || '',
      descricao: template?.descricao || '',
      categoria: template?.categoria || 'atendimento',
      preco: template?.preco?.toString() || '',
      prompt_template: template?.prompt_template || '',
      ativo: template?.ativo ?? true,
    },
  });

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nome: data.nome,
        descricao: data.descricao || null,
        categoria: data.categoria,
        preco: data.preco ? parseFloat(data.preco) : 0,
        prompt_template: data.prompt_template || null,
        ativo: data.ativo,
        features: features,
        config_schema: { steps },
      };

      if (template) {
        const { error } = await supabase.from('workflow_templates').update(payload).eq('id', template.id);
        if (error) throw error;
        toast({ title: 'Template atualizado com sucesso' });
      } else {
        const { error } = await supabase.from('workflow_templates').insert([payload]);
        if (error) throw error;
        toast({ title: 'Template criado com sucesso' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Nome do Workflow *</Label>
          <Input {...register('nome')} placeholder="Ex: Atendimento Automático 24h" />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Descrição</Label>
          <Textarea {...register('descricao')} placeholder="Descreva o que este workflow faz" rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={watch('categoria')} onValueChange={(v) => setValue('categoria', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="atendimento">Atendimento</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preço Mensal (R$)</Label>
          <Input type="number" step="0.01" {...register('preco')} placeholder="0.00" />
        </div>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Prompt da IA</Label>
        <Textarea {...register('prompt_template')} placeholder="Instruções para a IA quando este workflow estiver ativo para um cliente..." rows={5} />
        <p className="text-xs text-muted-foreground">Este prompt será usado como base para personalizar a IA de cada cliente.</p>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <Label>Funcionalidades</Label>
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Ex: Respostas automáticas 24/7"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addFeature}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm">
                {f}
                <button type="button" onClick={() => removeFeature(i)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Workflow Step Builder */}
      <WorkflowStepBuilder steps={steps} onChange={setSteps} />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : template ? 'Atualizar' : 'Criar Template'}
        </Button>
      </div>
    </form>
  );
}
