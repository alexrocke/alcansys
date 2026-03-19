import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusLabels: Record<string, string> = {
  novo: 'Novo', contatado: 'Contatado', qualificado: 'Qualificado', proposta: 'Proposta',
  negociacao: 'Negociação', ganho: 'Ganho', perdido: 'Perdido',
};
const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/10 text-blue-700', contatado: 'bg-yellow-500/10 text-yellow-700',
  qualificado: 'bg-purple-500/10 text-purple-700', proposta: 'bg-orange-500/10 text-orange-700',
  negociacao: 'bg-cyan-500/10 text-cyan-700', ganho: 'bg-green-500/10 text-green-700',
  perdido: 'bg-red-500/10 text-red-700',
};

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function VendedorLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updatingLead, setUpdatingLead] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data: salesperson } = useQuery({
    queryKey: ['my-salesperson', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('salespeople').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['my-leads', salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('salesperson_id', salesperson!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'ganho') updateData.data_conversao = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('leads').update(updateData).eq('id', id);
      if (error) throw error;

      // Auto-create commission on win
      if (status === 'ganho' && salesperson) {
        const lead = leads.find(l => l.id === id);
        const valorVenda = Number(lead?.valor_estimado) || 0;
        const percentual = Number(salesperson.percentual_comissao) || 10;
        const valorComissao = (valorVenda * percentual) / 100;
        await supabase.from('commissions').insert({
          salesperson_id: salesperson.id,
          lead_id: id,
          company_id: salesperson.company_id,
          descricao: `Comissão - ${lead?.nome || 'Lead'}`,
          valor_venda: valorVenda,
          percentual,
          valor_comissao: valorComissao,
          data_venda: new Date().toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-commissions'] });
      toast({ title: 'Status atualizado' });
      setUpdatingLead(null);
    },
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Leads</h1>
      <Card className="border-2 rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : leads.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum lead atribuído</TableCell></TableRow>
              ) : (
                leads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{lead.empresa || '-'}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{lead.valor_estimado ? formatCurrency(Number(lead.valor_estimado)) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setUpdatingLead(lead); setNewStatus(lead.status); }}>Atualizar</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!updatingLead} onOpenChange={(o) => !o && setUpdatingLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atualizar Status - {updatingLead?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUpdatingLead(null)}>Cancelar</Button>
              <Button onClick={() => updateStatus.mutate({ id: updatingLead.id, status: newStatus })}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
