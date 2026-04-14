import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, AppWindow } from "lucide-react";
import { CredentialsManager } from "@/components/cofre/CredentialsManager";
import { ContractedAppsManager } from "@/components/cofre/ContractedAppsManager";
import { useAuth } from "@/hooks/useAuth";

export default function CofreInterno() {
  const [tab, setTab] = useState("credenciais");
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cofre Interno</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isAdmin
            ? "Gerencie credenciais, logins e aplicativos contratados com segurança"
            : "Visualize as credenciais liberadas para você"}
        </p>
      </div>

      {isAdmin ? (
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="credenciais" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Credenciais & Logins
            </TabsTrigger>
            <TabsTrigger value="aplicativos" className="flex items-center gap-2">
              <AppWindow className="h-4 w-4" />
              Aplicativos Contratados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credenciais">
            <CredentialsManager />
          </TabsContent>
          <TabsContent value="aplicativos">
            <ContractedAppsManager />
          </TabsContent>
        </Tabs>
      ) : (
        <CredentialsManager />
      )}
    </div>
  );
}
