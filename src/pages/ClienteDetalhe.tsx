import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Phone, User, FolderKanban, Monitor, Bot, FileText, DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: client, isLoading } = useQuery({
    queryKey: ['client-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projects } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('client_id', id!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: systems } = useQuery({
    queryKey: ['client-systems', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('client_systems').select('*').eq('company_id', companyId).order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: automations } = useQuery({
    queryKey: ['client-automations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('client_automations').select('*, workflow_templates(nome, icone, categoria)').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: documents } = useQuery({
    queryKey: ['client-documents', id, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const projectIds = projects?.map(p => p.id) || [];
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase.from('documents').select('*').in('project_id', projectIds).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!projects,
  });

  const { data: finances } = useQuery({
    queryKey: ['client-finances', id, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const projectIds = projects?.map(p => p.id) || [];
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase.from('finances').select('*').in('project_id', projectIds).order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!projects,
  });

  const { data: invoices } = useQuery({
    queryKey: ['client-invoices', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('invoices').select('*').eq('company_id', companyId).order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cliente não encontrado.
        <Button variant="link" onClick={() => navigate('/clientes')}>Voltar</Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-500/10 text-green-500 border-green-500/20',
    inativo: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  const projectStatusLabels: Record<string, string> = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{client.nome}</h1>
          <p className="text-sm text-muted-foreground">Detalhes do cliente</p>
        </div>
        <Badge variant="outline" className={statusColors[client.status] || ''}>
          {client.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="font-medium text-foreground">{client.area || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground truncate">{client.email || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{client.telefone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="font-medium text-foreground">{client.plano || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projetos" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="projetos" className="gap-1.5">
            <FolderKanban className="h-4 w-4" /> Projetos ({projects?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sistemas" className="gap-1.5">
            <Monitor className="h-4 w-4" /> Sistemas ({systems?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-1.5">
            <Bot className="h-4 w-4" /> Automações ({automations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-4 w-4" /> Documentos ({documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5">
            <DollarSign className="h-4 w-4" /> Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projetos">
          {!projects?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum projeto vinculado.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell><Badge variant="outline">{p.area}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{projectStatusLabels[p.status] || p.status}</Badge></TableCell>
                      <TableCell>{p.orcamento ? formatCurrency(p.orcamento) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.data_inicio ? formatDate(p.data_inicio) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.data_fim ? formatDate(p.data_fim) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sistemas">
          {!systems?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum sistema cadastrado.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systems.map(sys => (
                <Card key={sys.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{sys.nome}</CardTitle>
                      <Badge variant="outline" className={sys.status === 'ativo' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}>
                        {sys.status === 'ativo' ? 'Ativo' : sys.status === 'em_desenvolvimento' ? 'Em Dev' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-2">{sys.tipo}</Badge>
                    {sys.url && (
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <a href={sys.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" /> Acessar
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automacoes">
          {!automations?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma automação configurada.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{(a as any).workflow_templates?.nome || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{(a as any).workflow_templates?.categoria || '-'}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={a.status === 'ativa' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos">
          {!documents?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum documento vinculado.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nome}</TableCell>
                      <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={d.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" /> Ver
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Finanças dos Projetos</h3>
          {!finances?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum registro financeiro.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finances.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={f.tipo === 'receita' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                          {f.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(f.valor)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(f.data)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <h3 className="text-lg font-semibold text-foreground">Faturas</h3>
          {!invoices?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma fatura.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.descricao}</TableCell>
                      <TableCell>{formatCurrency(inv.valor)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(inv.data_vencimento)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          inv.status === 'pago' ? 'bg-green-500/10 text-green-500' :
                          inv.status === 'vencido' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
