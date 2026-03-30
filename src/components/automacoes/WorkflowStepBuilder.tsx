import { useState, useRef, useCallback } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  ArrowRight,
  MessageSquare,
  Brain,
  Clock,
  GitBranch,
  UserCheck,
  Globe,
  Timer,
  Settings,
  Trash2,
} from 'lucide-react';
import { StepConfigEditor } from './StepConfigEditor';

export type StepType = 'mensagem' | 'ia' | 'aguardar' | 'condicao' | 'transferir' | 'webhook' | 'delay';

export interface WorkflowStep {
  id: string;
  tipo: StepType;
  nome: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

interface StepMeta {
  value: StepType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  color: string;
}

const STEP_TYPES: StepMeta[] = [
  { value: 'mensagem', label: 'Mensagem', icon: MessageSquare, desc: 'Enviar texto fixo', color: 'emerald' },
  { value: 'ia', label: 'Processar IA', icon: Brain, desc: 'Gerar resposta com IA', color: 'blue' },
  { value: 'aguardar', label: 'Aguardar', icon: Clock, desc: 'Esperar input do cliente', color: 'amber' },
  { value: 'condicao', label: 'Condição', icon: GitBranch, desc: 'If/else por palavra-chave', color: 'purple' },
  { value: 'transferir', label: 'Transferir', icon: UserCheck, desc: 'Encaminhar para humano', color: 'indigo' },
  { value: 'webhook', label: 'Webhook', icon: Globe, desc: 'Chamar URL externa', color: 'cyan' },
  { value: 'delay', label: 'Delay', icon: Timer, desc: 'Aguardar antes de prosseguir', color: 'orange' },
];

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;

const colorClasses: Record<string, string> = {
  emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400',
  blue: 'border-blue-400/40 bg-blue-400/10 text-blue-400',
  amber: 'border-amber-400/40 bg-amber-400/10 text-amber-400',
  purple: 'border-purple-400/40 bg-purple-400/10 text-purple-400',
  indigo: 'border-indigo-400/40 bg-indigo-400/10 text-indigo-400',
  cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-400',
  orange: 'border-orange-400/40 bg-orange-400/10 text-orange-400',
};

const iconBgClasses: Record<string, string> = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/20 text-blue-400',
  amber: 'bg-amber-500/20 text-amber-400',
  purple: 'bg-purple-500/20 text-purple-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  orange: 'bg-orange-500/20 text-orange-400',
};

function getStepMeta(tipo: StepType): StepMeta {
  return STEP_TYPES.find(s => s.value === tipo) || STEP_TYPES[0];
}

function ensurePositions(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, i) => ({
    ...step,
    position: step.position || { x: 50 + i * 270, y: 80 },
  }));
}

