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
import { Plus, Pencil, Trash2, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type C = { id: string; nome: string; tipo: string; usuario: string | null; senha_encrypted: string | null; url: string | null; observacoes: string | null };
const TIPOS = ['painel', 'ftp', 'ssh', 'git', 'banco', 'servidor', 'outro'];

export function ProjectCredentials({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ nome: '', tipo: 'outro', usuario: '', senha: '', url: '', observacoes: '' });

  const encrypt = async (plain: string) => {
    if (!plain) return null;
    const { data, error } = await supabase.functions.invoke('vault-crypto', { body: { action: 'encrypt', plaintext: plain } });
    if (error) throw error;
    return data.ciphertext as string;
  };
  const decrypt = async (ct: string) => {
    const { data, error } = await supabase.functions.invoke('vault-crypto', { body: { action: 'decrypt', ciphertext: ct } });
    if (error) throw error;
    return data.plaintext as string;
  };

  const { data: items = [] } = useQuery({
    queryKey: ['project-credentials', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_credentials').select('*').eq('project_id', projectId).order('tipo');
      if (error) throw error;
      return data as C[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error('Nome obrigatório');
      let senha_encrypted: string | null = editing?.senha_encrypted || null;
      if (form.senha) senha_encrypted = await encrypt(form.senha);
      const payload: any = { project_id: projectId, company_id: companyId, nome: form.nome.trim(), tipo: form.tipo, usuario: form.usuario || null, senha_encrypted, url: form.url || null, observacoes: form.observacoes || null };
      const q = editing ? supabase.from('project_credentials').update(payload).eq('id', editing.id) : supabase.from('project_credentials').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-credentials', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_credentials').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-credentials', projectId] }); toast({ title: 'Removido' }); },
  });

  const toggleReveal = async (c: C) => {
    if (reveal[c.id]) { setReveal(r => ({ ...r, [c.id]: false })); return; }
    if (!c.senha_encrypted) return;
    try {
      const plain = await decrypt(c.senha_encrypted);
      setReveal(r => ({ ...r, [c.id]: true }));
      (c as any)._plain = plain;
      qc.setQueryData(['project-credentials', projectId], (old: any) => old?.map((x: any) => x.id === c.id ? { ...x, _plain: plain } : x));
    } catch (e: any) { toast({ title: 'Erro ao decifrar', description: e.message, variant: 'destructive' }); }
  };

  const openEdit = (c: C) => { setEditing(c); setForm({ nome: c.nome, tipo: c.tipo, usuario: c.usuario || '', senha: '', url: c.url || '', observacoes: c.observacoes || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ nome: '', tipo: 'outro', usuario: '', senha: '', url: '', observacoes: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Key className="h-4 w-4" />Credenciais do Projeto</h3><p className="text-xs text-muted-foreground">Acessos específicos (senhas criptografadas AES-256-GCM).</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar credencial' : 'Nova credencial'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
                  <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>URL</Label><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
                <div><Label>Usuário</Label><Input value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} /></div>
                <div><Label>Senha {editing && <span className="text-xs text-muted-foreground">(deixe vazio para manter)</span>}</Label><Input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada.</p> : (
        <div className="space-y-2">{items.map((c: any) => (
          <Card key={c.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{c.nome}</p><Badge variant="outline">{c.tipo}</Badge></div>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><ExternalLink className="h-3 w-3" />{c.url}</a>}
                {c.usuario && <p className="text-xs text-muted-foreground mt-1">Usuário: <span className="font-mono">{c.usuario}</span></p>}
                {c.senha_encrypted && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">Senha: <span className="font-mono">{reveal[c.id] ? c._plain : '••••••••'}</span></p>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleReveal(c)}>{reveal[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                  </div>
                )}
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
