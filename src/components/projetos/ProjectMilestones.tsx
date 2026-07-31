import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Flag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type M = { id: string; titulo: string; descricao: string | null; data_prevista: string | null; data_entrega: string | null; status: string; ordem: number };
const STATUS = [
  { v: 'pendente', l: 'Pendente', c: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  { v: 'em_andamento', l: 'Em Andamento', c: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { v: 'concluido', l: 'Concluído', c: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { v: 'atrasado', l: 'Atrasado', c: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

export function ProjectMilestones({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<M | null>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', data_prevista: '', data_entrega: '', status: 'pendente', ordem: 0 });

  const { data: items = [] } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_milestones').select('*').eq('project_id', projectId).order('ordem').order('data_prevista');
      if (error) throw error;
      return data as M[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error('Título obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, titulo: form.titulo.trim(), descricao: form.descricao || null, data_prevista: form.data_prevista || null, data_entrega: form.data_entrega || null, status: form.status, ordem: form.ordem };
      const q = editing ? supabase.from('project_milestones').update(payload).eq('id', editing.id) : supabase.from('project_milestones').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-milestones', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_milestones').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-milestones', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (m: M) => { setEditing(m); setForm({ titulo: m.titulo, descricao: m.descricao || '', data_prevista: m.data_prevista || '', data_entrega: m.data_entrega || '', status: m.status, ordem: m.ordem }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ titulo: '', descricao: '', data_prevista: '', data_entrega: '', status: 'pendente', ordem: items.length }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Flag className="h-4 w-4" />Marcos / Milestones</h3><p className="text-xs text-muted-foreground">Marcos importantes com data prevista e entregue.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar marco' : 'Novo marco'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data prevista</Label><Input type="date" value={form.data_prevista} onChange={e => setForm(f => ({ ...f, data_prevista: e.target.value }))} /></div>
                  <div><Label>Data entrega</Label><Input type="date" value={form.data_entrega} onChange={e => setForm(f => ({ ...f, data_entrega: e.target.value }))} /></div>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum marco cadastrado.</p> : (
        <div className="space-y-2">{items.map(m => {
          const s = STATUS.find(x => x.v === m.status);
          return (
            <Card key={m.id}><CardContent className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{m.titulo}</p><Badge variant="outline" className={s?.c}>{s?.l}</Badge></div>
                  {m.descricao && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{m.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Prev: {m.data_prevista || '-'} • Entrega: {m.data_entrega || '-'}</p>
                </div>
                {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(m.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
              </div>
            </CardContent></Card>
          );
        })}</div>
      )}
    </div>
  );
}
