import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Target, FolderKanban, DollarSign, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface GoalsProgressProps {
  companyId: string;
}

export function GoalsProgress({ companyId }: GoalsProgressProps) {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: goals } = useQuery({
    queryKey: ["company-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("valor")
        .eq("chave", "metas_mensais")
        .maybeSingle();
      if (error) throw error;
      return (data?.valor as any) || { metaProjetos: 0, metaReceita: 0, metaClientes: 0 };
    },
  });

  const { data: newProjectsCount } = useQuery({
    queryKey: ["goals-projects", companyId, format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ["goals-revenue", companyId, format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finances")
        .select("valor")
        .eq("company_id", companyId)
        .eq("tipo", "receita")
        .gte("data", format(monthStart, "yyyy-MM-dd"))
        .lte("data", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data?.reduce((sum, f) => sum + Number(f.valor), 0) || 0;
    },
    enabled: !!companyId,
  });

  const { data: newClientsCount } = useQuery({
    queryKey: ["goals-clients", companyId, format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Salespeople with their individual goals
  const { data: salespeople } = useQuery({
    queryKey: ["goals-salespeople", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id, nome, meta_mensal")
        .eq("company_id", companyId)
        .eq("status", "ativo");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: commissions } = useQuery({
    queryKey: ["goals-commissions", companyId, format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("salesperson_id, valor_venda")
        .eq("company_id", companyId)
        .gte("data_venda", format(monthStart, "yyyy-MM-dd"))
        .lte("data_venda", format(monthEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const metaProjetos = goals?.metaProjetos || 0;
  const metaReceita = goals?.metaReceita || 0;
  const metaClientes = goals?.metaClientes || 0;

  const projProgress = metaProjetos > 0 ? Math.min(((newProjectsCount || 0) / metaProjetos) * 100, 100) : 0;
  const revProgress = metaReceita > 0 ? Math.min(((monthlyRevenue || 0) / metaReceita) * 100, 100) : 0;
  const cliProgress = metaClientes > 0 ? Math.min(((newClientsCount || 0) / metaClientes) * 100, 100) : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Build salesperson chart data
  const salespersonData = salespeople?.map((sp) => {
    const totalVendas = commissions
      ?.filter((c) => c.salesperson_id === sp.id)
      .reduce((sum, c) => sum + Number(c.valor_venda), 0) || 0;
    const meta = Number(sp.meta_mensal) || 0;
    const percent = meta > 0 ? Math.round((totalVendas / meta) * 100) : 0;
    return {
      nome: sp.nome.split(" ")[0],
      vendas: totalVendas,
      meta,
      percent,
    };
  }) || [];

  const hasGoals = metaProjetos > 0 || metaReceita > 0 || metaClientes > 0;

  return (
    <div className="space-y-4">
      {/* Company Goals */}
      <Card className="border-2 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas da Empresa — {format(currentDate, "MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasGoals ? (
            <p className="text-muted-foreground text-sm">Configure metas em Configurações → Metas</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {metaProjetos > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FolderKanban className="h-4 w-4" /> Projetos
                    </span>
                    <span className="font-bold text-foreground">{newProjectsCount || 0}/{metaProjetos}</span>
                  </div>
                  <Progress value={projProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">{projProgress.toFixed(0)}%</p>
                </div>
              )}
              {metaReceita > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="h-4 w-4" /> Receita
                    </span>
                    <span className="font-bold text-foreground">{formatCurrency(monthlyRevenue || 0)}</span>
                  </div>
                  <Progress value={revProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">{revProgress.toFixed(0)}% de {formatCurrency(metaReceita)}</p>
                </div>
              )}
              {metaClientes > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" /> Novos Clientes
                    </span>
                    <span className="font-bold text-foreground">{newClientsCount || 0}/{metaClientes}</span>
                  </div>
                  <Progress value={cliProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">{cliProgress.toFixed(0)}%</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salesperson Goals */}
      {salespersonData.length > 0 && (
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Metas Individuais — Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full overflow-hidden">
              <ChartContainer
                config={{
                  vendas: { label: "Vendas", color: "hsl(var(--primary))" },
                  meta: { label: "Meta", color: "hsl(var(--muted-foreground))" },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salespersonData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="nome" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm">
                            <p className="font-semibold text-foreground">{d.nome}</p>
                            <p className="text-muted-foreground">Vendas: {formatCurrency(d.vendas)}</p>
                            <p className="text-muted-foreground">Meta: {formatCurrency(d.meta)}</p>
                            <p className={`font-bold ${d.percent >= 100 ? 'text-green-600' : d.percent >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {d.percent}% da meta
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="meta" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Meta" />
                    <Bar dataKey="vendas" radius={[4, 4, 0, 0]} name="Vendas">
                      {salespersonData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.percent >= 100 ? 'hsl(142, 76%, 36%)' : entry.percent >= 70 ? 'hsl(48, 96%, 53%)' : 'hsl(var(--destructive))'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
