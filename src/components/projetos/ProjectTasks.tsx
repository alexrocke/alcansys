import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Loader2,
  CalendarClock,
  AlertTriangle,
  ListChecks,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { differenceInDays, isPast, parseISO, format } from 'date-fns';

const statusColors: Record<string, string> = {
  pendente: 'bg-muted text-muted-foreground border-muted',
  em_andamento: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  concluida: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelada: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const priorityColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-blue-500/10 text-blue-600',
  alta: 'bg-orange-500/10 text-orange-600',
  urgente: 'bg-red-500/10 text-red-600',
};

const priorityLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

interface ProjectTasksProps {
  projectId: string;
  projectName: string;
}

export function ProjectTasks({ projectId, projectName }: ProjectTasksProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      // Fetch responsavel names separately
      const responsavelIds = [...new Set((data || []).map(t => t.responsavel_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (responsavelIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', responsavelIds);
        profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.nome }), {});
      }
      
      return (data || []).map(t => ({
        ...t,
        responsavel_nome: t.responsavel_id ? profilesMap[t.responsavel_id] || null : null,
      }));
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
      const updateData: any = {
        status: newStatus,
        data_conclusao: newStatus === 'concluida' ? new Date().toISOString().split('T')[0] : null,
      };
      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({ title: 'Tarefa excluída' });
    },
  });

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === 'concluida').length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const overdueTasks = tasks?.filter((t) => {
    if (t.status === 'concluida' || t.status === 'cancelada' || !t.data_fim) return false;
    return isPast(parseISO(t.data_fim));
  }) || [];

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    handleCloseForm();
  };

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Tarefas do Projeto</h3>
            <p className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} concluídas
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}%</p>
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''} atrasada{overdueTasks.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : totalTasks === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma tarefa criada ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => {
            const isOverdue =
              task.status !== 'concluida' &&
              task.status !== 'cancelada' &&
              task.data_fim &&
              isPast(parseISO(task.data_fim));
            const daysLeft =
              task.data_fim && task.status !== 'concluida'
                ? differenceInDays(parseISO(task.data_fim), new Date())
                : null;

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                } ${task.status === 'concluida' ? 'opacity-60' : ''}`}
                onClick={() => handleEdit(task)}
              >
                <div
                  className="pt-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskStatus.mutate({ taskId: task.id, currentStatus: task.status });
                  }}
                >
                  <Checkbox checked={task.status === 'concluida'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        task.status === 'concluida' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.titulo}
                    </span>
                    <Badge variant="outline" className={`text-xs ${priorityColors[task.prioridade]}`}>
                      {priorityLabels[task.prioridade]}
                    </Badge>
                    {task.status !== 'concluida' && task.status !== 'pendente' && (
                      <Badge variant="outline" className={`text-xs ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </Badge>
                    )}
                  </div>

                  {task.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.descricao}</p>
                  )}

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {task.responsavel_nome && <span>{task.responsavel_nome}</span>}
                    {task.data_fim && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                        <CalendarClock className="h-3 w-3" />
                        {format(parseISO(task.data_fim), 'dd/MM/yyyy')}
                        {daysLeft !== null && daysLeft < 0 && ` (${Math.abs(daysLeft)}d atraso)`}
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && ` (${daysLeft}d restante${daysLeft !== 1 ? 's' : ''})`}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask.mutate(task.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            task={editingTask}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Task Form ----
interface TaskFormProps {
  projectId: string;
  task?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function TaskForm({ projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const [titulo, setTitulo] = useState(task?.titulo || '');
  const [descricao, setDescricao] = useState(task?.descricao || '');
  const [status, setStatus] = useState(task?.status || 'pendente');
  const [prioridade, setPrioridade] = useState(task?.prioridade || 'media');
  const [responsavelId, setResponsavelId] = useState(task?.responsavel_id || '');
  const [dataInicio, setDataInicio] = useState(task?.data_inicio || '');
  const [dataFim, setDataFim] = useState(task?.data_fim || '');
  const [submitting, setSubmitting] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ['profiles-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setSubmitting(true);
    try {
      const taskData: any = {
        project_id: projectId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        status,
        prioridade,
        responsavel_id: responsavelId || null,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
      };

      if (status === 'concluida' && !task?.data_conclusao) {
        taskData.data_conclusao = new Date().toISOString().split('T')[0];
      }

      if (task?.id) {
        const { error } = await supabase
          .from('project_tasks')
          .update(taskData)
          .eq('id', task.id);
        if (error) throw error;
        toast({ title: 'Tarefa atualizada' });
      } else {
        const { error } = await supabase.from('project_tasks').insert([taskData]);
        if (error) throw error;
        toast({ title: 'Tarefa criada' });
      }
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da tarefa" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsável</Label>
        <Select value={responsavelId || 'none'} onValueChange={(v) => setResponsavelId(v === 'none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem responsável</SelectItem>
            {profiles?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes da tarefa..." rows={3} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting || !titulo.trim()}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {task ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
