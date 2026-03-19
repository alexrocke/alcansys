import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceListProps {
  finances: any[];
  isLoading: boolean;
  onEdit: (finance: any) => void;
  onRefetch: () => void;
}

export function FinanceList({ finances, isLoading, onEdit, onRefetch }: FinanceListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.',
      });

      onRefetch();
      setDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting finance:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir a transação.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (finances.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Natureza</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finances.map((finance) => (
              <TableRow key={finance.id}>
                <TableCell className="font-medium">
                  {formatDate(finance.data)}
                </TableCell>
                <TableCell>
                  {finance.tipo === 'receita' ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Receita
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Despesa
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    finance.natureza === 'fixo'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }>
                    {finance.natureza === 'fixo' ? 'Fixo' : 'Variável'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {finance.descricao}
                </TableCell>
                <TableCell>{finance.area || '-'}</TableCell>
                <TableCell>{finance.project?.nome || '-'}</TableCell>
                <TableCell className={`text-right font-semibold ${
                  finance.tipo === 'receita' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {finance.tipo === 'receita' ? '+' : '-'} {formatCurrency(Number(finance.valor))}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(finance)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(finance.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
