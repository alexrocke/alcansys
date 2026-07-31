import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Video, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type M = { id: string; titulo: string; data: string; participantes: string[] | null; ata: string | null; link_gravacao: string | null };

export function ProjectMeetings({ projectId, companyId }: { projectId: string; companyId: string }) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'owner';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<M | null>(null);
  const [form, setForm] = useState({ titulo: '', data: '', participantes: '', ata: '', link_gravacao: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['project-meetings', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('project_meetings').select('*').eq('project_id', projectId).order('data', { ascending: false });
      if (error) throw error;
      return data as M[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error('Título obrigatório');
      const payload: any = { project_id: projectId, company_id: companyId, titulo: form.titulo.trim(), data: form.data || new Date().toISOString(), participantes: form.participantes.split(',').map(s => s.trim()).filter(Boolean), ata: form.ata || null, link_gravacao: form.link_gravacao || null };
      const q = editing ? supabase.from('project_meetings').update(payload).eq('id', editing.id) : supabase.from('project_meetings').insert(payload);
      const { error } = await q; if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-meetings', projectId] }); setOpen(false); setEditing(null); toast({ title: 'Salvo' }); },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('project_meetings').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project-meetings', projectId] }); toast({ title: 'Removido' }); },
  });

  const openEdit = (m: M) => { setEditing(m); setForm({ titulo: m.titulo, data: m.data.slice(0, 16), participantes: (m.participantes || []).join(', '), ata: m.ata || '', link_gravacao: m.link_gravacao || '' }); setOpen(true); };
  const openNew = () => { setEditing(null); setForm({ titulo: '', data: new Date().toISOString().slice(0, 16), participantes: '', ata: '', link_gravacao: '' }); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h3 className="text-base font-semibold flex items-center gap-2"><Video className="h-4 w-4" />Reuniões / Atas</h3><p className="text-xs text-muted-foreground">Histórico de reuniões, decisões e gravações.</p></div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Editar reunião' : 'Nova reunião'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} /></div>
                <div><Label>Data / Hora</Label><Input type="datetime-local" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} /></div>
                <div><Label>Participantes (separados por vírgula)</Label><Input value={form.participantes} onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))} /></div>
                <div><Label>Link da gravação</Label><Input value={form.link_gravacao} onChange={e => setForm(f => ({ ...f, link_gravacao: e.target.value }))} /></div>
                <div><Label>Ata / Decisões</Label><Textarea value={form.ata} onChange={e => setForm(f => ({ ...f, ata: e.target.value }))} rows={4} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p> : (
        <div className="space-y-2">{items.map(m => (
          <Card key={m.id}><CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(m.data).toLocaleString('pt-BR')} {m.participantes?.length ? `• ${m.participantes.join(', ')}` : ''}</p>
                {m.link_gravacao && <a href={m.link_gravacao} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"><ExternalLink className="h-3 w-3" />Gravação</a>}
                {m.ata && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{m.ata}</p>}
              </div>
              {canEdit && <div className="flex gap-1 shrink-0"><Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { if (await confirmDialog('Remover este item? Esta ação não pode ser desfeita.')) remove.mutate(m.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}
