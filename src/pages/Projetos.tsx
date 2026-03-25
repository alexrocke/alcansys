import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileDown } from 'lucide-react';
import { generateProjectsReport } from '@/lib/reportGenerator';
import { ProjectForm } from '@/components/projetos/ProjectForm';
import { ProjectList } from '@/components/projetos/ProjectList';
import { ProductList } from '@/components/projetos/ProductList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Projetos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, nome),
          gestor:profiles(id, nome)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Query project costs from finances
  const { data: projectCosts } = useQuery({
    queryKey: ['project-costs', companyId],
    queryFn: async () => {
      if (!companyId) return {};
      const { data, error } = await supabase
        .from('finances')
        .select('project_id, valor')
        .eq('company_id', companyId)
        .eq('tipo', 'despesa')
        .not('project_id', 'is', null);

      if (error) throw error;

      const costs: Record<string, number> = {};
      data?.forEach((f) => {
        if (f.project_id) {
          costs[f.project_id] = (costs[f.project_id] || 0) + Number(f.valor);
        }
      });
      return costs;
    },
    enabled: !!companyId,
  });

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = 
      project.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client?.nome?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Projetos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie todos os projetos da empresa</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="gap-2 w-full md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
        <Button
          variant="outline"
          onClick={() => generateProjectsReport(projects || [], projectCosts || {})}
          className="gap-2 w-full md:w-auto"
          disabled={!projects?.length}
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Tabs defaultValue="projetos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ProjectList
            projects={filteredProjects || []}
            projectCosts={projectCosts || {}}
            isLoading={isLoading}
            onEdit={handleEdit}
            onRefetch={refetch}
          />
        </TabsContent>

        <TabsContent value="produtos">
          <ProductList />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
