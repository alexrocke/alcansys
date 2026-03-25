import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Eye, Briefcase, Shield, Monitor } from 'lucide-react';
import jsPDF from 'jspdf';

interface Campo {
  key: string;
  label: string;
  type: string;
  required: boolean;
  default?: string;
}

const tipoIcons: Record<string, typeof FileText> = {
  prestacao_servicos: Briefcase,
  saas: Monitor,
  nda: Shield,
};

const tipoLabels: Record<string, string> = {
  prestacao_servicos: 'Prestação de Serviços',
  saas: 'SaaS / Licenciamento',
  nda: 'Confidencialidade (NDA)',
};

export function ContractTemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    const campos = (template.campos as Campo[]) || [];
    const defaults: Record<string, string> = {};
    campos.forEach((c) => {
      if (c.default) defaults[c.key] = c.default;
    });
    setFieldValues(defaults);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const generateContract = () => {
    if (!selectedTemplate) return '';
    let content = selectedTemplate.conteudo as string;
    Object.entries(fieldValues).forEach(([key, value]) => {
      content = content.replaceAll(`{{${key}}}`, value || `[${key}]`);
    });
    return content;
  };

  const handlePreview = () => {
    setGeneratedContent(generateContract());
    setPreviewOpen(true);
  };

  const handleDownloadPDF = () => {
    const content = generateContract();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    
    doc.setFont('helvetica');
    doc.setFontSize(10);
    
    const lines = doc.splitTextToSize(content, maxWidth);
    let y = margin;
    const lineHeight = 5;
    
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      // Bold for titles (all caps lines)
      if (line === line.toUpperCase() && line.trim().length > 3) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      } else if (line.startsWith('CLÁUSULA') || line.startsWith('CLAUSULA')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    const fileName = `${selectedTemplate.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const campos = (selectedTemplate?.campos as Campo[]) || [];
  const allRequiredFilled = campos
    .filter((c) => c.required)
    .every((c) => fieldValues[c.key]?.trim());

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedTemplate.nome}</h3>
            <p className="text-sm text-muted-foreground">{selectedTemplate.descricao}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
            Voltar aos Modelos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preencha os campos do contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {campos.map((campo) => (
                <div key={campo.key} className="space-y-1.5">
                  <Label htmlFor={campo.key} className="text-sm">
                    {campo.label}
                    {campo.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {campo.type === 'textarea' ? (
                    <Textarea
                      id={campo.key}
                      value={fieldValues[campo.key] || ''}
                      onChange={(e) => handleFieldChange(campo.key, e.target.value)}
                      placeholder={campo.label}
                      rows={3}
                    />
                  ) : campo.type === 'date' ? (
                    <Input
                      id={campo.key}
                      type="date"
                      value={fieldValues[campo.key] || ''}
                      onChange={(e) => handleFieldChange(campo.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={campo.key}
                      value={fieldValues[campo.key] || ''}
                      onChange={(e) => handleFieldChange(campo.key, e.target.value)}
                      placeholder={campo.label}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button onClick={handlePreview} variant="outline" className="gap-2">
                <Eye className="h-4 w-4" /> Pré-visualizar
              </Button>
              <Button onClick={handleDownloadPDF} disabled={!allRequiredFilled} className="gap-2">
                <Download className="h-4 w-4" /> Gerar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Pré-visualização do Contrato</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed p-6 bg-card border rounded-lg">
                {generatedContent}
              </pre>
            </ScrollArea>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" /> Baixar PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione um modelo de contrato, preencha os campos e gere o documento pronto.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {templates?.map((template) => {
          const Icon = tipoIcons[template.tipo] || FileText;
          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight">{template.nome}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-3">{template.descricao}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {tipoLabels[template.tipo] || template.tipo}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {((template.campos as Campo[]) || []).length} campos
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!templates?.length && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum modelo de contrato disponível.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
