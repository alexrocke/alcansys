import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronUp, ChevronDown, MessageSquare, Brain, Clock, GitBranch, UserCheck, Globe, Timer } from 'lucide-react';

export type StepType = 'mensagem' | 'ia' | 'aguardar' | 'condicao' | 'transferir' | 'webhook' | 'delay';

export interface WorkflowStep {
  id: string;
  tipo: StepType;
  nome: string;
  config: Record<string, any>;
}

const STEP_TYPES: { value: StepType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'mensagem', label: 'Mensagem', icon: <MessageSquare className="h-4 w-4" />, desc: 'Enviar texto fixo' },
  { value: 'ia', label: 'Processar com IA', icon: <Brain className="h-4 w-4" />, desc: 'Gerar resposta com IA' },
  { value: 'aguardar', label: 'Aguardar Resposta', icon: <Clock className="h-4 w-4" />, desc: 'Esperar input do cliente' },
  { value: 'condicao', label: 'Condição', icon: <GitBranch className="h-4 w-4" />, desc: 'If/else por palavra-chave' },
  { value: 'transferir', label: 'Transferir', icon: <UserCheck className="h-4 w-4" />, desc: 'Encaminhar para humano' },
  { value: 'webhook', label: 'Webhook', icon: <Globe className="h-4 w-4" />, desc: 'Chamar URL externa' },
  { value: 'delay', label: 'Delay', icon: <Timer className="h-4 w-4" />, desc: 'Aguardar antes de prosseguir' },
];

function getStepIcon(tipo: StepType) {
  return STEP_TYPES.find(s => s.value === tipo)?.icon || <MessageSquare className="h-4 w-4" />;
}

function getStepLabel(tipo: StepType) {
  return STEP_TYPES.find(s => s.value === tipo)?.label || tipo;
}

interface Props {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

export function WorkflowStepBuilder({ steps, onChange }: Props) {
  const [addingType, setAddingType] = useState<StepType | ''>('');

  const addStep = () => {
    if (!addingType) return;
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      tipo: addingType,
      nome: getStepLabel(addingType),
      config: getDefaultConfig(addingType),
    };
    onChange([...steps, newStep]);
    setAddingType('');
  };

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const arr = [...steps];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    onChange(arr);
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateStepConfig = (id: string, key: string, value: any) => {
    onChange(steps.map(s => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s));
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Etapas do Workflow</Label>

      {steps.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
          Nenhuma etapa adicionada. Adicione etapas para definir o fluxo da automação.
        </p>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card key={step.id} className="relative">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  {getStepIcon(step.tipo)}
                  <CardTitle className="text-sm font-medium">{getStepLabel(step.tipo)}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStep(step.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <StepConfigEditor step={step} onUpdate={(key, val) => updateStepConfig(step.id, key, val)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Select value={addingType} onValueChange={(v) => setAddingType(v as StepType)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo da etapa..." />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                    <span className="text-muted-foreground text-xs">— {t.desc}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={addStep} disabled={!addingType}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>
    </div>
  );
}

function getDefaultConfig(tipo: StepType): Record<string, any> {
  switch (tipo) {
    case 'mensagem': return { texto: '' };
    case 'ia': return { prompt: '', maxTokens: 500 };
    case 'aguardar': return { timeoutMinutos: 30 };
    case 'condicao': return { palavraChave: '', acaoMatch: 'continuar', acaoNoMatch: 'transferir' };
    case 'transferir': return { departamento: '' };
    case 'webhook': return { url: '', metodo: 'POST' };
    case 'delay': return { minutos: 5 };
  }
}

function StepConfigEditor({ step, onUpdate }: { step: WorkflowStep; onUpdate: (key: string, val: any) => void }) {
  const { tipo, config } = step;

  switch (tipo) {
    case 'mensagem':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Texto da mensagem</Label>
          <Textarea value={config.texto || ''} onChange={e => onUpdate('texto', e.target.value)} placeholder="Olá! Como posso ajudar?" rows={2} />
        </div>
      );
    case 'ia':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Instrução adicional para a IA</Label>
          <Textarea value={config.prompt || ''} onChange={e => onUpdate('prompt', e.target.value)} placeholder="Responda de forma amigável sobre nossos produtos..." rows={2} />
          <div className="flex gap-2 items-center">
            <Label className="text-xs whitespace-nowrap">Max tokens</Label>
            <Input type="number" value={config.maxTokens || 500} onChange={e => onUpdate('maxTokens', parseInt(e.target.value) || 500)} className="w-24" />
          </div>
        </div>
      );
    case 'aguardar':
      return (
        <div className="flex gap-2 items-center">
          <Label className="text-xs whitespace-nowrap">Timeout (minutos)</Label>
          <Input type="number" value={config.timeoutMinutos || 30} onChange={e => onUpdate('timeoutMinutos', parseInt(e.target.value) || 30)} className="w-24" />
        </div>
      );
    case 'condicao':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Palavra-chave ou frase</Label>
          <Input value={config.palavraChave || ''} onChange={e => onUpdate('palavraChave', e.target.value)} placeholder="Ex: preço, orçamento, comprar" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Se encontrar</Label>
              <Select value={config.acaoMatch || 'continuar'} onValueChange={v => onUpdate('acaoMatch', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuar">Continuar fluxo</SelectItem>
                  <SelectItem value="transferir">Transferir</SelectItem>
                  <SelectItem value="mensagem">Enviar mensagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Se não encontrar</Label>
              <Select value={config.acaoNoMatch || 'transferir'} onValueChange={v => onUpdate('acaoNoMatch', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuar">Continuar fluxo</SelectItem>
                  <SelectItem value="transferir">Transferir</SelectItem>
                  <SelectItem value="mensagem">Enviar mensagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    case 'transferir':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Departamento / Observação</Label>
          <Input value={config.departamento || ''} onChange={e => onUpdate('departamento', e.target.value)} placeholder="Ex: Vendas, Suporte" />
        </div>
      );
    case 'webhook':
      return (
        <div className="space-y-2">
          <Label className="text-xs">URL</Label>
          <Input value={config.url || ''} onChange={e => onUpdate('url', e.target.value)} placeholder="https://..." />
          <div className="flex gap-2 items-center">
            <Label className="text-xs">Método</Label>
            <Select value={config.metodo || 'POST'} onValueChange={v => onUpdate('metodo', v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    case 'delay':
      return (
        <div className="flex gap-2 items-center">
          <Label className="text-xs whitespace-nowrap">Aguardar (minutos)</Label>
          <Input type="number" value={config.minutos || 5} onChange={e => onUpdate('minutos', parseInt(e.target.value) || 5)} className="w-24" />
        </div>
      );
    default:
      return null;
  }
}