import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Loader2, Zap, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AutomationListProps {
  automations: any[];
  isLoading: boolean;
  onEdit: (automation: any) => void;
  onRefetch: () => void;
}

const statusColors = {
  ativa: 'bg-green-500/10 text-green-500 border-green-500/20',
  inativa: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const statusLabels = {
  ativa: 'Ativa',
  inativa: 'Inativa',
};

export function AutomationList({ automations, isLoading, onEdit, onRefetch }: AutomationListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Automação excluída',
        description: 'A automação foi excluída com sucesso.',
      });

      onRefetch();
    } catch (error: any) {
      console.error('Error deleting automation:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir a automação.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateROI = (custo: number | null, retorno: number | null) => {
    if (!custo || !retorno || custo === 0) return null;
    return ((retorno - custo) / custo * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!automations || automations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma automação encontrada
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Automação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Custo</TableHead>
              <TableHead className="hidden md:table-cell">Retorno</TableHead>
              <TableHead className="hidden lg:table-cell">ROI</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map((automation) => {
              const roi = calculateROI(automation.custo, automation.retorno);
              
              return (
                <TableRow key={automation.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {automation.nome}
                      </div>
                      {automation.descricao && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {automation.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10">
                      {automation.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[automation.status as keyof typeof statusColors]}
                    >
                      {statusLabels[automation.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{formatCurrency(automation.custo)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">{formatCurrency(automation.retorno)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {roi !== null ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`h-3 w-3 ${Number(roi) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`font-semibold ${Number(roi) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {roi}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(automation)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(automation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
