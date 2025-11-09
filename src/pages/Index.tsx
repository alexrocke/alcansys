import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FolderKanban, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao Alcansys</p>
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
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum projeto cadastrado
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
            <div className="text-3xl font-bold text-foreground">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma receita registrada
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Operacional
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">R$ 0,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhum custo registrado
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
            <div className="text-3xl font-bold text-foreground">0%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem dados suficientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Receita x Custo</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico será exibido aqui</p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Distribuição por Área</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico será exibido aqui</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
