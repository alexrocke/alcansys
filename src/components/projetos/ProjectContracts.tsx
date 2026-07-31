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
import { Plus, Pencil, Trash2, FileSignature, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type C = { id: string; titulo: string; tipo: string; url_arquivo: string | null; data_assinatura: string | null; valor: number | null; status: string; observacoes: string | null };
const TIPOS = ['contrato', 'aditivo', 'sla', 'nda', 'outro'];
const STATUS = ['pendente', 'assinado', 'expirado', 'cancelado'];

export function ProjectContracts({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [form, setForm] = useState({ titulo: '', tipo: 'contrato', url_arquivo: '', data_assinatura: '', valor: '', status: 'pendente', observacoes: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-contracts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_contracts').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as C[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error('Título obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, titulo: form.titulo.trim(), tipo: form.tipo, url_arquivo: form.url_arquivo || null, data_assinatura: form.data_assinatura || null, valor: form.valor ? Number(form.valor) : null, status: form.status, observacoes: form.observacoes || null };
      const q = editing ? supabase.from('project_contracts').update(payload).eq('id', editing.id) : supabase.from('project_contracts').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-contracts', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_contracts').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-contracts', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (c: C) => { setEditing(c); setForm({ titulo: c.titulo, tipo: c.tipo, url_arquivo: c.url_arquivo || '', data_assinatura: c.data_assinatura || '', valor: c.valor?.toString() || '', status: c.status, observacoes: c.observacoes || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ titulo: '', tipo: 'contrato', url_arquivo: '', data_assinatura: '', valor: '', status: 'pendente', observacoes: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><FileSignature className="h-4 w-4" />Contratos</h3><p className="text-xs text-muted-foreground">Contratos, aditivos e SLAs.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar contrato' : 'Novo contrato'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data assinatura</Label><Input type="date" value={form.data_assinatura} onChange={e => setForm(f => ({ ...f, data_assinatura: e.target.value }))} /></div>
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
                </div>
                <div><Label>URL do arquivo</Label><Input value={form.url_arquivo} onChange={e => setForm(f => ({ ...f, url_arquivo: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum contrato registrado.</p> : (
        <div className="space-y-2">{items.map(c => (
          <Card key={c.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{c.titulo}</p><Badge variant="outline">{c.tipo}</Badge><Badge variant="secondary">{c.status}</Badge></div>
                <p className="text-xs text-muted-foreground mt-1">{c.data_assinatura || 'Sem data'} {c.valor && `• R$ ${c.valor}`}</p>
                {c.url_arquivo && <a href={c.url_arquivo} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><ExternalLink className="h-3 w-3" />Abrir arquivo</a>}
                {c.observacoes && <p className="text-xs text-muted-foreground mt-1">{c.observacoes}</p>}
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
