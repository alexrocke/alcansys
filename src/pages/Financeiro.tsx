import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceForm } from '@/components/financeiro/FinanceForm';
import { FinanceList } from '@/components/financeiro/FinanceList';
import { FinanceCharts } from '@/components/financeiro/FinanceCharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportFinanceToPDF } from '@/lib/financeExport';
import { toast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Financeiro() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<any>(null);
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [mesFilter, setMesFilter] = useState<string>(format(new Date(), 'yyyy-MM'));
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: finances, isLoading, refetch } = useQuery({
    queryKey: ['finances', companyId, areaFilter, tipoFilter, mesFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('finances')
        .select('*, project:projects(nome)')
        .eq('company_id', companyId)
        .order('data', { ascending: false });

      if (areaFilter !== 'all') {
        query = query.eq('area', areaFilter);
      }

      if (tipoFilter !== 'all') {
        query = query.eq('tipo', tipoFilter as 'receita' | 'despesa');
      }

      const startDate = startOfMonth(new Date(mesFilter + '-01'));
      const endDate = endOfMonth(startDate);
      query = query.gte('data', format(startDate, 'yyyy-MM-dd')).lte('data', format(endDate, 'yyyy-MM-dd'));

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings-financeiro'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('chave', ['meta_mensal', 'custos_fixos', 'areas_ativas']);
      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (finance: any) => {
    setEditingFinance(finance);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFinance(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  const handleExportPDF = async () => {
    if (!finances || finances.length === 0) {
      toast({
        title: 'Sem dados',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await exportFinanceToPDF(finances, mesFilter, {
        metaMensal: (settings?.find(s => s.chave === 'meta_mensal')?.valor as any)?.valor || 0,
        custosFixos: (settings?.find(s => s.chave === 'custos_fixos')?.valor as any)?.valor || 0,
      });
      
      toast({
        title: 'PDF exportado',
        description: 'O relatório foi gerado com sucesso.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao gerar o PDF.',
        variant: 'destructive',
      });
    }
  };

  const areas = (settings?.find(s => s.chave === 'areas_ativas')?.valor as any)?.areas || [];
  const metaMensal = (settings?.find(s => s.chave === 'meta_mensal')?.valor as any)?.valor || 0;
  const custosFixos = (settings?.find(s => s.chave === 'custos_fixos')?.valor as any)?.valor || 0;

  const totalReceitas = finances?.filter(f => f.tipo === 'receita').reduce((sum, f) => sum + Number(f.valor), 0) || 0;
  const totalDespesas = finances?.filter(f => f.tipo === 'despesa').reduce((sum, f) => sum + Number(f.valor), 0) || 0;
  const saldoMensal = totalReceitas - totalDespesas;
  const roi = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestão de receitas e despesas - {format(new Date(mesFilter + '-01'), 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleExportPDF} className="gap-2 flex-1 md:flex-initial">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 flex-1 md:flex-initial">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Transação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metaMensal)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custos fixos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custosFixos)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Mensal
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${saldoMensal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoMensal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {saldoMensal >= 0 ? 'Lucro' : 'Prejuízo'} no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="hidden md:flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <Input
          type="month"
          value={mesFilter}
          onChange={(e) => setMesFilter(e.target.value)}
          className="w-full md:w-[180px]"
        />
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todas as áreas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((area: string) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FinanceCharts finances={finances || []} />

      <FinanceList
        finances={finances || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefetch={refetch}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFinance ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
          </DialogHeader>
          <FinanceForm
            finance={editingFinance}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
