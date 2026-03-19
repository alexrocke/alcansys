import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { Plus, Search, Users, TrendingUp, Target, DollarSign, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/10 text-blue-700 border-blue-200',
  contatado: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  qualificado: 'bg-purple-500/10 text-purple-700 border-purple-200',
  proposta: 'bg-orange-500/10 text-orange-700 border-orange-200',
  negociacao: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  ganho: 'bg-green-500/10 text-green-700 border-green-200',
  perdido: 'bg-red-500/10 text-red-700 border-red-200',
};

const originLabels: Record<string, string> = {
  site: 'Site',
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  campanha: 'Campanha',
  organico: 'Orgânico',
  outro: 'Outro',
};

export default function Leads() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = currentCompany?.id;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*, responsavel:profiles(id, nome)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead excluído com sucesso' });
    },
  });

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.empresa?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter((l: any) => l.status === 'novo').length;
  const wonLeads = leads.filter((l: any) => l.status === 'ganho').length;
  const totalValue = leads
    .filter((l: any) => l.status !== 'perdido')
    .reduce((sum: number, l: any) => sum + (Number(l.valor_estimado) || 0), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setIsFormOpen(false);
    setEditingLead(null);
  };

  if (!currentCompany) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma empresa para gerenciar leads.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leads & CRM</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie seu funil de vendas e leads</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 w-full md:w-auto">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Novos</CardTitle>
            <UserPlus className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{newLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganhos</CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{wonLeads}</div>
          </CardContent>
        </Card>
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-2 rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Origem</TableHead>
                <TableHead className="hidden lg:table-cell">Valor</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
              ) : (
                filteredLeads.map((lead: any) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLead(lead)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{lead.empresa || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{originLabels[lead.origem]}</TableCell>
                    <TableCell className="hidden lg:table-cell text-foreground">{lead.valor_estimado ? formatCurrency(Number(lead.valor_estimado)) : '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{lead.responsavel?.nome || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingLead(lead); setIsFormOpen(true); }}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <LeadForm lead={editingLead} companyId={companyId!} onSuccess={handleSuccess} onCancel={() => { setIsFormOpen(false); setEditingLead(null); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && <LeadDetail lead={selectedLead} companyId={companyId!} onClose={() => setSelectedLead(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
