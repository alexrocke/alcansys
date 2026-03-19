import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { QuoteRequestForm } from '@/components/portal/QuoteRequestForm';

export default function PortalServicos() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['portal-services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nossos Serviços</h1>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.nome}</CardTitle>
                  {service.categoria && <Badge variant="secondary">{service.categoria}</Badge>}
                </div>
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
      )}
    </div>
  );
}
