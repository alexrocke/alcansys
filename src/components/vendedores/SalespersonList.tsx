import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Props {
  salespeople: any[];
  isLoading: boolean;
  onEdit: (sp: any) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function SalespersonList({ salespeople, isLoading, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="hidden lg:table-cell">Telefone</TableHead>
          <TableHead className="hidden md:table-cell">Meta</TableHead>
          <TableHead className="hidden md:table-cell">Comissão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
        ) : salespeople.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum vendedor cadastrado</TableCell></TableRow>
        ) : (
          salespeople.map((sp) => (
            <TableRow key={sp.id}>
              <TableCell className="font-medium">{sp.nome}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{sp.email || '-'}</TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">{sp.telefone || '-'}</TableCell>
              <TableCell className="hidden md:table-cell">{formatCurrency(Number(sp.meta_mensal) || 0)}</TableCell>
              <TableCell className="hidden md:table-cell">{sp.percentual_comissao}%</TableCell>
              <TableCell>
                <Badge variant={sp.status === 'ativo' ? 'default' : 'secondary'}>
                  {sp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(sp)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(sp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}