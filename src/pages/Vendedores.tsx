import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalespersonForm } from '@/components/vendedores/SalespersonForm';
import { SalespersonList } from '@/components/vendedores/SalespersonList';
import { CommissionList } from '@/components/vendedores/CommissionList';
import { Plus, Users, DollarSign, Clock, CheckCircle, FileDown } from 'lucide-react';
import { generateSalesReport } from '@/lib/reportGenerator';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Vendedores() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = currentCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSp, setEditingSp] = useState<any>(null);
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');

  const { data: salespeople = [], isLoading: spLoading } = useQuery({
    queryKey: ['salespeople', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('salespeople').select('*').eq('company_id', companyId!).order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: commissions = [], isLoading: comLoading } = useQuery({
    queryKey: ['commissions', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*, salespeople(nome)')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const deleteSp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('salespeople').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespeople'] });
      toast({ title: 'Vendedor excluído' });
    },
  });

  const updateCommission = useMutation({
    mutationFn: async ({ id, status, data_pagamento }: { id: string; status: string; data_pagamento?: string }) => {
      const payload: any = { status };
      if (data_pagamento) payload.data_pagamento = data_pagamento;
      const { error } = await supabase.from('commissions').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast({ title: 'Comissão atualizada' });
    },
  });

  const totalSalespeople = salespeople.filter((s: any) => s.status === 'ativo').length;
  const pendingCommissions = commissions.filter((c: any) => c.status === 'pendente').reduce((s: number, c: any) => s + Number(c.valor_comissao), 0);
  const paidCommissions = commissions.filter((c: any) => c.status === 'paga').reduce((s: number, c: any) => s + Number(c.valor_comissao), 0);
  const totalSales = commissions.reduce((s: number, c: any) => s + Number(c.valor_venda), 0);

  if (!currentCompany) {
    return <div className="p-6 flex items-center justify-center h-full"><p className="text-muted-foreground">Selecione uma empresa.</p></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Vendedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua equipe de vendas e comissões</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => { setEditingSp(null); setIsFormOpen(true); }} className="gap-2 flex-1 md:flex-none">
            <Plus className="h-4 w-4" /> Novo Vendedor
          </Button>
          <Button variant="outline" onClick={() => generateSalesReport(commissions, salespeople)} disabled={!commissions.length} className="gap-2 flex-1 md:flex-none">
            <FileDown className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendedores Ativos</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalSalespeople}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendas</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{formatCurrency(totalSales)}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pendentes</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</div></CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pagas</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{formatCurrency(paidCommissions)}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendedores">
        <TabsList>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>
        <TabsContent value="vendedores">
          <Card className="border-2 rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <SalespersonList
                salespeople={salespeople}
                isLoading={spLoading}
                onEdit={(sp) => { setEditingSp(sp); setIsFormOpen(true); }}
                onDelete={(id) => deleteSp.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comissoes">
          <Card className="border-2 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <CommissionList
                commissions={commissions}
                isLoading={comLoading}
                statusFilter={commissionStatusFilter}
                onStatusFilterChange={setCommissionStatusFilter}
                onApprove={(id) => updateCommission.mutate({ id, status: 'aprovada' })}
                onMarkPaid={(id) => updateCommission.mutate({ id, status: 'paga', data_pagamento: new Date().toISOString().split('T')[0] })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSp ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
          </DialogHeader>
          <SalespersonForm
            salesperson={editingSp}
            companyId={companyId!}
            onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['salespeople'] }); setIsFormOpen(false); setEditingSp(null); }}
            onCancel={() => { setIsFormOpen(false); setEditingSp(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
