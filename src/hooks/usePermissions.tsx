import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = 'admin' | 'gestor' | 'colaborador' | 'usuario' | 'financeiro' | 'marketing' | 'vendedor';

export interface PagePermission {
  key: string;
  label: string;
}

export const ALL_PAGES: PagePermission[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projetos", label: "Projetos" },
  { key: "tarefas", label: "Tarefas" },
  { key: "financeiro", label: "Financeiro" },
  { key: "leads", label: "Leads & CRM" },
  { key: "conversas", label: "Conversas" },
  { key: "marketing", label: "Marketing" },
  { key: "automacoes", label: "Automações" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "clientes", label: "Clientes" },
  { key: "documentos", label: "Documentos" },
  { key: "vendedores", label: "Vendedores" },
  { key: "equipe", label: "Equipe" },
  { key: "cofre", label: "Cofre Interno" },
  { key: "configuracoes", label: "Configurações" },
];

const FULL_ACCESS_ROLES: AppRole[] = ['admin', 'gestor', 'financeiro'];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PAGES.map(p => p.key),
  gestor: ALL_PAGES.map(p => p.key),
  financeiro: ALL_PAGES.map(p => p.key),
  marketing: ["dashboard", "marketing", "leads", "automacoes", "conversas", "tarefas"],
  colaborador: ["dashboard", "projetos", "documentos", "tarefas", "cofre"],
  usuario: ["dashboard", "projetos", "documentos", "tarefas", "cofre"],
  vendedor: ["dashboard"],
};

export type RolePermissions = Record<string, string[]>;
// user_id -> allowed pages (null means "use role default")
export type UserPermissions = Record<string, string[] | null>;

export function usePermissions() {
  const queryClient = useQueryClient();
  const { userRole, user } = useAuth();

  const { data: rolePermissions, isLoading: roleLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('valor')
        .eq('chave', 'role_permissions')
        .maybeSingle();
      if (error) throw error;
      if (data?.valor) return data.valor as unknown as RolePermissions;
      return DEFAULT_PERMISSIONS;
    },
  });

  const { data: userPermissions, isLoading: userLoading } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('valor')
        .eq('chave', 'user_permissions')
        .maybeSingle();
      if (error) throw error;
      if (data?.valor) return data.valor as unknown as UserPermissions;
      return {} as UserPermissions;
    },
  });

  const saveRolePermissions = useMutation({
    mutationFn: async (newPermissions: RolePermissions) => {
      for (const role of FULL_ACCESS_ROLES) {
        newPermissions[role] = ALL_PAGES.map(p => p.key);
      }
      const { data: existing } = await supabase
        .from('settings').select('id').eq('chave', 'role_permissions').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('settings')
          .update({ valor: newPermissions as any }).eq('chave', 'role_permissions');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings')
          .insert({ chave: 'role_permissions', valor: newPermissions as any });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-permissions'] }),
  });

  const saveUserPermissions = useMutation({
    mutationFn: async (newPerms: UserPermissions) => {
      const { data: existing } = await supabase
        .from('settings').select('id').eq('chave', 'user_permissions').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('settings')
          .update({ valor: newPerms as any }).eq('chave', 'user_permissions');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings')
          .insert({ chave: 'user_permissions', valor: newPerms as any });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-permissions'] }),
  });

  const currentRolePerms = rolePermissions || DEFAULT_PERMISSIONS;
  const currentUserPerms = userPermissions || {};

  const hasPageAccess = (pageKey: string): boolean => {
    if (!userRole || !user) return false;
    // Admin always has full access (cannot be overridden)
    if (userRole === 'admin') return true;
    // Check user-specific override first
    const userOverride = currentUserPerms[user.id];
    if (userOverride !== null && userOverride !== undefined) {
      return userOverride.includes(pageKey);
    }
    // Fall back to role permissions
    if (FULL_ACCESS_ROLES.includes(userRole as AppRole)) return true;
    const rolePages = currentRolePerms[userRole] || DEFAULT_PERMISSIONS[userRole] || [];
    return rolePages.includes(pageKey);
  };

  const getUserPages = (userId: string): string[] | null => {
    return currentUserPerms[userId] ?? null;
  };

  return {
    permissions: currentRolePerms,
    userPermissions: currentUserPerms,
    isLoading: roleLoading || userLoading,
    hasPageAccess,
    getUserPages,
    saveRolePermissions: saveRolePermissions.mutate,
    saveUserPermissions: saveUserPermissions.mutate,
    isSaving: saveRolePermissions.isPending || saveUserPermissions.isPending,
    FULL_ACCESS_ROLES,
    DEFAULT_PERMISSIONS,
  };
}
