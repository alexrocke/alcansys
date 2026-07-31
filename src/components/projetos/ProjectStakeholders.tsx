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
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type S = { id: string; nome: string; cargo: string | null; email: string | null; telefone: string | null; papel: string; observacoes: string | null };
const PAPEIS = ['pm', 'tecnico', 'financeiro', 'diretor', 'outro'];

export function ProjectStakeholders({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<S | null>(null);
  const [form, setForm] = useState({ nome: '', cargo: '', email: '', telefone: '', papel: 'outro', observacoes: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-stakeholders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_stakeholders').select('*').eq('project_id', projectId).order('nome');
      if (error) throw error;
      return data as S[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error('Nome obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, ...form, cargo: form.cargo || null, email: form.email || null, telefone: form.telefone || null, observacoes: form.observacoes || null };
      const q = editing ? supabase.from('project_stakeholders').update(payload).eq('id', editing.id) : supabase.from('project_stakeholders').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-stakeholders', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_stakeholders').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-stakeholders', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (s: S) => { setEditing(s); setForm({ nome: s.nome, cargo: s.cargo || '', email: s.email || '', telefone: s.telefone || '', papel: s.papel, observacoes: s.observacoes || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ nome: '', cargo: '', email: '', telefone: '', papel: 'outro', observacoes: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><UserCircle className="h-4 w-4" />Stakeholders do Cliente</h3><p className="text-xs text-muted-foreground">Contatos do lado do cliente.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar contato' : 'Novo contato'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
                  <div><Label>Papel</Label><Select value={form.papel} onValueChange={v => setForm(f => ({ ...f, papel: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAPEIS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p> : (
        <div className="space-y-2">{items.map(s => (
          <Card key={s.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{s.nome}</p><Badge variant="outline">{s.papel}</Badge></div>
                <p className="text-xs text-muted-foreground mt-1">{s.cargo} {s.email && `• ${s.email}`} {s.telefone && `• ${s.telefone}`}</p>
                {s.observacoes && <p className="text-xs text-muted-foreground mt-1">{s.observacoes}</p>}
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
