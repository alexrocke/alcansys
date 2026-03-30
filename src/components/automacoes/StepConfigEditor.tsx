import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WorkflowStep } from './WorkflowStepBuilder';

interface Props {
  step: WorkflowStep;
  onUpdate: (key: string, val: any) => void;
}

export function StepConfigEditor({ step, onUpdate }: Props) {
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
