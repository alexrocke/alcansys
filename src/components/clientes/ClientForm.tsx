import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';

const clientSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  telefone: z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal('')),
  area: z.string().min(1, 'Área é obrigatória'),
  plano: z.string().optional().or(z.literal('')),
  status: z.enum(['ativo', 'inativo']),
  email_portal: z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

function generatePortalEmail(nome: string): string {
  if (!nome.trim()) return '';
  const slug = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.');
  return slug ? `${slug}@portal.alcansys.com` : '';
}

interface ClientFormProps {
  client?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const { currentCompany } = useCompany();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: client?.nome || '',
      email: client?.email || '',
      telefone: client?.telefone || '',
      area: client?.area || '',
      plano: client?.plano || '',
      status: client?.status || 'ativo',
      email_portal: client?.email_portal || '',
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('chave', 'areas')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const areas = (settings?.valor as any as string[]) || [];
  const selectedArea = watch('area');
  const selectedStatus = watch('status');
  const watchedNome = watch('nome');
  

  // Auto-generate portal email from client name (only when creating new client or field is empty/auto-generated)
  useEffect(() => {
    if (client) return; // Don't auto-generate when editing
    const generated = generatePortalEmail(watchedNome);
    setValue('email_portal', generated);
  }, [watchedNome, client, setValue]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        area: data.area,
        plano: data.plano || null,
        status: data.status,
        email_portal: data.email_portal || null,
        company_id: currentCompany?.id || null,
      };

      if (client) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);

        if (error) throw error;

        toast({
          title: 'Cliente atualizado',
          description: 'As informações do cliente foram atualizadas com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;

        toast({
          title: 'Cliente cadastrado',
          description: 'O novo cliente foi cadastrado com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o cliente.',
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
            placeholder="Nome do cliente"
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...register('telefone')}
            placeholder="(00) 00000-0000"
          />
          {errors.telefone && (
            <p className="text-sm text-red-500">{errors.telefone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">Segmento *</Label>
          <Select
            value={selectedArea}
            onValueChange={(value) => setValue('area', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent>
              {areas.length === 0 ? (
                <SelectItem value="sem-areas" disabled>
                  Nenhum segmento cadastrado
                </SelectItem>
              ) : (
                areas.map((area: string) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.area && (
            <p className="text-sm text-red-500">{errors.area.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plano">Plano</Label>
          <Input
            id="plano"
            {...register('plano')}
            placeholder="Ex: Básico, Premium, Enterprise"
          />
          {errors.plano && (
            <p className="text-sm text-red-500">{errors.plano.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setValue('status', value as 'ativo' | 'inativo')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email_portal">Email do Portal</Label>
          <Input
            id="email_portal"
            type="email"
            {...register('email_portal')}
            placeholder="email-acesso@cliente.com"
          />
          <p className="text-xs text-muted-foreground">
            Este email será usado para o cliente acessar o Portal do Cliente com informações exclusivas da empresa dele.
          </p>
          {errors.email_portal && (
            <p className="text-sm text-red-500">{errors.email_portal.message}</p>
          )}
        </div>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : client ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
