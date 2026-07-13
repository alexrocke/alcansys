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
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type R = { id: string; titulo: string; descricao: string | null; impacto: string; probabilidade: string; mitigacao: string | null; status: string };
const NIVEIS = ['baixo', 'medio', 'alto'];
const PROBS = ['baixa', 'media', 'alta'];
const STATUS = ['aberto', 'mitigado', 'materializado', 'encerrado'];
const cor = (v: string) => v === 'alto' || v === 'alta' ? 'bg-red-500/10 text-red-500 border-red-500/20' : v === 'medio' || v === 'media' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20';

export function ProjectRisks({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<R | null>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', impacto: 'medio', probabilidade: 'media', mitigacao: '', status: 'aberto' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-risks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_risks').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as R[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error('Título obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, ...form, descricao: form.descricao || null, mitigacao: form.mitigacao || null };
      const q = editing ? supabase.from('project_risks').update(payload).eq('id', editing.id) : supabase.from('project_risks').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-risks', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_risks').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-risks', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (r: R) => { setEditing(r); setForm({ titulo: r.titulo, descricao: r.descricao || '', impacto: r.impacto, probabilidade: r.probabilidade, mitigacao: r.mitigacao || '', status: r.status }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ titulo: '', descricao: '', impacto: 'medio', probabilidade: 'media', mitigacao: '', status: 'aberto' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Riscos</h3><p className="text-xs text-muted-foreground">Riscos identificados e planos de mitigação.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar risco' : 'Novo risco'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Impacto</Label><Select value={form.impacto} onValueChange={v => setForm(f => ({ ...f, impacto: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Probabilidade</Label><Select value={form.probabilidade} onValueChange={v => setForm(f => ({ ...f, probabilidade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROBS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Mitigação</Label><Textarea value={form.mitigacao} onChange={e => setForm(f => ({ ...f, mitigacao: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum risco registrado.</p> : (
        <div className="space-y-2">{items.map(r => (
          <Card key={r.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{r.titulo}</p><Badge variant="outline" className={cor(r.impacto)}>Impacto: {r.impacto}</Badge><Badge variant="outline" className={cor(r.probabilidade)}>Prob: {r.probabilidade}</Badge><Badge variant="outline">{r.status}</Badge></div>
                {r.descricao && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.descricao}</p>}
                {r.mitigacao && <p className="text-xs text-muted-foreground mt-1"><strong>Mitigação:</strong> {r.mitigacao}</p>}
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => confirm('Remover?') && remove.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
