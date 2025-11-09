import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Target, DollarSign, Building2 } from "lucide-react";
import { AreasSettings } from "@/components/configuracoes/AreasSettings";
import { MetasSettings } from "@/components/configuracoes/MetasSettings";
import { CustosFixosSettings } from "@/components/configuracoes/CustosFixosSettings";
import { UsuariosSettings } from "@/components/configuracoes/UsuariosSettings";
import { GeralSettings } from "@/components/configuracoes/GeralSettings";

export default function Configuracoes() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Áreas
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Custos Fixos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as preferências gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeralSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle>Áreas e Departamentos</CardTitle>
              <CardDescription>
                Gerencie as áreas de atuação da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AreasSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas">
          <Card>
            <CardHeader>
              <CardTitle>Metas Mensais</CardTitle>
              <CardDescription>
                Defina metas para projetos, receitas e clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetasSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos">
          <Card>
            <CardHeader>
              <CardTitle>Custos Fixos</CardTitle>
              <CardDescription>
                Configure os custos fixos mensais da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustosFixosSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Usuários e Permissões</CardTitle>
              <CardDescription>
                Aprove usuários e gerencie permissões de acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsuariosSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
