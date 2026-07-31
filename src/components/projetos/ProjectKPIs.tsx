import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type K = { id: string; titulo: string; descricao: string | null; valor_alvo: number | null; valor_atual: number | null; unidade: string | null; prazo: string | null };

export function ProjectKPIs({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<K | null>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', valor_alvo: '', valor_atual: '', unidade: '', prazo: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-kpis', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_kpis').select('*').eq('project_id', projectId).order('created_at');
      if (error) throw error;
      return data as K[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error('Título obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, titulo: form.titulo.trim(), descricao: form.descricao || null, valor_alvo: form.valor_alvo ? Number(form.valor_alvo) : null, valor_atual: form.valor_atual ? Number(form.valor_atual) : 0, unidade: form.unidade || '', prazo: form.prazo || null };
      const q = editing ? supabase.from('project_kpis').update(payload).eq('id', editing.id) : supabase.from('project_kpis').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-kpis', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_kpis').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-kpis', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (k: K) => { setEditing(k); setForm({ titulo: k.titulo, descricao: k.descricao || '', valor_alvo: k.valor_alvo?.toString() || '', valor_atual: k.valor_atual?.toString() || '', unidade: k.unidade || '', prazo: k.prazo || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ titulo: '', descricao: '', valor_alvo: '', valor_atual: '', unidade: '', prazo: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Target className="h-4 w-4" />KPIs / Objetivos</h3><p className="text-xs text-muted-foreground">Metas mensuráveis e progresso.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar KPI' : 'Novo KPI'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Valor alvo</Label><Input type="number" value={form.valor_alvo} onChange={e => setForm(f => ({ ...f, valor_alvo: e.target.value }))} /></div>
                  <div><Label>Valor atual</Label><Input type="number" value={form.valor_atual} onChange={e => setForm(f => ({ ...f, valor_atual: e.target.value }))} /></div>
                  <div><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="%, R$, un" /></div>
                </div>
                <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum KPI cadastrado.</p> : (
        <div className="space-y-2">{items.map(k => {
          const pct = k.valor_alvo && k.valor_alvo > 0 ? Math.min(100, Math.round(((k.valor_atual || 0) / k.valor_alvo) * 100)) : 0;
          return (
            <Card key={k.id}><CardContent className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{k.titulo}</p>
                  {k.descricao && <p className="text-xs text-muted-foreground mt-0.5">{k.descricao}</p>}
                  <div className="mt-2 flex items-center gap-2"><Progress value={pct} className="flex-1 h-2" /><span className="text-xs font-medium">{pct}%</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{k.valor_atual ?? 0} / {k.valor_alvo ?? '-'} {k.unidade} {k.prazo && `• prazo: ${k.prazo}`}</p>
                </div>
                {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(k)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(k.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
              </div>
            </CardContent></Card>
          );
        })}</div>
      )}
    </div>
  );
}
