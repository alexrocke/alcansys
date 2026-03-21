import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Users, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowTemplateCard } from '@/components/automacoes/WorkflowTemplateCard';
import { WorkflowTemplateForm } from '@/components/automacoes/WorkflowTemplateForm';
import { ClientAutomationManager } from '@/components/automacoes/ClientAutomationManager';
import { InternalAutomationManager } from '@/components/automacoes/InternalAutomationManager';

export default function Automacoes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseForm();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Automações</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie templates de workflow e atribua a clientes
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Zap className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="interno" className="gap-2">
            <Building2 className="h-4 w-4" /> Uso Interno
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="h-4 w-4" /> Clientes Ativos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Template
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !templates?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum template criado ainda.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" /> Criar primeiro template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <WorkflowTemplateCard key={t.id} template={t} onEdit={handleEdit} onRefetch={refetch} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interno" className="mt-4">
          <InternalAutomationManager />
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          <ClientAutomationManager />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template de Workflow'}</DialogTitle>
          </DialogHeader>
          <WorkflowTemplateForm
            template={editingTemplate}
            onSuccess={handleSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
