import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupervisaoPanel } from '@/components/conversas/SupervisaoPanel';
import { Search, Bot, User, MessageSquare, Lock } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando: 'Aguardando',
  resolvida: 'Resolvida',
  arquivada: 'Arquivada',
};

const statusColors: Record<string, string> = {
  aberta: 'bg-blue-500/10 text-blue-700 border-blue-200',
  em_atendimento: 'bg-green-500/10 text-green-700 border-green-200',
  aguardando: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  resolvida: 'bg-gray-500/10 text-gray-700 border-gray-200',
  arquivada: 'bg-gray-500/10 text-gray-500 border-gray-200',
};

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any;
  onSelectConversation: (conv: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  isLoading: boolean;
  openCount: number;
  iaCount: number;
  isMobile: boolean;
  companyId: string | undefined;
  userId: string | undefined;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  openCount,
  iaCount,
  isMobile,
  companyId,
  userId,
}: ConversationListProps) {
  const isLockedByOther = (conv: any) => {
    if (!conv.locked_by || conv.locked_by === userId) return false;
    if (!conv.locked_at) return false;
    const lockAge = Date.now() - new Date(conv.locked_at).getTime();
    return lockAge < 5 * 60 * 1000; // 5 min expiry
  };

  return (
    <div className={`w-full md:w-96 border-r border-border flex flex-col bg-background ${selectedConversation && isMobile ? 'hidden' : 'flex'}`}>
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Conversas</h1>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">{openCount} abertas</Badge>
            <Badge variant="secondary" className="gap-1"><Bot className="h-3 w-3" />{iaCount} IA</Badge>
            <SupervisaoPanel companyId={companyId} />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <p className="p-4 text-center text-muted-foreground">Carregando...</p>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma conversa</p>
          </div>
        ) : (
          conversations.map((conv: any) => {
            const locked = isLockedByOther(conv);
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-muted' : ''} ${locked ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{conv.contato_nome}</p>
                      {conv.atendente_tipo === 'ia' ? (
                        <Bot className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      )}
                      {locked && <Lock className="h-3 w-3 text-destructive shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.ultima_mensagem || 'Sem mensagens'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[conv.status]}`}>
                      {statusLabels[conv.status]}
                    </Badge>
                    {conv.ultima_mensagem_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(conv.ultima_mensagem_at), 'HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
