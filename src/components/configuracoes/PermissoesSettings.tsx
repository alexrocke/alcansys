import { useState, useEffect } from "react";
import { usePermissions, ALL_PAGES, RolePermissions } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, ShieldCheck } from "lucide-react";

const CONFIGURABLE_ROLES = [
  { value: "marketing", label: "Marketing" },
  { value: "colaborador", label: "Colaborador" },
];

const FULL_ACCESS_DISPLAY = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "financeiro", label: "Financeiro" },
];

export function PermissoesSettings() {
  const { permissions, isLoading, savePermissions, isSaving, FULL_ACCESS_ROLES } = usePermissions();
  const [localPerms, setLocalPerms] = useState<RolePermissions>({});

  useEffect(() => {
    if (permissions) setLocalPerms({ ...permissions });
  }, [permissions]);

  const togglePage = (role: string, pageKey: string) => {
    setLocalPerms((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(pageKey)
        ? current.filter((k) => k !== pageKey)
        : [...current, pageKey];
      return { ...prev, [role]: updated };
    });
  };

  const handleSave = () => {
    savePermissions(localPerms, {
      onSuccess: () => {
        toast({ title: "Permissões salvas", description: "As permissões foram atualizadas com sucesso." });
      },
      onError: (error) => {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Full access roles info */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-sm">Acesso Total</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          As seguintes funções possuem acesso completo a todas as páginas e não podem ser restringidas:
        </p>
        <div className="flex gap-2">
          {FULL_ACCESS_DISPLAY.map((r) => (
            <Badge key={r.value} variant="secondary">{r.label}</Badge>
          ))}
        </div>
      </div>

      {/* Configurable roles */}
      <div className="space-y-6">
        <h4 className="font-semibold">Permissões por Função</h4>
        <p className="text-sm text-muted-foreground">
          Configure quais páginas cada função pode acessar. Vendedores possuem portal próprio.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Página</th>
                {CONFIGURABLE_ROLES.map((role) => (
                  <th key={role.value} className="text-center py-3 px-4 font-medium">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.filter(p => p.key !== "configuracoes").map((page) => (
                <tr key={page.key} className="border-b last:border-0">
                  <td className="py-3 pr-4">{page.label}</td>
                  {CONFIGURABLE_ROLES.map((role) => {
                    const checked = (localPerms[role.value] || []).includes(page.key);
                    return (
                      <td key={role.value} className="text-center py-3 px-4">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePage(role.value, page.key)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Permissões
        </Button>
      </div>
    </div>
  );
}
