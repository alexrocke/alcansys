import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export function ProjectInvoices({ projectId }: { projectId: string; companyId: string }) {
  const { data: items = [] } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('project_id', projectId).order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const total = items.reduce((s, i) => s + Number(i.valor || 0), 0);
  const pago = items.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.valor || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" />Faturas do Projeto</h3>
        <p className="text-xs text-muted-foreground">Vincule faturas ao projeto pela tela de Financeiro/Faturas.</p>
      </div>
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm py-1 px-3">Total: {fmt(total)}</Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-sm py-1 px-3">Pago: {fmt(pago)}</Badge>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-sm py-1 px-3">Pendente: {fmt(total - pago)}</Badge>
        </div>
      )}
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma fatura vinculada.</p> : (
        <div className="space-y-2">{items.map(i => (
          <Card key={i.id}><CardContent className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.descricao}</p>
                <p className="text-xs text-muted-foreground">Vencimento: {i.data_vencimento} {i.data_pagamento && `• Pago em ${i.data_pagamento}`}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{fmt(Number(i.valor))}</p>
                <Badge variant="outline" className={i.status === 'pago' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>{i.status}</Badge>
              </div>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
