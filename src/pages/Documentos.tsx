import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, Upload, Tag, FolderOpen, ScrollText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentForm } from '@/components/documentos/DocumentForm';
import { DocumentList } from '@/components/documentos/DocumentList';
import { ContractTemplateManager } from '@/components/documentos/ContractTemplateManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Documentos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['documents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(id, nome),
          autor:profiles(id, nome)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome')
        .eq('company_id', companyId)
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleEdit = (document: any) => {
    setEditingDocument(document);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDocument(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = 
      doc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = tipoFilter === 'all' || doc.tipo === tipoFilter;
    const matchesProject = projectFilter === 'all' || doc.project_id === projectFilter;
    
    return matchesSearch && matchesType && matchesProject;
  });

  // Get unique tags from all documents
  const allTags = documents?.reduce((tags: string[], doc) => {
    if (doc.tags) {
      doc.tags.forEach((tag: string) => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    return tags;
  }, []) || [];

  const totalDocuments = documents?.length || 0;
  const documentsByType = {
    contrato: documents?.filter(d => d.tipo === 'contrato').length || 0,
    proposta: documents?.filter(d => d.tipo === 'proposta').length || 0,
    relatorio: documents?.filter(d => d.tipo === 'relatorio').length || 0,
    outros: documents?.filter(d => d.tipo === 'outros').length || 0,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie arquivos e documentos da empresa
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="gap-2 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Documento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Documentos
            </CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Arquivos armazenados
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos
            </CardTitle>
            <FolderOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-500">
              {documentsByType.contrato}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos contratuais
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Propostas
            </CardTitle>
            <Upload className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-500">
              {documentsByType.proposta}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Propostas comerciais
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tags Únicas
            </CardTitle>
            <Tag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {allTags.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Categorias ativas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
            <SelectItem value="proposta">Proposta</SelectItem>
            <SelectItem value="relatorio">Relatório</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DocumentList
        documents={filteredDocuments || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefetch={refetch}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Editar Documento' : 'Novo Documento'}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm
            document={editingDocument}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
