import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, ALL_PAGES, RolePermissions, UserPermissions } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, ShieldCheck, UserCog, RotateCcw, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const CONFIGURABLE_ROLES = [
  { value: "marketing", label: "Marketing" },
  { value: "colaborador", label: "Colaborador" },
];

const FULL_ACCESS_DISPLAY = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "financeiro", label: "Financeiro" },
];

const PROTECTED_EMAIL = "alexrockefragasb@gmail.com";

export function PermissoesSettings() {
  const {
    permissions, userPermissions, isLoading,
    saveRolePermissions, saveUserPermissions, isSaving,
  } = usePermissions();

  const [localRolePerms, setLocalRolePerms] = useState<RolePermissions>({});
  const [localUserPerms, setLocalUserPerms] = useState<UserPermissions>({});
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch active users for the per-user section
  const { data: users } = useQuery({
    queryKey: ['users-for-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, user_roles(role)')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data.map((p) => ({
        ...p,
        role: (p.user_roles as any)?.[0]?.role || null,
      }));
    },
  });

  useEffect(() => {
    if (permissions) setLocalRolePerms({ ...permissions });
  }, [permissions]);

  useEffect(() => {
    if (userPermissions) setLocalUserPerms({ ...userPermissions });
  }, [userPermissions]);

  const toggleRolePage = (role: string, pageKey: string) => {
    setLocalRolePerms((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(pageKey)
        ? current.filter((k) => k !== pageKey)
        : [...current, pageKey];
      return { ...prev, [role]: updated };
    });
  };

  const toggleUserPage = (userId: string, pageKey: string) => {
    setLocalUserPerms((prev) => {
      const current = prev[userId] || getAllPagesForUserRole(userId);
      const updated = current.includes(pageKey)
        ? current.filter((k) => k !== pageKey)
        : [...current, pageKey];
      return { ...prev, [userId]: updated };
    });
  };

  const getAllPagesForUserRole = (userId: string): string[] => {
    const u = users?.find((u) => u.id === userId);
    if (!u?.role) return [];
    return localRolePerms[u.role] || permissions?.[u.role] || [];
  };

  const resetUserToDefault = (userId: string) => {
    setLocalUserPerms((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleSaveRoles = () => {
    saveRolePermissions(localRolePerms, {
      onSuccess: () => toast({ title: "Permissões por função salvas" }),
      onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  };

  const handleSaveUsers = () => {
    saveUserPermissions(localUserPerms, {
      onSuccess: () => toast({ title: "Permissões por usuário salvas" }),
      onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  };

  const selectedUser = users?.find((u) => u.id === selectedUserId);
  const selectedUserPages = selectedUserId
    ? (localUserPerms[selectedUserId] ?? null)
    : null;
  const isProtected = selectedUser?.email === PROTECTED_EMAIL;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Full access info */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-sm">Acesso Total</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Admin, Gestor e Financeiro possuem acesso completo por padrão. Use as permissões por usuário abaixo para restringir individualmente.
        </p>
        <div className="flex gap-2">
          {FULL_ACCESS_DISPLAY.map((r) => (
            <Badge key={r.value} variant="secondary">{r.label}</Badge>
          ))}
        </div>
      </div>

      {/* Role permissions */}
      <div className="space-y-4">
        <h4 className="font-semibold">Permissões por Função</h4>
        <p className="text-sm text-muted-foreground">
          Defina o acesso padrão para Marketing e Colaborador. Vendedores possuem portal próprio.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Página</th>
                {CONFIGURABLE_ROLES.map((role) => (
                  <th key={role.value} className="text-center py-3 px-4 font-medium">{role.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.filter(p => p.key !== "configuracoes").map((page) => (
                <tr key={page.key} className="border-b last:border-0">
                  <td className="py-3 pr-4">{page.label}</td>
                  {CONFIGURABLE_ROLES.map((role) => (
                    <td key={role.value} className="text-center py-3 px-4">
                      <Checkbox
                        checked={(localRolePerms[role.value] || []).includes(page.key)}
                        onCheckedChange={() => toggleRolePage(role.value, page.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveRoles} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Funções
          </Button>
        </div>
      </div>

      <Separator />

      {/* Per-user permissions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">Permissões por Usuário</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Sobrescreva as permissões da função para um usuário específico. Por exemplo, um Gestor que não deve acessar o Financeiro.
        </p>

        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {users?.filter(u => u.email !== PROTECTED_EMAIL).map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome} — <span className="text-muted-foreground">{u.role || 'sem função'}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedUserId && selectedUser && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedUser.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email} — Função: <Badge variant="outline">{selectedUser.role || 'N/A'}</Badge>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedUserPages !== null && (
                  <Button variant="outline" size="sm" onClick={() => resetUserToDefault(selectedUserId)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Usar padrão da função
                  </Button>
                )}
              </div>
            </div>

            {selectedUserPages === null && (
              <p className="text-sm text-muted-foreground italic">
                Este usuário usa as permissões padrão da função ({selectedUser.role}). Marque/desmarque abaixo para criar uma configuração personalizada.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Página</th>
                    <th className="text-center py-2 px-4 font-medium">Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_PAGES.filter(p => p.key !== "configuracoes").map((page) => {
                    const effectivePages = selectedUserPages ?? getAllPagesForUserRole(selectedUserId);
                    const checked = effectivePages.includes(page.key);
                    return (
                      <tr key={page.key} className="border-b last:border-0">
                        <td className="py-2 pr-4">{page.label}</td>
                        <td className="text-center py-2 px-4">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              if (selectedUserPages === null) {
                                // Initialize with role defaults then toggle
                                const defaults = getAllPagesForUserRole(selectedUserId);
                                const updated = checked
                                  ? defaults.filter(k => k !== page.key)
                                  : [...defaults, page.key];
                                setLocalUserPerms(prev => ({ ...prev, [selectedUserId]: updated }));
                              } else {
                                toggleUserPage(selectedUserId, page.key);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveUsers} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Permissões do Usuário
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
