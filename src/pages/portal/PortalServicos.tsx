import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { QuoteRequestForm } from '@/components/portal/QuoteRequestForm';

export default function PortalServicos() {
  const { currentCompany } = useCompany();
  const { data: services, isLoading } = useQuery({
    queryKey: ['portal-services', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('ativo', true)
        .order('categoria')
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const grouped = services?.reduce<Record<string, typeof services>>((acc, s) => {
    const cat = s.categoria || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Nossos Serviços</h1>
        <p className="text-muted-foreground">Conheça os serviços que oferecemos e solicite um orçamento.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !services?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped!).map(([categoria, items]) => (
            <div key={categoria} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{categoria}</h2>
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {items.map((service) => (
                  <Card key={service.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{service.nome}</CardTitle>
                      {service.descricao && <CardDescription>{service.descricao}</CardDescription>}
                    </CardHeader>
                    <CardContent className="mt-auto space-y-4">
                      {service.preco_base && (
                        <p className="text-2xl font-bold text-primary">
                          R$ {Number(service.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <QuoteRequestForm
                        serviceId={service.id}
                        serviceName={service.nome}
                        trigger={<Button className="w-full">Solicitar Orçamento</Button>}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
