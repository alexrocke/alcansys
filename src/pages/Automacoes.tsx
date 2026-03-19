import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Zap, Play, Pause, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutomationForm } from '@/components/automacoes/AutomationForm';
import { AutomationList } from '@/components/automacoes/AutomationList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Automacoes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: automations, isLoading, refetch } = useQuery({
    queryKey: ['automations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleEdit = (automation: any) => {
    setEditingAutomation(automation);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAutomation(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  const filteredAutomations = automations?.filter((automation) => {
    const matchesSearch = 
      automation.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.tipo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || automation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAutomations = automations?.length || 0;
  const activeAutomations = automations?.filter(a => a.status === 'ativa').length || 0;
  
  const totalCost = automations?.reduce((sum, a) => sum + (Number(a.custo) || 0), 0) || 0;
  const totalReturn = automations?.reduce((sum, a) => sum + (Number(a.retorno) || 0), 0) || 0;
  
  const roi = totalCost > 0 ? ((totalReturn - totalCost) / totalCost * 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie workflows automatizados e acompanhe ROI
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="gap-2 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Automação</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Automações
            </CardTitle>
            <Zap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {totalAutomations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workflows cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automações Ativas
            </CardTitle>
            <Play className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-500">
              {activeAutomations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workflows em execução
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
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

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Economia Mensal
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalReturn - totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Retorno - Custo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar automações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AutomationList
        automations={filteredAutomations || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefetch={refetch}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
            </DialogTitle>
          </DialogHeader>
          <AutomationForm
            automation={editingAutomation}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
