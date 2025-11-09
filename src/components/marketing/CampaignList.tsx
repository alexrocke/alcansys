import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Loader2, Calendar, DollarSign, TrendingUp } from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignListProps {
  campaigns: any[];
  isLoading: boolean;
  onEdit: (campaign: any) => void;
  onRefetch: () => void;
}

const statusColors = {
  ativa: 'bg-green-500/10 text-green-500 border-green-500/20',
  pausada: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  concluida: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const statusLabels = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  concluida: 'Concluída',
};

export function CampaignList({ campaigns, isLoading, onEdit, onRefetch }: CampaignListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Campanha excluída',
        description: 'A campanha foi excluída com sucesso.',
      });

      onRefetch();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir a campanha.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma campanha encontrada
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Período</TableHead>
              <TableHead className="hidden lg:table-cell">Orçamento</TableHead>
              <TableHead className="hidden lg:table-cell">ROI</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{campaign.nome}</div>
                    {campaign.descricao && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {campaign.descricao}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[campaign.status as keyof typeof statusColors]}
                  >
                    {statusLabels[campaign.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <div className="flex flex-col">
                      {campaign.data_inicio && (
                        <span>{format(new Date(campaign.data_inicio), 'dd/MM/yyyy')}</span>
                      )}
                      {campaign.data_fim && (
                        <span className="text-xs">até {format(new Date(campaign.data_fim), 'dd/MM/yyyy')}</span>
                      )}
                      {!campaign.data_inicio && !campaign.data_fim && '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-semibold">{formatCurrency(campaign.orcamento)}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {campaign.roi !== null && campaign.roi !== undefined ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-3 w-3 ${campaign.roi >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`font-semibold ${campaign.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(campaign.roi).toFixed(1)}%
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
                      <DropdownMenuItem onClick={() => onEdit(campaign)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(campaign.id)}
                        className="text-red-600"
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
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
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
