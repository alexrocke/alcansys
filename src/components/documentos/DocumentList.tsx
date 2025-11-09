import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Loader2, Download, FileText, Tag as TagIcon } from 'lucide-react';
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

interface DocumentListProps {
  documents: any[];
  isLoading: boolean;
  onEdit: (document: any) => void;
  onRefetch: () => void;
}

const tipoColors = {
  contrato: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  proposta: 'bg-green-500/10 text-green-500 border-green-500/20',
  relatorio: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  outros: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const tipoLabels = {
  contrato: 'Contrato',
  proposta: 'Proposta',
  relatorio: 'Relatório',
  outros: 'Outros',
};

export function DocumentList({ documents, isLoading, onEdit, onRefetch }: DocumentListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const doc = documents.find(d => d.id === deleteId);
      
      // Delete file from storage
      if (doc?.url) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.url]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Documento excluído',
        description: 'O documento foi excluído com sucesso.',
      });

      onRefetch();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Ocorreu um erro ao excluir o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.nome;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download iniciado',
        description: 'O arquivo está sendo baixado.',
      });
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erro ao baixar',
        description: error.message || 'Ocorreu um erro ao baixar o documento.',
        variant: 'destructive',
      });
    }
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

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum documento encontrado
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Projeto</TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="hidden lg:table-cell">Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{document.nome}</div>
                      {document.autor && (
                        <div className="text-xs text-muted-foreground">
                          por {document.autor.nome}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={tipoColors[document.tipo as keyof typeof tipoColors]}
                  >
                    {tipoLabels[document.tipo as keyof typeof tipoLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {document.project ? (
                    <span className="text-sm">{document.project.nome}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {document.tags && document.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-primary/10 text-xs"
                        >
                          <TagIcon className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {document.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{document.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(document.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(document)}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(document)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(document.id)}
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
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita e o arquivo será removido permanentemente.
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
