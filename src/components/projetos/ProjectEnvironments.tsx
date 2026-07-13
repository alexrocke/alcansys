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
import { Plus, Pencil, Trash2, Cloud, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type E = { id: string; nome: string; tipo: string; url: string | null; branch: string | null; repo_url: string | null; deploy_provider: string | null; observacoes: string | null };
const TIPOS = ['dev', 'staging', 'producao', 'homologacao'];

export function ProjectEnvironments({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<E | null>(null);
  const [form, setForm] = useState({ nome: '', tipo: 'producao', url: '', branch: '', repo_url: '', deploy_provider: '', observacoes: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-environments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_environments').select('*').eq('project_id', projectId).order('tipo');
      if (error) throw error;
      return data as E[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error('Nome obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, ...form, url: form.url || null, branch: form.branch || null, repo_url: form.repo_url || null, deploy_provider: form.deploy_provider || null, observacoes: form.observacoes || null };
      const q = editing ? supabase.from('project_environments').update(payload).eq('id', editing.id) : supabase.from('project_environments').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-environments', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_environments').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-environments', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (e: E) => { setEditing(e); setForm({ nome: e.nome, tipo: e.tipo, url: e.url || '', branch: e.branch || '', repo_url: e.repo_url || '', deploy_provider: e.deploy_provider || '', observacoes: e.observacoes || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ nome: '', tipo: 'producao', url: '', branch: '', repo_url: '', deploy_provider: '', observacoes: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Cloud className="h-4 w-4" />Ambientes & Repositórios</h3><p className="text-xs text-muted-foreground">URLs de dev/staging/prod, branches e provedores de deploy.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar ambiente' : 'Novo ambiente'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
                  <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>URL do ambiente</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://app.exemplo.com" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Branch</Label><Input value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} placeholder="main" /></div>
                  <div><Label>Provedor Deploy</Label><Input value={form.deploy_provider} onChange={e => setForm(f => ({ ...f, deploy_provider: e.target.value }))} placeholder="Vercel / CF Pages" /></div>
                </div>
                <div><Label>Repositório</Label><Input value={form.repo_url} onChange={e => setForm(f => ({ ...f, repo_url: e.target.value }))} placeholder="https://github.com/..." /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum ambiente cadastrado.</p> : (
        <div className="space-y-2">{items.map(e => (
          <Card key={e.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{e.nome}</p><Badge variant="outline">{e.tipo}</Badge>{e.deploy_provider && <Badge variant="secondary">{e.deploy_provider}</Badge>}</div>
                {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><ExternalLink className="h-3 w-3" />{e.url}</a>}
                {e.repo_url && <a href={e.repo_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline block mt-0.5">Repo: {e.repo_url} {e.branch && `(${e.branch})`}</a>}
                {e.observacoes && <p className="text-xs text-muted-foreground mt-1">{e.observacoes}</p>}
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => confirm('Remover?') && remove.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
