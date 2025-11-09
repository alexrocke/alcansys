import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function UsuariosSettings() {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-admin'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      return profiles.map((profile) => ({
        ...profile,
        role: profile.user_roles?.[0]?.role || null,
      }));
    },
    enabled: userRole === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Atualizar status do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'ativo' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Adicionar role ao usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      toast({
        title: 'Usuário aprovado',
        description: 'O usuário foi aprovado e pode acessar o sistema.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inativo' })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      toast({
        title: 'Usuário rejeitado',
        description: 'O acesso do usuário foi negado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Deletar role antiga
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Inserir nova role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      toast({
        title: 'Permissão atualizada',
        description: 'A permissão do usuário foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingUsers = users?.filter((u) => u.status === 'pendente') || [];
  const activeUsers = users?.filter((u) => u.status === 'ativo') || [];

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Usuários Pendentes de Aprovação</h3>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedRoles[user.id] || ""}
                    onValueChange={(value) =>
                      setSelectedRoles({ ...selectedRoles, [user.id]: value })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selecione a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() =>
                      selectedRoles[user.id] &&
                      approveMutation.mutate({
                        userId: user.id,
                        role: selectedRoles[user.id],
                      })
                    }
                    disabled={
                      !selectedRoles[user.id] ||
                      approveMutation.isPending ||
                      rejectMutation.isPending
                    }
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(user.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Usuários Ativos</h3>
        <div className="space-y-3">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{user.nome}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={user.role || ""}
                  onValueChange={(value) =>
                    updateRoleMutation.mutate({ userId: user.id, role: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      {user.role ? (
                        <Badge variant="secondary">{user.role}</Badge>
                      ) : (
                        "Sem role"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="membro">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
