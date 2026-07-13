import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PortalProjetos() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: projects = [] } = useQuery({
    queryKey: ['portal-projetos', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, nome, status, area, data_inicio, data_fim, descricao').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColors: Record<string, string> = {
    planejamento: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    em_andamento: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    concluido: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2"><FolderKanban className="h-7 w-7" />Meus Projetos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o andamento, marcos e faturas dos seus projetos.</p>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum projeto ativo.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <Link key={p.id} to={`/portal/projetos/${p.id}`}>
              <Card className="hover:border-primary transition cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold">{p.nome}</h3>
                    <Badge variant="outline" className={statusColors[p.status]}>{p.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.area}</p>
                  {p.descricao && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{p.data_inicio || '-'} → {p.data_fim || '-'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
