import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function VendedorClientes() {
  const { user } = useAuth();

  const { data: salesperson } = useQuery({
    queryKey: ['my-salesperson', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('salespeople').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: wonLeads = [], isLoading } = useQuery({
    queryKey: ['my-clients', salesperson?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('salesperson_id', salesperson!.id)
        .eq('status', 'ganho')
        .order('data_conversao', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!salesperson?.id,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meus Clientes</h1>
      <p className="text-sm text-muted-foreground">Leads convertidos em clientes</p>
      <Card className="border-2 rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : wonLeads.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente convertido ainda</TableCell></TableRow>
              ) : (
                wonLeads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.empresa || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{lead.email || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{lead.telefone || '-'}</TableCell>
                    <TableCell>{lead.valor_estimado ? formatCurrency(Number(lead.valor_estimado)) : '-'}</TableCell>
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
