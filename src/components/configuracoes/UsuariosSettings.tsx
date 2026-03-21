import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const PROTECTED_EMAIL = "alexrockefragasb@gmail.com";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "financeiro", label: "Financeiro" },
  { value: "marketing", label: "Marketing" },
  { value: "colaborador", label: "Colaborador" },
  { value: "vendedor", label: "Vendedor" },
];

export function UsuariosSettings() {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNome, setInviteNome] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");

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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'ativo' })
        .eq('id', userId);
      if (updateError) throw updateError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      toast({ title: 'Usuário aprovado', description: 'O usuário foi aprovado e pode acessar o sistema.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Usuário rejeitado', description: 'O acesso do usuário foi negado.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao rejeitar', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      toast({ title: 'Permissão atualizada', description: 'A permissão do usuário foi atualizada com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-member', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      setDeleteTarget(null);
      toast({ title: 'Usuário removido', description: 'O usuário foi excluído do sistema.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('invite-member', {
        body: { email: inviteEmail, nome: inviteNome, roles: [inviteRole] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-admin'] });
      setInviteOpen(false);
      setInviteNome("");
      setInviteEmail("");
      setInviteRole("");
      toast({ title: 'Usuário convidado', description: 'O novo usuário foi criado com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao convidar', description: error.message, variant: 'destructive' });
    },
  });

  if (userRole !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
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
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Crie um login para um novo membro da equipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={inviteNome}
                  onChange={(e) => setInviteNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissão</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteNome || !inviteEmail || !inviteRole || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Usuários Pendentes de Aprovação</h3>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedRoles[user.id] || ""}
                    onValueChange={(value) => setSelectedRoles({ ...selectedRoles, [user.id]: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selecione a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => selectedRoles[user.id] && approveMutation.mutate({ userId: user.id, role: selectedRoles[user.id] })}
                    disabled={!selectedRoles[user.id] || approveMutation.isPending || rejectMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate(user.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
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
          {activeUsers.map((user) => {
            const isProtected = user.email === PROTECTED_EMAIL;
            return (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={user.role || ""}
                    onValueChange={(value) => updateRoleMutation.mutate({ userId: user.id, role: value })}
                    disabled={isProtected}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue>
                        {user.role ? <Badge variant="secondary">{user.role}</Badge> : "Sem role"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isProtected && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong> ({deleteTarget?.email})? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
