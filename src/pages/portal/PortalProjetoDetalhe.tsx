import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Flag, Target, Receipt, Loader2 } from 'lucide-react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function PortalProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['portal-projeto', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['portal-milestones', id],
    enabled: !!id,
    queryFn: async () => (await supabase.from('project_milestones').select('*').eq('project_id', id!).order('data_prevista')).data || [],
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ['portal-kpis', id],
    enabled: !!id,
    queryFn: async () => (await supabase.from('project_kpis').select('*').eq('project_id', id!)).data || [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['portal-project-invoices', id],
    enabled: !!id,
    queryFn: async () => (await supabase.from('invoices').select('*').eq('project_id', id!).order('data_vencimento', { ascending: false })).data || [],
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!project) return <div className="p-8 text-center"><p>Projeto não encontrado.</p><Button variant="outline" className="mt-4" onClick={() => navigate('/portal/projetos')}>Voltar</Button></div>;

  const msDone = milestones.filter(m => m.status === 'concluido').length;
  const msPct = milestones.length ? Math.round((msDone / milestones.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/projetos')}><ArrowLeft className="h-5 w-5" /></Button>
        <div><h1 className="text-2xl font-bold">{project.nome}</h1><p className="text-sm text-muted-foreground">{project.area}</p></div>
      </div>

      {project.descricao && <Card><CardContent className="pt-4"><p className="text-sm whitespace-pre-wrap">{project.descricao}</p></CardContent></Card>}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4" />Marcos ({msDone}/{milestones.length})</CardTitle></CardHeader>
        <CardContent>
          <Progress value={msPct} className="h-2 mb-3" />
          {milestones.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum marco.</p> : (
            <div className="space-y-2">{milestones.map(m => (
              <div key={m.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div><p className="text-sm font-medium">{m.titulo}</p><p className="text-xs text-muted-foreground">Prev: {m.data_prevista || '-'} • Entrega: {m.data_entrega || '-'}</p></div>
                <Badge variant="outline">{m.status}</Badge>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Objetivos / KPIs</CardTitle></CardHeader>
        <CardContent>
          {kpis.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum KPI.</p> : (
            <div className="space-y-3">{kpis.map(k => {
              const pct = k.valor_alvo && k.valor_alvo > 0 ? Math.min(100, Math.round(((k.valor_atual || 0) / k.valor_alvo) * 100)) : 0;
              return (
                <div key={k.id}>
                  <div className="flex justify-between text-sm mb-1"><span>{k.titulo}</span><span className="font-medium">{pct}%</span></div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{k.valor_atual ?? 0} / {k.valor_alvo ?? '-'} {k.unidade}</p>
                </div>
              );
            })}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Faturas</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma fatura.</p> : (
            <div className="space-y-2">{invoices.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div><p className="text-sm font-medium">{i.descricao}</p><p className="text-xs text-muted-foreground">Vencimento: {i.data_vencimento}</p></div>
                <div className="text-right"><p className="text-sm font-semibold">{fmt(Number(i.valor))}</p><Badge variant="outline" className={i.status === 'pago' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>{i.status}</Badge></div>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
