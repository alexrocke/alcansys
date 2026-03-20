import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const availableRoles = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'gestor', label: 'Gestor', description: 'Projetos, CRM, Clientes' },
  { value: 'financeiro', label: 'Financeiro', description: 'Financeiro e relatórios' },
  { value: 'marketing', label: 'Marketing', description: 'Campanhas e leads' },
  { value: 'colaborador', label: 'Colaborador', description: 'Projetos e documentos' },
  { value: 'vendedor', label: 'Vendedor', description: 'Portal de vendas' },
];

interface InviteMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteMemberForm({ onSuccess, onCancel }: InviteMemberFormProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const onSubmit = async (data: InviteFormData) => {
    if (selectedRoles.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('invite-member', {
        body: {
          email: data.email,
          nome: data.nome,
          roles: selectedRoles,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success('Membro convidado com sucesso!', {
        description: `${data.nome} foi adicionado à equipe.`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Invite error:', error);
      toast.error('Erro ao convidar membro', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-nome">Nome *</Label>
          <Input
            id="invite-nome"
            {...register('nome')}
            placeholder="Nome completo"
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-email">Email *</Label>
          <Input
            id="invite-email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Permissões *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {availableRoles.map((role) => (
            <div
              key={role.value}
              className="flex items-start space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleRoleToggle(role.value)}
            >
              <Checkbox
                id={`invite-${role.value}`}
                checked={selectedRoles.includes(role.value)}
                onCheckedChange={() => handleRoleToggle(role.value)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor={`invite-${role.value}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {role.label}
                </label>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
            </div>
          ))}
        </div>
        {selectedRoles.length === 0 && (
          <p className="text-sm text-muted-foreground">Selecione pelo menos uma permissão</p>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || selectedRoles.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Convidando...
            </>
          ) : (
            'Convidar Membro'
          )}
        </Button>
      </div>
    </form>
  );
}
