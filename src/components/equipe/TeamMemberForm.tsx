import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

const memberSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  status: z.enum(['ativo', 'pendente', 'inativo']),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface TeamMemberFormProps {
  member: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const availableRoles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'colaborador', label: 'Colaborador' },
];

export function TeamMemberForm({ member, onSuccess, onCancel }: TeamMemberFormProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(member?.roles || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nome: member?.nome || '',
      email: member?.email || '',
      status: member?.status || 'pendente',
    },
  });

  const selectedStatus = watch('status');

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const onSubmit = async (data: MemberFormData) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          email: data.email,
          status: data.status,
        })
        .eq('id', member.id);

      if (profileError) throw profileError;

      // Get current roles
      const { data: currentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', member.id);

      if (rolesError) throw rolesError;

      const currentRoleValues = currentRoles?.map((r) => r.role) || [];

      // Roles to add
      const rolesToAdd = selectedRoles.filter((r) => !currentRoleValues.includes(r as any));
      // Roles to remove
      const rolesToRemove = currentRoleValues.filter((r) => !selectedRoles.includes(r));

      // Add new roles
      if (rolesToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('user_roles')
          .insert(rolesToAdd.map((role) => ({ 
            user_id: member.id, 
            role: role as 'admin' | 'colaborador' | 'financeiro' | 'gestor' | 'marketing'
          })));

        if (addError) throw addError;
      }

      // Remove old roles
      if (rolesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', member.id)
          .in('role', rolesToRemove as any);

        if (removeError) throw removeError;
      }

      toast({
        title: 'Membro atualizado',
        description: 'As informações do membro foram atualizadas com sucesso.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao atualizar o membro.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Nome completo"
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
            disabled
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Permissões (Roles) *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {availableRoles.map((role) => (
            <div key={role.value} className="flex items-center space-x-2">
              <Checkbox
                id={role.value}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => handleRoleToggle(role.value)}
              />
              <label
                htmlFor={role.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {role.label}
              </label>
            </div>
          ))}
        </div>
        {selectedRoles.length === 0 && (
          <p className="text-sm text-orange-500">Selecione pelo menos uma permissão</p>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || selectedRoles.length === 0}>
          {isSubmitting ? 'Salvando...' : 'Atualizar'}
        </Button>
      </div>
    </form>
  );
}
