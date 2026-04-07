import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, ExternalLink } from 'lucide-react';

const typeLabels: Record<string, string> = {
  landing_page: 'Landing Page',
  sistema: 'Sistema',
  automacao: 'Automação',
  chatbot: 'Chatbot',
  outro: 'Outro',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inativo: { label: 'Inativo', className: 'bg-red-100 text-red-800' },
  em_desenvolvimento: { label: 'Em Desenvolvimento', className: 'bg-yellow-100 text-yellow-800' },
};

export default function PortalSistemas() {
  const { currentCompany } = useCompany();

  const { data: systems, isLoading } = useQuery({
    queryKey: ['portal-systems', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from('client_systems')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany,
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Sistemas Contratados</h1>
        <p className="text-muted-foreground">Acesse os sistemas e plataformas desenvolvidos para você.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !systems?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum sistema contratado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {systems.map((sys) => {
            const st = statusConfig[sys.status] || statusConfig.ativo;
            return (
              <Card key={sys.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{sys.nome}</CardTitle>
                    <Badge className={st.className}>{st.label}</Badge>
                  </div>
                  <Badge variant="outline">{typeLabels[sys.tipo] || sys.tipo}</Badge>
                </CardHeader>
                <CardContent>
                  {sys.url ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={sys.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Acessar
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">Link não disponível</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
