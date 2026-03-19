import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Zap, Headphones, TrendingUp, Megaphone, LifeBuoy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ElementType> = {
  atendimento: Headphones,
  vendas: TrendingUp,
  marketing: Megaphone,
  suporte: LifeBuoy,
};

const categoryLabels: Record<string, string> = {
  atendimento: 'Atendimento',
  vendas: 'Vendas',
  marketing: 'Marketing',
  suporte: 'Suporte',
};

interface WorkflowTemplateCardProps {
  template: any;
  onEdit: (template: any) => void;
  onRefetch: () => void;
}

export function WorkflowTemplateCard({ template, onEdit, onRefetch }: WorkflowTemplateCardProps) {
  const Icon = categoryIcons[template.categoria] || Zap;
  const features = (template.features as string[]) || [];

  const handleToggle = async (checked: boolean) => {
    const { error } = await supabase
      .from('workflow_templates')
      .update({ ativo: checked })
      .eq('id', template.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: checked ? 'Template ativado' : 'Template desativado' });
      onRefetch();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    const { error } = await supabase.from('workflow_templates').delete().eq('id', template.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template excluído' });
      onRefetch();
    }
  };

  return (
    <Card className="border-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{template.nome}</CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {categoryLabels[template.categoria] || template.categoria}
              </Badge>
            </div>
          </div>
          <Switch checked={template.ativo} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {template.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{template.descricao}</p>
        )}

        {features.length > 0 && (
          <ul className="space-y-1">
            {features.slice(0, 4).map((f: string, i: number) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                {f}
              </li>
            ))}
            {features.length > 4 && (
              <li className="text-xs text-muted-foreground">+{features.length - 4} mais...</li>
            )}
          </ul>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-lg font-bold text-primary">
            {Number(template.preco) > 0
              ? `R$ ${Number(template.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
              : 'Gratuito'}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
