import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, UserCheck, UserX, Shield, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamMemberForm } from '@/components/equipe/TeamMemberForm';
import { InviteMemberForm } from '@/components/equipe/InviteMemberForm';
import { TeamMemberList } from '@/components/equipe/TeamMemberList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Equipe() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles, refetch: refetchRoles } = useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleSuccess = () => {
    refetch();
    refetchRoles();
    handleCloseForm();
  };

  const handleInviteSuccess = () => {
    refetch();
    refetchRoles();
    setIsInviteOpen(false);
  };

  // Create a map of user_id to roles
  const rolesMap = new Map<string, string[]>();
  userRoles?.forEach((ur) => {
    if (!rolesMap.has(ur.user_id)) {
      rolesMap.set(ur.user_id, []);
    }
    rolesMap.get(ur.user_id)?.push(ur.role);
  });

  // Enrich profiles with roles
  const enrichedProfiles = profiles?.map((profile) => ({
    ...profile,
    roles: rolesMap.get(profile.id) || [],
  }));

  const filteredMembers = enrichedProfiles?.filter((member) => {
    const matchesSearch = 
      member.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalMembers = profiles?.length || 0;
  const activeMembers = profiles?.filter(p => p.status === 'ativo').length || 0;
  const pendingMembers = profiles?.filter(p => p.status === 'pendente').length || 0;
  const adminMembers = enrichedProfiles?.filter(p => p.roles.includes('admin')).length || 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Equipe</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie membros da equipe e suas permissões
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Membros
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {totalMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Membros cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membros Ativos
            </CardTitle>
            <UserCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-500">
              {activeMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Com acesso ao sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Aprovação
            </CardTitle>
            <UserX className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-orange-500">
              {pendingMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendentes de aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
            <Shield className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {adminMembers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Com privilégios admin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="colaborador">Colaborador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TeamMemberList
        members={filteredMembers || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefetch={refetch}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Membro da Equipe</DialogTitle>
          </DialogHeader>
          <TeamMemberForm
            member={editingMember}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
          </DialogHeader>
          <InviteMemberForm
            onSuccess={handleInviteSuccess}
            onCancel={() => setIsInviteOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
