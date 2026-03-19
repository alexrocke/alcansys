import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const statusLabels: Record<string, string> = { pendente: 'Pendente', aprovada: 'Aprovada', paga: 'Paga' };
const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-700', aprovada: 'bg-blue-500/10 text-blue-700', paga: 'bg-green-500/10 text-green-700',
};

export default function VendedorComissoes() {
  const { user } = useAuth();

  const { data: salesperson } = useQuery({
    queryKey: ['my-salesperson', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('salespeople').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['my-commissions', salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('commissions').select('*').eq('salesperson_id', salesperson!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Minhas Comissões</h1>
      <Card className="border-2 rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Venda</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : commissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma comissão</TableCell></TableRow>
              ) : (
                commissions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell>{formatCurrency(Number(c.valor_venda))}</TableCell>
                    <TableCell>{c.percentual}%</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(c.valor_comissao))}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(c.data_venda), 'dd/MM/yyyy')}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[c.status]}>{statusLabels[c.status]}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
