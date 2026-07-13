import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, Flag, AlertTriangle, Target, LifeBuoy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function ProjectsDashboard() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: agg } = useQuery({
    queryKey: ['projects-dashboard', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [projs, milestones, risks, kpis, support, invoices] = await Promise.all([
        supabase.from('projects').select('id, nome, status, orcamento').eq('company_id', companyId!),
        supabase.from('project_milestones').select('project_id, status, data_prevista, data_entrega').eq('company_id', companyId!),
        supabase.from('project_risks').select('project_id, impacto, status').eq('company_id', companyId!),
        supabase.from('project_kpis').select('project_id, valor_alvo, valor_atual').eq('company_id', companyId!),
        supabase.from('project_support').select('project_id, horas_contratadas, horas_consumidas, data_fim_garantia').eq('company_id', companyId!),
        supabase.from('invoices').select('project_id, valor, status').eq('company_id', companyId!).not('project_id', 'is', null),
      ]);
      const projects = projs.data || [];
      return projects.map(p => {
        const ms = (milestones.data || []).filter(m => m.project_id === p.id);
        const rs = (risks.data || []).filter(r => r.project_id === p.id && r.status === 'aberto');
        const ks = (kpis.data || []).filter(k => k.project_id === p.id);
        const sup = (support.data || []).find(s => s.project_id === p.id);
        const invs = (invoices.data || []).filter(i => i.project_id === p.id);
        const msDone = ms.filter(m => m.status === 'concluido').length;
        const msLate = ms.filter(m => m.status !== 'concluido' && m.data_prevista && !m.data_entrega && new Date(m.data_prevista) < new Date()).length;
        const rsAlto = rs.filter(r => r.impacto === 'alto').length;
        const kpiAvg = ks.length ? Math.round(ks.reduce((s, k) => s + (k.valor_alvo ? Math.min(100, ((k.valor_atual || 0) / k.valor_alvo) * 100) : 0), 0) / ks.length) : 0;
        const supPct = sup?.horas_contratadas ? Math.round((Number(sup.horas_consumidas || 0) / Number(sup.horas_contratadas)) * 100) : null;
        const daysToWarranty = sup?.data_fim_garantia ? Math.ceil((new Date(sup.data_fim_garantia).getTime() - Date.now()) / 86400000) : null;
        const invPend = invs.filter(i => i.status !== 'pago').reduce((s, i) => s + Number(i.valor || 0), 0);
        return { ...p, msTotal: ms.length, msDone, msLate, rsOpen: rs.length, rsAlto, kpiAvg, supPct, daysToWarranty, invPend };
      });
    },
  });

  const rows = agg || [];
  const totals = {
    projects: rows.length,
    milestonesLate: rows.reduce((s, r) => s + r.msLate, 0),
    risksHigh: rows.reduce((s, r) => s + r.rsAlto, 0),
    invPending: rows.reduce((s, r) => s + r.invPend, 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><FolderKanban className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Projetos</p><p className="text-xl font-semibold">{totals.projects}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Flag className="h-5 w-5 text-yellow-500" /><div><p className="text-xs text-muted-foreground">Marcos atrasados</p><p className="text-xl font-semibold">{totals.milestonesLate}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /><div><p className="text-xs text-muted-foreground">Riscos altos abertos</p><p className="text-xl font-semibold">{totals.risksHigh}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Faturas pendentes</p><p className="text-lg font-semibold">{fmt(totals.invPending)}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Visão por projeto</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum projeto.</p> : rows.map(r => {
            const msPct = r.msTotal > 0 ? Math.round((r.msDone / r.msTotal) * 100) : 0;
            return (
              <Link key={r.id} to={`/projetos/${r.id}`} className="block">
                <div className="border rounded-lg p-3 hover:bg-accent transition">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <p className="text-sm font-medium">{r.nome}</p>
                    <Badge variant="outline">{r.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1"><Flag className="h-3 w-3" />Marcos: {r.msDone}/{r.msTotal}</span>
                      <Progress value={msPct} className="h-1.5 mt-1" />
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Riscos: {r.rsOpen} {r.rsAlto > 0 && <span className="text-red-500">({r.rsAlto} altos)</span>}</div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />KPIs: {r.kpiAvg}%</span>
                      <Progress value={r.kpiAvg} className="h-1.5 mt-1" />
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1"><LifeBuoy className="h-3 w-3" />
                      {r.supPct !== null ? `Suporte: ${r.supPct}%` : 'Sem suporte'}
                      {r.daysToWarranty !== null && r.daysToWarranty <= 30 && r.daysToWarranty >= 0 && <span className="text-yellow-500 ml-1">• garantia {r.daysToWarranty}d</span>}
                    </div>
                  </div>
                  {r.invPend > 0 && <p className="text-xs text-yellow-500 mt-2">Faturas pendentes: {fmt(r.invPend)}</p>}
                  {r.msLate > 0 && <p className="text-xs text-red-500 mt-1">{r.msLate} marco(s) atrasado(s)</p>}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
