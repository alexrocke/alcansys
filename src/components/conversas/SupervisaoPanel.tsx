import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Circle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface AgentInfo {
  user_id: string;
  status: string;
  last_seen_at: string;
  nome: string;
  active_conversations: number;
}

function getPresenceStatus(lastSeenAt: string, status: string): 'online' | 'away' | 'offline' {
  if (status === 'offline') return 'offline';
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 2 * 60 * 1000) return 'online';
  if (diff < 5 * 60 * 1000) return 'away';
  return 'offline';
}

const statusConfig = {
  online: { color: 'text-green-500', bg: 'bg-green-500/10 text-green-700 border-green-200', label: 'Online' },
  away: { color: 'text-yellow-500', bg: 'bg-yellow-500/10 text-yellow-700 border-yellow-200', label: 'Ausente' },
  offline: { color: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', label: 'Offline' },
};

export function SupervisaoPanel({ companyId }: { companyId: string | undefined }) {
  const { data: agents = [] } = useQuery({
    queryKey: ['agent-presence', companyId],
    queryFn: async (): Promise<AgentInfo[]> => {
      if (!companyId) return [];

      const { data: presence, error } = await supabase
        .from('agent_presence' as any)
        .select('user_id, status, last_seen_at')
        .eq('company_id', companyId);

      if (error || !presence?.length) return [];

      const userIds = (presence as any[]).map((p: any) => p.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      const { data: convCounts } = await supabase
        .from('conversations')
        .select('atendente_id')
        .eq('company_id', companyId)
        .in('status', ['aberta', 'em_atendimento'] as any);

      const countMap: Record<string, number> = {};
      (convCounts || []).forEach((c: any) => {
        if (c.atendente_id) {
          countMap[c.atendente_id] = (countMap[c.atendente_id] || 0) + 1;
        }
      });

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.nome]));

      return (presence as any[]).map((p: any) => ({
        user_id: p.user_id,
        status: p.status,
        last_seen_at: p.last_seen_at,
        nome: profileMap[p.user_id] || 'Desconhecido',
        active_conversations: countMap[p.user_id] || 0,
      })).sort((a, b) => {
        const order = { online: 0, away: 1, offline: 2 };
        const sa = getPresenceStatus(a.last_seen_at, a.status);
        const sb = getPresenceStatus(b.last_seen_at, b.status);
        return order[sa] - order[sb];
      });
    },
    enabled: !!companyId,
    refetchInterval: 15000,
  });

  const onlineCount = agents.filter(a => getPresenceStatus(a.last_seen_at, a.status) === 'online').length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Supervisão</span>
          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{onlineCount}</Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supervisão de Atendentes
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          <div className="space-y-2">
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum atendente registrado</p>
            ) : (
              agents.map((agent) => {
                const presence = getPresenceStatus(agent.last_seen_at, agent.status);
                const config = statusConfig[presence];
                return (
                  <div key={agent.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2.5">
                      <Circle className={`h-2.5 w-2.5 fill-current ${config.color}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.nome}</p>
                        <Badge variant="outline" className={`text-[10px] mt-0.5 ${config.bg}`}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{agent.active_conversations}</p>
                      <p className="text-[10px] text-muted-foreground">conversas</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
