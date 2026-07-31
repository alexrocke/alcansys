import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

const STATUS = ['pendente', 'pago', 'vencido', 'cancelado'];

export function ProjectInvoices({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', data_vencimento: '', data_pagamento: '', status: 'pendente' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*').eq('project_id', projectId).order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.descricao.trim() || !form.valor || !form.data_vencimento) throw new Error('Descrição, valor e vencimento são obrigatórios');
      const payload: any = { company_id: companyId, project_id: projectId, descricao: form.descricao.trim(), valor: Number(form.valor), data_vencimento: form.data_vencimento, data_pagamento: form.data_pagamento || null, status: form.status };
      const q = editing ? supabase.from('invoices').update(payload).eq('id', editing.id) : supabase.from('invoices').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-invoices', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('invoices').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-invoices', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (i: any) => { setEditing(i); setForm({ descricao: i.descricao, valor: i.valor.toString(), data_vencimento: i.data_vencimento, data_pagamento: i.data_pagamento || '', status: i.status }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ descricao: '', valor: '', data_vencimento: '', data_pagamento: '', status: 'pendente' }); setOpen(true); };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const total = items.reduce((s, i) => s + Number(i.valor || 0), 0);
  const pago = items.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.valor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4" />Faturas do Projeto</h3><p className="text-xs text-muted-foreground">Faturas vinculadas a este projeto.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar fatura' : 'Nova fatura'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></div>
                  <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} /></div>
                  <div><Label>Pagamento</Label><Input type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm py-1 px-3">Total: {fmt(total)}</Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-sm py-1 px-3">Pago: {fmt(pago)}</Badge>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-sm py-1 px-3">Pendente: {fmt(total - pago)}</Badge>
        </div>
      )}
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma fatura vinculada.</p> : (
        <div className="space-y-2">{items.map(i => (
          <Card key={i.id}><CardContent className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.descricao}</p>
                <p className="text-xs text-muted-foreground">Vencimento: {i.data_vencimento} {i.data_pagamento && `• Pago em ${i.data_pagamento}`}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{fmt(Number(i.valor))}</p>
                <Badge variant="outline" className={i.status === 'pago' ? 'bg-green-500/10 text-green-500 border-green-500/20' : i.status === 'vencido' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>{i.status}</Badge>
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(i.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
