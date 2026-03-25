import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Activity, Plus, Pencil, Trash2, FileText, Users, DollarSign, Contact, FolderKanban, BadgeDollarSign } from 'lucide-react';
import { format } from 'date-fns';

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  projects: FolderKanban,
  clients: Users,
  finances: DollarSign,
  leads: Contact,
  documents: FileText,
  commissions: BadgeDollarSign,
};

const entityLabels: Record<string, string> = {
  projects: 'Projeto',
  clients: 'Cliente',
  finances: 'Financeiro',
  leads: 'Lead',
  documents: 'Documento',
  commissions: 'Comissão',
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  criou: Plus,
  atualizou: Pencil,
  excluiu: Trash2,
};

const actionColors: Record<string, string> = {
  criou: 'text-green-600 bg-green-500/10 border-green-200',
  atualizou: 'text-blue-600 bg-blue-500/10 border-blue-200',
  excluiu: 'text-red-600 bg-red-500/10 border-red-200',
};

export default function AtividadeLog() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', companyId, entityFilter, actionFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('activity_logs')
        .select('*, user:profiles(id, nome)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const filteredLogs = logs.filter((log: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.entity_name?.toLowerCase().includes(q) ||
      log.user?.nome?.toLowerCase().includes(q) ||
      entityLabels[log.entity_type]?.toLowerCase().includes(q)
    );
  });

  const totalLogs = logs.length;

  if (!currentCompany) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma empresa.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Histórico de Atividades</h1>
          <p className="text-sm text-muted-foreground">Acompanhe todas as ações realizadas no sistema</p>
        </div>
        <Badge variant="outline" className="text-sm self-start">
          <Activity className="h-4 w-4 mr-1" /> {totalLogs} registros
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou usuário..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas entidades</SelectItem>
            {Object.entries(entityLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            <SelectItem value="criou">Criou</SelectItem>
            <SelectItem value="atualizou">Atualizou</SelectItem>
            <SelectItem value="excluiu">Excluiu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-2 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[60vh]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log: any) => {
                  const EntityIcon = entityIcons[log.entity_type] || FileText;
                  const ActionIcon = actionIcons[log.action] || Pencil;
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5 shrink-0">
                        <EntityIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{log.user?.nome || 'Sistema'}</span>
                          <Badge variant="outline" className={`text-xs ${actionColors[log.action] || ''}`}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{entityLabels[log.entity_type] || log.entity_type}</span>
                        </div>
                        {log.entity_name && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">"{log.entity_name}"</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(log.created_at), 'dd/MM HH:mm')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
