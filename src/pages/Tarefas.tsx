import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ListChecks,
  Trash2,
  Filter,
  FolderKanban,
} from 'lucide-react';
import { isPast, parseISO, format, differenceInDays } from 'date-fns';

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

export default function Tarefas() {
  const { currentCompany } = useCompany();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const isAdminOrGestor = userRole === 'admin' || userRole === 'gestor';

  const { data: projects } = useQuery({
    queryKey: ['projects-list', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome')
        .eq('company_id', currentCompany.id)
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['all-tasks', currentCompany?.id, user?.id, isAdminOrGestor],
    queryFn: async () => {
      if (!currentCompany?.id || !user?.id) return [];

      let query = supabase
        .from('project_tasks')
        .select('*, projects(nome)')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (!isAdminOrGestor) {
        query = query.eq('responsavel_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch responsavel names
      const ids = [...new Set((data || []).map(t => t.responsavel_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', ids);
        profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p.nome }), {});
      }

      return (data || []).map(t => ({
        ...t,
        project_nome: (t.projects as any)?.nome || 'Sem projeto',
        responsavel_nome: t.responsavel_id ? profilesMap[t.responsavel_id] || null : null,
      }));
    },
    enabled: !!currentCompany?.id && !!user?.id,
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ taskId, currentStatus }: { taskId: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
      const { error } = await supabase
        .from('project_tasks')
        .update({
          status: newStatus,
          data_conclusao: newStatus === 'concluida' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      toast({ title: 'Tarefa excluída' });
    },
  });

  const filtered = (tasks || []).filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.prioridade !== filterPriority) return false;
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    return true;
  });

  const pendentes = filtered.filter(t => t.status === 'pendente' || t.status === 'em_andamento').length;
  const concluidas = filtered.filter(t => t.status === 'concluida').length;

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    handleCloseForm();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            {isAdminOrGestor ? 'Todas as tarefas da empresa' : 'Minhas tarefas'}
          </p>
        </div>
        {isAdminOrGestor && (
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{concluidas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma tarefa encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const isOverdue =
              task.status !== 'concluida' && task.status !== 'cancelada' && task.data_fim && isPast(parseISO(task.data_fim));
            const daysLeft =
              task.data_fim && task.status !== 'concluida'
                ? differenceInDays(parseISO(task.data_fim), new Date())
                : null;

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
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
                    <span className={`text-sm font-medium ${task.status === 'concluida' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
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

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {task.project_nome}
                    </span>
                    {task.responsavel_nome && <span>{task.responsavel_nome}</span>}
                    {task.data_fim && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                        <CalendarClock className="h-3 w-3" />
                        {format(parseISO(task.data_fim), 'dd/MM/yyyy')}
                        {daysLeft !== null && daysLeft < 0 && ` (${Math.abs(daysLeft)}d atraso)`}
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && ` (${daysLeft}d)`}
                      </span>
                    )}
                  </div>
                </div>

                {isAdminOrGestor && (
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
                )}
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
            task={editingTask}
            projects={projects || []}
            companyId={currentCompany?.id || ''}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Task Form with project selection ----
interface TaskFormProps {
  task?: any;
  projects: { id: string; nome: string }[];
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function TaskForm({ task, projects, companyId, onSuccess, onCancel }: TaskFormProps) {
  const [projectId, setProjectId] = useState(task?.project_id || '');
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
    if (!titulo.trim() || !projectId) return;

    setSubmitting(true);
    try {
      const taskData: any = {
        project_id: projectId,
        company_id: companyId,
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
        const { error } = await supabase.from('project_tasks').update(taskData).eq('id', task.id);
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
        <Label>Projeto *</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            {profiles?.map(p => (
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
        <Button type="submit" disabled={submitting || !titulo.trim() || !projectId}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {task ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
