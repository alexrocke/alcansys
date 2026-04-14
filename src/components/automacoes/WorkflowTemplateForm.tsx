import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: 'Digite um prompt para gerar o workflow', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: { prompt: aiPrompt.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.steps?.length) {
        setSteps(data.steps);
        toast({ title: `✨ Workflow gerado com ${data.steps.length} etapas!` });
        setAiPrompt('');
      } else {
        toast({ title: 'IA não retornou etapas válidas', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar workflow', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
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
        config_schema: { steps } as any,
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

      {/* AI Workflow Generator */}
      <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold text-primary">Gerar Workflow com IA</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Descreva o que o workflow deve fazer e a IA vai gerar as etapas automaticamente para você revisar e ajustar.
        </p>
        <Textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ex: Crie um fluxo de atendimento que recebe o cliente, pergunta o que precisa, processa com IA, e se não resolver transfere para um humano..."
          rows={3}
          maxLength={2000}
          disabled={isGenerating}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{aiPrompt.length}/2000</span>
          <Button
            type="button"
            variant="outline"
            onClick={generateWithAI}
            disabled={isGenerating || !aiPrompt.trim()}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Gerar Workflow</>
            )}
          </Button>
        </div>
      </div>

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
