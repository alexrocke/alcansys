import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FolderKanban, Target, Users, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCompany } from "@/hooks/useCompany";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";

const Index = () => {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["dashboard-projects", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .in("status", ["em_andamento", "planejamento"]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch finances for current month
  const { data: finances } = useQuery({
    queryKey: ["dashboard-finances", companyId, format(monthStart, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("finances")
        .select("*")
        .eq("company_id", companyId)
        .gte("data", format(monthStart, "yyyy-MM-dd"))
        .lte("data", format(monthEnd, "yyyy-MM-dd"))
        .order("data", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["dashboard-clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "ativo");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch marketing campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["dashboard-campaigns", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "ativa");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch automations
  const { data: automations } = useQuery({
    queryKey: ["dashboard-automations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Calculate metrics
  const activeProjects = projects?.length || 0;
  const activeClients = clients?.length || 0;
  const activeCampaigns = campaigns?.length || 0;

  const monthlyRevenue = finances
    ?.filter((f) => f.tipo === "receita")
    .reduce((sum, f) => sum + Number(f.valor), 0) || 0;

  const monthlyExpenses = finances
    ?.filter((f) => f.tipo === "despesa")
    .reduce((sum, f) => sum + Number(f.valor), 0) || 0;

  // Calculate average ROI from campaigns and automations
  const campaignROIs = campaigns?.filter(c => c.roi != null).map(c => Number(c.roi)) || [];
  const automationROIs = automations?.map(a => {
    const custo = Number(a.custo) || 0;
    const retorno = Number(a.retorno) || 0;
    return custo > 0 ? ((retorno - custo) / custo) * 100 : 0;
  }).filter(roi => roi > 0) || [];
  
  const allROIs = [...campaignROIs, ...automationROIs];
  const averageROI = allROIs.length > 0 
    ? allROIs.reduce((sum, roi) => sum + roi, 0) / allROIs.length 
    : 0;

  // Prepare line chart data (daily revenue vs expenses)
  const lineChartData = finances?.reduce((acc: any[], finance) => {
    const dateStr = format(new Date(finance.data), "dd/MM");
    const existing = acc.find(item => item.date === dateStr);
    
    if (existing) {
      if (finance.tipo === "receita") {
        existing.receita += Number(finance.valor);
      } else {
        existing.despesa += Number(finance.valor);
      }
    } else {
      acc.push({
        date: dateStr,
        receita: finance.tipo === "receita" ? Number(finance.valor) : 0,
        despesa: finance.tipo === "despesa" ? Number(finance.valor) : 0,
      });
    }
    return acc;
  }, []) || [];

  // Prepare pie chart data (distribution by area)
  const pieChartData = finances?.reduce((acc: any[], finance) => {
    if (!finance.area) return acc;
    
    const existing = acc.find(item => item.name === finance.area);
    if (existing) {
      existing.value += Number(finance.valor);
    } else {
      acc.push({
        name: finance.area,
        value: Number(finance.valor),
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value) || [];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "#8b5cf6", "#ec4899"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-sm font-semibold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao Scalefy</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos Ativos
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeProjects === 0 ? "Nenhum projeto ativo" : "Em andamento ou planejamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas: {formatCurrency(monthlyExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Mensal
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${monthlyRevenue - monthlyExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(monthlyRevenue - monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyRevenue - monthlyExpenses >= 0 ? "Lucro positivo" : "Prejuízo"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI Médio
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{averageROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {allROIs.length === 0 ? "Sem dados suficientes" : "Campanhas e automações"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeClients === 0 ? "Nenhum cliente ativo" : "Total de clientes"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campanhas Ativas
            </CardTitle>
            <Megaphone className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCampaigns === 0 ? "Nenhuma campanha ativa" : "Em andamento"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automações
            </CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{automations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {automations?.filter(a => a.status === "ativa").length || 0} ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company & Salesperson Goals */}
      {companyId && <GoalsProgress companyId={companyId} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Receita x Despesa (Mês Atual)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {lineChartData.length > 0 ? (
              <ChartContainer
                config={{
                  receita: {
                    label: "Receita",
                    color: "hsl(var(--primary))",
                  },
                  despesa: {
                    label: "Despesa",
                    color: "hsl(var(--destructive))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `R$ ${value}`} />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="despesa" stroke="hsl(var(--destructive))" strokeWidth={2} name="Despesa" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados financeiros neste mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Distribuição por Área</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {pieChartData.length > 0 ? (
              <ChartContainer
                config={pieChartData.reduce((acc, item, index) => {
                  acc[item.name] = {
                    label: item.name,
                    color: COLORS[index % COLORS.length],
                  };
                  return acc;
                }, {} as any)}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                              <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados de área disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
