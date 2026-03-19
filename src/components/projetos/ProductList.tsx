import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ProductList() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, project:projects(nome)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const toggleAtivo = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ ativo: !current }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      refetch();
    }
  };

  const formatCurrency = (v: number | null) =>
    v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '-';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhum produto ainda.</p>
        <p className="text-sm text-muted-foreground">Conclua um projeto e converta-o em produto.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product: any) => (
        <Card key={product.id} className="border-2 rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-lg">{product.nome}</CardTitle>
              {product.categoria && (
                <Badge variant="outline" className="mt-1">{product.categoria}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleAtivo(product.id, product.ativo)}
              title={product.ativo ? 'Desativar' : 'Ativar'}
            >
              {product.ativo ? (
                <ToggleRight className="h-5 w-5 text-green-500" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {product.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">{product.descricao}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-foreground">{formatCurrency(product.preco)}</span>
              <Badge variant={product.ativo ? 'default' : 'secondary'}>
                {product.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {product.project?.nome && (
              <p className="text-xs text-muted-foreground">Projeto: {product.project.nome}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
