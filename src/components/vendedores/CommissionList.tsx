import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CheckCircle, DollarSign } from 'lucide-react';

interface Props {
  commissions: any[];
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onApprove: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusLabels: Record<string, string> = { pendente: 'Pendente', aprovada: 'Aprovada', paga: 'Paga' };
const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  aprovada: 'bg-blue-500/10 text-blue-700 border-blue-200',
  paga: 'bg-green-500/10 text-green-700 border-green-200',
};

export function CommissionList({ commissions, isLoading, statusFilter, onStatusFilterChange, onApprove, onMarkPaid }: Props) {
  const filtered = statusFilter === 'all' ? commissions : commissions.filter(c => c.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="paga">Paga</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendedor</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor Venda</TableHead>
            <TableHead>%</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma comissão</TableCell></TableRow>
          ) : (
            filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.salespeople?.nome || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{c.descricao}</TableCell>
                <TableCell>{formatCurrency(Number(c.valor_venda))}</TableCell>
                <TableCell>{c.percentual}%</TableCell>
                <TableCell className="font-semibold">{formatCurrency(Number(c.valor_comissao))}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(c.data_venda), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {c.status === 'pendente' && (
                      <Button size="sm" variant="outline" onClick={() => onApprove(c.id)} className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Aprovar
                      </Button>
                    )}
                    {c.status === 'aprovada' && (
                      <Button size="sm" variant="outline" onClick={() => onMarkPaid(c.id)} className="gap-1">
                        <DollarSign className="h-3 w-3" /> Pagar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
