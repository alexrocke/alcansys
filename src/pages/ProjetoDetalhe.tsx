import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, DollarSign, Users, FileText, ListChecks, Loader2, AlertTriangle } from 'lucide-react';
import { ProjectTasks } from '@/components/projetos/ProjectTasks';

const statusColors: Record<string, string> = {
  planejamento: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  em_andamento: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  concluido: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const formatCurrency = (value: number | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, client:clients(id, nome), gestor:profiles(id, nome)`)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: finances } = useQuery({
    queryKey: ['project-finances', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .eq('project_id', id!)
        .order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ['project-documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, autor:profiles(nome)')
        .eq('project_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['project-team', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('responsavel_id')
        .eq('project_id', id!)
        .not('responsavel_id', 'is', null);
      if (error) throw error;
      const uniqueIds = [...new Set(data.map(t => t.responsavel_id).filter(Boolean))];
      if (uniqueIds.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', uniqueIds as string[]);
      if (pErr) throw pErr;
      return profiles;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/projetos')}>Voltar</Button>
      </div>
    );
  }

  const totalReceitas = finances?.filter(f => f.tipo === 'receita').reduce((s, f) => s + Number(f.valor), 0) || 0;
  const totalDespesas = finances?.filter(f => f.tipo === 'despesa').reduce((s, f) => s + Number(f.valor), 0) || 0;
  const overBudget = (project.orcamento || 0) > 0 && totalDespesas > (project.orcamento || 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projetos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.nome}</h1>
            <Badge variant="outline" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {project.area} {project.client?.nome ? `• Cliente: ${project.client.nome}` : ''}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Orçamento</p>
                <p className="text-lg font-semibold">{formatCurrency(project.orcamento)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              {overBudget ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <DollarSign className="h-5 w-5 text-green-500" />}
              <div>
                <p className="text-xs text-muted-foreground">Custo Real</p>
                <p className={`text-lg font-semibold ${overBudget ? 'text-destructive' : 'text-green-500'}`}>
                  {formatCurrency(totalDespesas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="text-sm font-medium">{formatDate(project.data_inicio)} — {formatDate(project.data_fim)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Gestor</p>
                <p className="text-sm font-medium">{project.gestor?.nome || 'Não atribuído'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.descricao && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Descrição / Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.descricao}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tarefas" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="tarefas"><ListChecks className="h-4 w-4 mr-1" />Tarefas</TabsTrigger>
          <TabsTrigger value="financeiro"><DollarSign className="h-4 w-4 mr-1" />Financeiro</TabsTrigger>
          <TabsTrigger value="equipe"><Users className="h-4 w-4 mr-1" />Equipe</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1" />Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="tarefas">
          <Card>
            <CardContent className="pt-6">
              <ProjectTasks projectId={project.id} projectName={project.nome} companyId={project.company_id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimentações Financeiras</CardTitle>
            </CardHeader>
            <CardContent>
              {!finances?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
              ) : (
                <>
                  <div className="flex gap-4 mb-4 flex-wrap">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-sm py-1 px-3">
                      Receitas: {formatCurrency(totalReceitas)}
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-sm py-1 px-3">
                      Despesas: {formatCurrency(totalDespesas)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {finances.map(f => (
                      <div key={f.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{f.descricao}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(f.data)} • {f.area || '-'}</p>
                        </div>
                        <span className={`text-sm font-semibold ${f.tipo === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                          {f.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(f.valor))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pessoas Envolvidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.gestor && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {project.gestor.nome?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{project.gestor.nome}</p>
                      <p className="text-xs text-muted-foreground">Gestor do Projeto</p>
                    </div>
                  </div>
                )}
                {teamMembers?.filter(m => m.id !== project.gestor_id).map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center text-foreground font-semibold text-sm">
                      {member.nome?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.nome}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
                {!project.gestor && (!teamMembers || teamMembers.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhuma pessoa atribuída.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              {!documents?.length ? (
                <p className="text-sm text-muted-foreground">Nenhum documento vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipo} • {formatDate(doc.created_at)} • {(doc as any).autor?.nome || '-'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">Abrir</a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
