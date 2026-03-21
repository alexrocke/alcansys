import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AppRole = 'admin' | 'gestor' | 'colaborador' | 'financeiro' | 'marketing' | 'vendedor';

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
  { key: "configuracoes", label: "Configurações" },
];

// Full access roles always see everything
const FULL_ACCESS_ROLES: AppRole[] = ['admin', 'gestor', 'financeiro'];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PAGES.map(p => p.key),
  gestor: ALL_PAGES.map(p => p.key),
  financeiro: ALL_PAGES.map(p => p.key),
  marketing: ["dashboard", "marketing", "leads", "automacoes", "conversas", "tarefas"],
  colaborador: ["dashboard", "projetos", "documentos", "tarefas"],
  vendedor: ["dashboard"],
};

export type RolePermissions = Record<string, string[]>;

export function usePermissions() {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  const { data: permissions, isLoading } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async (newPermissions: RolePermissions) => {
      // Always ensure full access roles have all pages
      for (const role of FULL_ACCESS_ROLES) {
        newPermissions[role] = ALL_PAGES.map(p => p.key);
      }

      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('chave', 'role_permissions')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ valor: newPermissions as any })
          .eq('chave', 'role_permissions');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ chave: 'role_permissions', valor: newPermissions as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    },
  });

  const currentPermissions = permissions || DEFAULT_PERMISSIONS;

  const hasPageAccess = (pageKey: string): boolean => {
    if (!userRole) return false;
    if (FULL_ACCESS_ROLES.includes(userRole as AppRole)) return true;
    const rolePages = currentPermissions[userRole] || [];
    return rolePages.includes(pageKey);
  };

  const getAllowedPages = (role: string): string[] => {
    if (FULL_ACCESS_ROLES.includes(role as AppRole)) return ALL_PAGES.map(p => p.key);
    return currentPermissions[role] || DEFAULT_PERMISSIONS[role] || [];
  };

  return {
    permissions: currentPermissions,
    isLoading,
    hasPageAccess,
    getAllowedPages,
    savePermissions: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    FULL_ACCESS_ROLES,
    DEFAULT_PERMISSIONS,
  };
}
