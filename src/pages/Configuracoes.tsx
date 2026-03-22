import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Target, Building2, Globe, ShieldCheck, ArrowRightLeft, BarChart3 } from "lucide-react";
import { AreasSettings } from "@/components/configuracoes/AreasSettings";
import { MetasSettings } from "@/components/configuracoes/MetasSettings";
import { UsuariosSettings } from "@/components/configuracoes/UsuariosSettings";
import { GeralSettings } from "@/components/configuracoes/GeralSettings";
import { LandingSettings } from "@/components/configuracoes/LandingSettings";
import { PermissoesSettings } from "@/components/configuracoes/PermissoesSettings";
import { IntegracoesSettings } from "@/components/configuracoes/IntegracoesSettings";
import { MarketingIntegracoesSettings } from "@/components/configuracoes/MarketingIntegracoesSettings";

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
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Segmentos
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="marketing-integracoes" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Google & Meta
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Landing Page
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
              <CardTitle>Segmentos de Mercado</CardTitle>
              <CardDescription>
                Gerencie os segmentos de mercado dos seus clientes (ex: Varejo, Atacado, etc.)
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

        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle>Permissões de Acesso</CardTitle>
              <CardDescription>
                Configure permissões por função e por usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissoesSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardHeader>
              <CardTitle>Integrações & Webhook Relay</CardTitle>
              <CardDescription>
                Configure integrações com sistemas externos. As mensagens do WhatsApp serão encaminhadas automaticamente para os endpoints configurados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegracoesSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing">
          <Card>
            <CardHeader>
              <CardTitle>Landing Page</CardTitle>
              <CardDescription>
                Edite textos, cards de serviço, métricas e seções da página inicial pública
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LandingSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
