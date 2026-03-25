import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Receipt, Zap, Monitor, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function PortalDashboard() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: projects = [] } = useQuery({
    queryKey: ['portal-projects', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome, status, data_fim')
        .eq('company_id', companyId!)
        .in('status', ['planejamento', 'em_andamento'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['portal-invoices', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId!)
        .order('data_vencimento', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['portal-automations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_automations')
        .select('id, status, template_id, workflow_templates(nome)')
        .eq('company_id', companyId!)
        .eq('status', 'ativa');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ['portal-systems', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_systems')
        .select('*')
        .eq('company_id', companyId!)
        .eq('status', 'ativo');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const pendingInvoices = invoices.filter((i) => i.status === 'pendente' || i.status === 'vencido');
  const totalPending = pendingInvoices.reduce((s, i) => s + Number(i.valor), 0);

  const statusLabels: Record<string, string> = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    pendente: 'Pendente',
    vencido: 'Vencido',
    pago: 'Pago',
  };

  if (!currentCompany) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Olá, {currentCompany.nome}
        </h1>
        <p className="text-sm text-muted-foreground">Resumo dos seus serviços e informações</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projetos Ativos</CardTitle>
            <FolderKanban className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{projects.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturas Pendentes</CardTitle>
            <Receipt className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">{pendingInvoices.length} fatura(s)</p>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Automações Ativas</CardTitle>
            <Zap className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{automations.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sistemas Ativos</CardTitle>
            <Monitor className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{systems.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderKanban className="h-5 w-5" /> Projetos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum projeto ativo</p>
            ) : (
              projects.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{p.nome}</p>
                    {p.data_fim && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Prazo: {format(new Date(p.data_fim), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{statusLabels[p.status] || p.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Últimas Faturas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma fatura</p>
            ) : (
              invoices.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{inv.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {format(new Date(inv.data_vencimento), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(Number(inv.valor))}</p>
                    <Badge
                      variant="outline"
                      className={
                        inv.status === 'pago'
                          ? 'text-green-600 border-green-200'
                          : inv.status === 'vencido'
                          ? 'text-red-600 border-red-200'
                          : 'text-yellow-600 border-yellow-200'
                      }
                    >
                      {inv.status === 'pago' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Pago</>
                      ) : inv.status === 'vencido' ? (
                        <><AlertCircle className="h-3 w-3 mr-1" />Vencido</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" />Pendente</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
