import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LifeBuoy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function ProjectSupport({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [form, setForm] = useState({ data_inicio_garantia: '', data_fim_garantia: '', horas_contratadas: '', horas_consumidas: '', chamados_abertos: '', observacoes: '' });

  const { data: support } = useQuery({
    queryKey: ['project-support', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_support').select('*').eq('project_id', projectId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (support) setForm({
      data_inicio_garantia: support.data_inicio_garantia || '',
      data_fim_garantia: support.data_fim_garantia || '',
      horas_contratadas: support.horas_contratadas?.toString() || '',
      horas_consumidas: support.horas_consumidas?.toString() || '',
      chamados_abertos: support.chamados_abertos?.toString() || '',
      observacoes: support.observacoes || '',
    });
  }, [support]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { project_id: projectId, company_id: companyId, data_inicio_garantia: form.data_inicio_garantia || null, data_fim_garantia: form.data_fim_garantia || null, horas_contratadas: Number(form.horas_contratadas) || 0, horas_consumidas: Number(form.horas_consumidas) || 0, chamados_abertos: Number(form.chamados_abertos) || 0, observacoes: form.observacoes || null };
      const { error } = await supabase.from('project_support').upsert(payload, { onConflict: 'project_id' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-support', projectId] }); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const contratadas = Number(form.horas_contratadas) || 0;
  const consumidas = Number(form.horas_consumidas) || 0;
  const pct = contratadas > 0 ? Math.min(100, Math.round((consumidas / contratadas) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2"><LifeBuoy className="h-4 w-4" />Suporte Pós-Entrega</h3>
        <p className="text-xs text-muted-foreground">Garantia, horas de suporte contratadas e chamados abertos.</p>
      </div>
      <Card><CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Início da garantia</Label><Input type="date" disabled={!canEdit} value={form.data_inicio_garantia} onChange={e => setForm(f => ({ ...f, data_inicio_garantia: e.target.value }))} /></div>
          <div><Label>Fim da garantia</Label><Input type="date" disabled={!canEdit} value={form.data_fim_garantia} onChange={e => setForm(f => ({ ...f, data_fim_garantia: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Horas contratadas</Label><Input type="number" step="0.5" disabled={!canEdit} value={form.horas_contratadas} onChange={e => setForm(f => ({ ...f, horas_contratadas: e.target.value }))} /></div>
          <div><Label>Horas consumidas</Label><Input type="number" step="0.5" disabled={!canEdit} value={form.horas_consumidas} onChange={e => setForm(f => ({ ...f, horas_consumidas: e.target.value }))} /></div>
          <div><Label>Chamados abertos</Label><Input type="number" disabled={!canEdit} value={form.chamados_abertos} onChange={e => setForm(f => ({ ...f, chamados_abertos: e.target.value }))} /></div>
        </div>
        {contratadas > 0 && (
          <div><Label className="text-xs">Uso das horas: {consumidas}h / {contratadas}h ({pct}%)</Label><Progress value={pct} className="h-2 mt-1" /></div>
        )}
        <div><Label>Observações</Label><Textarea disabled={!canEdit} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} /></div>
        {canEdit && <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>}
      </CardContent></Card>
    </div>
  );
}