// SVG connection line between nodes
function ConnectionLine({
  from,
  to,
}: {
  from: WorkflowStep;
  to: WorkflowStep;
}) {
  const fromPos = from.position!;
  const toPos = to.position!;

  const startX = fromPos.x + NODE_WIDTH;
  const startY = fromPos.y + NODE_HEIGHT / 2;
  const endX = toPos.x;
  const endY = toPos.y + NODE_HEIGHT / 2;

  const cp1X = startX + (endX - startX) * 0.5;
  const cp2X = endX - (endX - startX) * 0.5;

  const path = `M${startX},${startY} C${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.6}
      />
      {/* Arrow at end */}
      <circle cx={endX} cy={endY} r={3} fill="hsl(var(--primary))" opacity={0.8} />
    </g>
  );
}

interface Props {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

export function WorkflowStepBuilder({ steps: rawSteps, onChange }: Props) {
  const steps = ensurePositions(rawSteps);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<StepType | ''>('');
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  const [contentSize, setContentSize] = useState(() => {
    const positioned = ensurePositions(rawSteps);
    const maxX = positioned.length > 0
      ? Math.max(...positioned.map(n => (n.position?.x || 0) + NODE_WIDTH))
      : NODE_WIDTH + 100;
    const maxY = positioned.length > 0
      ? Math.max(...positioned.map(n => (n.position?.y || 0) + NODE_HEIGHT))
      : NODE_HEIGHT + 100;
    return { width: maxX + 80, height: Math.max(maxY + 80, 260) };
  });

  // Build connections (sequential)
  const connections = steps.slice(0, -1).map((s, i) => ({
    from: s,
    to: steps[i + 1],
  }));

  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
    const node = steps.find(n => n.id === nodeId);
    if (node?.position) {
      dragStartPosition.current = { x: node.position.x, y: node.position.y };
    }
  };

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return;

    const newX = Math.max(0, dragStartPosition.current.x + offset.x);
    const newY = Math.max(0, dragStartPosition.current.y + offset.y);

    flushSync(() => {
      const updated = steps.map(s =>
        s.id === nodeId ? { ...s, position: { x: newX, y: newY } } : s
      );
      onChange(updated);
    });

    setContentSize(prev => ({
      width: Math.max(prev.width, newX + NODE_WIDTH + 80),
      height: Math.max(prev.height, newY + NODE_HEIGHT + 80),
    }));
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    dragStartPosition.current = null;
  };

  const addStep = () => {
    if (!addingType) return;
    const meta = getStepMeta(addingType);
    const lastNode = steps[steps.length - 1];
    const newPosition = lastNode?.position
      ? { x: lastNode.position.x + 270, y: lastNode.position.y }
      : { x: 50, y: 80 };

    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      tipo: addingType,
      nome: meta.label,
      config: getDefaultConfig(addingType),
      position: newPosition,
    };

    const updated = [...steps, newStep];
    onChange(updated);
    setAddingType('');

    setContentSize(prev => ({
      width: Math.max(prev.width, newPosition.x + NODE_WIDTH + 80),
      height: Math.max(prev.height, newPosition.y + NODE_HEIGHT + 80),
    }));

    // Scroll to new node
    const canvas = canvasRef.current;
    if (canvas) {
      setTimeout(() => {
        canvas.scrollTo({
          left: newPosition.x + NODE_WIDTH - canvas.clientWidth + 100,
          behavior: 'smooth',
        });
      }, 100);
    }
  };

  const removeStep = (id: string) => {
    onChange(steps.filter(s => s.id !== id));
    setEditingStep(null);
  };

  const updateStepConfig = useCallback(
    (id: string, key: string, value: any) => {
      const updated = steps.map(s =>
        s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s
      );
      onChange(updated);
      setEditingStep(prev =>
        prev?.id === id ? { ...prev, config: { ...prev.config, [key]: value } } : prev
      );
    },
    [steps, onChange]
  );

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Etapas do Workflow</Label>

      {/* n8n-style container */}
      <Card className="relative overflow-hidden rounded-2xl border-2 border-border/50 bg-muted/30">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-400/40 uppercase text-[10px] font-bold tracking-widest"
            >
              Ativo
            </Badge>
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              Workflow Builder
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={addingType} onValueChange={v => setAddingType(v as StepType)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Tipo da etapa..." />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              disabled={!addingType}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Node
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative overflow-auto"
          style={{ minHeight: 260 }}
        >
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Settings className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma etapa adicionada. Use o botão acima para definir o fluxo.
              </p>
            </div>
          ) : (
            <div
              className="relative"
              style={{
                width: contentSize.width,
                height: contentSize.height,
                minWidth: '100%',
              }}
            >
              {/* SVG Connections */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={contentSize.width}
                height={contentSize.height}
              >
                {connections.map((c, i) => (
                  <ConnectionLine
                    key={i}
                    from={c.from}
                    to={c.to}
                    nodes={steps}
                  />
                ))}
              </svg>

              {/* Draggable Nodes */}
              {steps.map(step => {
                const meta = getStepMeta(step.tipo);
                const Icon = meta.icon;
                const isDragging = draggingNodeId === step.id;

                return (
                  <motion.div
                    key={step.id}
                    drag
                    dragMomentum={false}
                    onDragStart={() => handleDragStart(step.id)}
                    onDrag={(_, info) => handleDrag(step.id, info)}
                    onDragEnd={handleDragEnd}
                    style={{
                      x: step.position!.x,
                      y: step.position!.y,
                      width: NODE_WIDTH,
                      transformOrigin: '0 0',
                    }}
                    className="absolute cursor-grab"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.03 }}
                    whileDrag={{ scale: 1.06, zIndex: 50, cursor: 'grabbing' }}
                  >
                    <Card
                      className={`relative border-2 ${colorClasses[meta.color]} rounded-xl backdrop-blur-sm transition-shadow ${
                        isDragging ? 'shadow-2xl ring-2 ring-primary/30' : 'shadow-md hover:shadow-lg'
                      }`}
                    >
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        className="absolute -top-2 -right-2 z-10 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        style={{ opacity: isDragging ? 0 : undefined }}
                        onPointerDown={e => e.stopPropagation()}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <div
                        className="p-3 space-y-2"
                        onDoubleClick={() => setEditingStep(step)}
                      >
                        {/* Icon + type + title */}
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBgClasses[meta.color]}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {meta.label}
                            </span>
                            <span className="block text-sm font-semibold text-foreground truncate">
                              {step.nome}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {meta.desc}
                        </p>

                        {/* Connected badge */}
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span>Conectado</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer stats */}
        {steps.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {steps.length} {steps.length === 1 ? 'Node' : 'Nodes'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {connections.length} {connections.length === 1 ? 'Connection' : 'Connections'}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Arraste os nodes para reposicionar · Duplo clique para editar
            </span>
          </div>
        )}
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingStep} onOpenChange={open => !open && setEditingStep(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStep && (() => {
                const meta = getStepMeta(editingStep.tipo);
                const Icon = meta.icon;
                return (
                  <>
                    <Icon className="h-5 w-5 text-primary" />
                    Configurar: {meta.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <StepConfigEditor
                step={editingStep}
                onUpdate={(key, val) => updateStepConfig(editingStep.id, key, val)}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeStep(editingStep.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStep(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
