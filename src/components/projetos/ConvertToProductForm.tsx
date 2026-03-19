import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/useCompany';
import { Loader2 } from 'lucide-react';

const productSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  preco: z.string().optional(),
  categoria: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ConvertToProductFormProps {
  project: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ConvertToProductForm({ project, onSuccess, onCancel }: ConvertToProductFormProps) {
  const { currentCompany } = useCompany();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: project?.nome || '',
      descricao: project?.descricao || '',
      preco: project?.orcamento?.toString() || '',
      categoria: project?.area || '',
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      const { error } = await supabase.from('products').insert([{
        nome: data.nome,
        descricao: data.descricao || null,
        preco: data.preco ? parseFloat(data.preco) : null,
        categoria: data.categoria || null,
        project_id: project.id,
        company_id: currentCompany?.id,
      }]);

      if (error) throw error;

      toast({ title: 'Produto criado', description: 'O projeto foi convertido em produto.' });
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Produto *</Label>
        <Input {...register('nome')} placeholder="Nome do produto" />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preço (R$)</Label>
          <Input type="number" step="0.01" {...register('preco')} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input {...register('categoria')} placeholder="Ex: Sistema" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea {...register('descricao')} rows={3} placeholder="Descreva o produto..." />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Produto
        </Button>
      </div>
    </form>
  );
}
