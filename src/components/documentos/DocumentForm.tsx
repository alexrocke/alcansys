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
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const documentSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tipo: z.enum(['contrato', 'proposta', 'relatorio', 'outros']),
  project_id: z.string().optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  document?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DocumentForm({ document, onSuccess, onCancel }: DocumentFormProps) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      nome: document?.nome || '',
      tipo: document?.tipo || 'outros',
      project_id: document?.project_id || '',
      tags: document?.tags?.join(', ') || '',
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  const selectedTipo = watch('tipo');
  const selectedProject = watch('project_id');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 20MB.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!document && !file) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Você precisa selecionar um arquivo para upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = document?.url;

      // Upload file if new document
      if (file && user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        fileUrl = fileName; // Store the path, not the full URL
      }

      const tagsArray = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const documentData = {
        nome: data.nome,
        tipo: data.tipo,
        url: fileUrl,
        project_id: data.project_id || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        autor_id: user?.id,
      };

      if (document) {
        const { error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', document.id);

        if (error) throw error;

        toast({
          title: 'Documento atualizado',
          description: 'O documento foi atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('documents')
          .insert([documentData]);

        if (error) throw error;

        toast({
          title: 'Documento enviado',
          description: 'O documento foi enviado com sucesso.',
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o documento.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {!document && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="file">Arquivo *</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="file"
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1"
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">
                  {file ? file.name : 'Clique para selecionar arquivo'}
                </span>
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 20MB. Formatos suportados: PDF, DOC, DOCX, XLS, XLSX, etc.
            </p>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome do Documento *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Contrato de Prestação de Serviços"
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={selectedTipo}
            onValueChange={(value) => setValue('tipo', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="relatorio">Relatório</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-red-500">{errors.tipo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto</Label>
          <Select
            value={selectedProject || undefined}
            onValueChange={(value) => setValue('project_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum projeto selecionado" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.project_id && (
            <p className="text-sm text-red-500">{errors.project_id.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            {...register('tags')}
            placeholder="Ex: urgente, cliente-x, 2024 (separadas por vírgula)"
          />
          {errors.tags && (
            <p className="text-sm text-red-500">{errors.tags.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Adicione tags separadas por vírgula para facilitar a busca
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || uploading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {uploading ? 'Enviando...' : isSubmitting ? 'Salvando...' : document ? 'Atualizar' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
