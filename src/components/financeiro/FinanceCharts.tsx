import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceChartsProps {
  finances: any[];
}

const COLORS = ['#3B82F6', '#1E3A8A', '#60A5FA', '#93C5FD', '#DBEAFE'];

export function FinanceCharts({ finances }: FinanceChartsProps) {
  // Preparar dados para gráfico de linha (Receita x Custo por dia)
  const lineData = finances.reduce((acc: any[], finance) => {
    const date = format(new Date(finance.data), 'dd/MM');
    const existing = acc.find(item => item.data === date);
    
    if (existing) {
      if (finance.tipo === 'receita') {
        existing.receita += Number(finance.valor);
      } else {
        existing.despesa += Number(finance.valor);
      }
    } else {
      acc.push({
        data: date,
        receita: finance.tipo === 'receita' ? Number(finance.valor) : 0,
        despesa: finance.tipo === 'despesa' ? Number(finance.valor) : 0,
      });
    }
    
    return acc;
  }, []).sort((a, b) => {
    const [dayA, monthA] = a.data.split('/').map(Number);
    const [dayB, monthB] = b.data.split('/').map(Number);
    return monthA - monthB || dayA - dayB;
  });

  // Preparar dados para gráfico de pizza (Distribuição por área)
  const areaData = finances
    .filter(f => f.area)
    .reduce((acc: any[], finance) => {
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
    }, [])
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.data}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-2 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Receitas x Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  className="text-xs"
                  stroke="currentColor"
                />
                <YAxis 
                  className="text-xs"
                  stroke="currentColor"
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Receita"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  name="Despesa"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Distribuição por Área</CardTitle>
        </CardHeader>
        <CardContent>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={areaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para exibir
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
