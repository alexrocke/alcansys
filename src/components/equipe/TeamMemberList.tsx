import { MoreHorizontal, Pencil, Loader2, Mail, Shield, Clock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamMemberListProps {
  members: any[];
  isLoading: boolean;
  onEdit: (member: any) => void;
  onRefetch: () => void;
}

const statusColors = {
  ativo: 'bg-green-500/10 text-green-500 border-green-500/20',
  pendente: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  inativo: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const statusLabels = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  inativo: 'Inativo',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  financeiro: 'Financeiro',
  marketing: 'Marketing',
  usuario: 'Usuário',
};

export function TeamMemberList({ members, isLoading, onEdit, onRefetch }: TeamMemberListProps) {
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

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum membro encontrado
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Permissões</TableHead>
            <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {member.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{member.nome}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{member.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={statusColors[member.status as keyof typeof statusColors]}
                >
                  {statusLabels[member.status as keyof typeof statusLabels]}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {member.roles.length > 0 ? (
                    member.roles.map((role: string) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {roleLabels[role] || role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem permissões</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(member.created_at)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
