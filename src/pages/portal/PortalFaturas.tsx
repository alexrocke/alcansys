import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  pago: { label: 'Pago', variant: 'default' },
  vencido: { label: 'Vencido', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
};

export default function PortalFaturas() {
  const { currentCompany } = useCompany();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['portal-invoices', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany,
  });

  const totalPendente = invoices?.filter((i) => i.status === 'pendente').reduce((s, i) => s + Number(i.valor), 0) || 0;
  const totalPago = invoices?.filter((i) => i.status === 'pago').reduce((s, i) => s + Number(i.valor), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faturas</h1>
        <p className="text-muted-foreground">Acompanhe seus pagamentos e faturas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pago</p>
            <p className="text-2xl font-bold text-green-600">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !invoices?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma fatura encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const cfg = statusConfig[inv.status] || statusConfig.pendente;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.descricao}</TableCell>
                    <TableCell>R$ {Number(inv.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{format(new Date(inv.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{inv.data_pagamento ? format(new Date(inv.data_pagamento), "dd/MM/yyyy", { locale: ptBR }) : '—'}</TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
