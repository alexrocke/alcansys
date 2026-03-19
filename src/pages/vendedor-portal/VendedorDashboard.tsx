import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function VendedorDashboard() {
  const { user } = useAuth();

  const { data: salesperson } = useQuery({
    queryKey: ['my-salesperson', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('salespeople').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['my-leads-count', salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('id, status, valor_estimado').eq('salesperson_id', salesperson!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['my-commissions-summary', salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('commissions').select('valor_comissao, status').eq('salesperson_id', salesperson!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'ganho').length;
  const totalSales = leads.filter(l => l.status === 'ganho').reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor_comissao), 0);
  const paidCommissions = commissions.filter(c => c.status === 'paga').reduce((s, c) => s + Number(c.valor_comissao), 0);
  const meta = Number(salesperson?.meta_mensal) || 0;
  const progress = meta > 0 ? Math.min((totalSales / meta) * 100, 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Olá, {salesperson?.nome || 'Vendedor'}!</h1>
        <p className="text-sm text-muted-foreground">Acompanhe suas vendas e comissões</p>
      </div>

      {meta > 0 && (
        <Card className="border-2 rounded-2xl">
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Meta Mensal</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(totalSales)}</span>
              <span className="text-muted-foreground">{formatCurrency(meta)}</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% da meta atingida</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meus Leads</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalLeads}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Fechadas</CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{wonLeads}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pendentes</CardTitle>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Recebidas</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{formatCurrency(paidCommissions)}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}
