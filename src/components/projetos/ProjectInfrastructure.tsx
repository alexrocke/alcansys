import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Globe, Database, Mail, Key, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from "@/components/ConfirmDialog";

type Integration = {
  id: string;
  project_id: string;
  company_id: string;
  categoria: 'dominio' | 'supabase' | 'resend' | 'api' | 'outro';
  nome: string;
  valor: string | null;
  status: 'ativo' | 'inativo' | 'pendente';
  observacoes: string | null;
};

const CATEGORIAS = [
  { value: 'dominio', label: 'Domínio', icon: Globe },
  { value: 'supabase', label: 'Supabase', icon: Database },
  { value: 'resend', label: 'Resend / Email', icon: Mail },
  { value: 'api', label: 'API / Chave', icon: Key },
  { value: 'outro', label: 'Outro', icon: Package },
] as const;

const statusColors: Record<string, string> = {
  ativo: 'bg-green-500/10 text-green-500 border-green-500/20',
  inativo: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  pendente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

interface Props {
  projectId: string;
  companyId: string;
}

export function ProjectInfrastructure({ projectId, companyId }: Props) {
  const qc = useQueryClient();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [form, setForm] = useState({
    categoria: 'api' as Integration['categoria'],
    nome: '',
    valor: '',
    status: 'ativo' as Integration['status'],
    observacoes: '',
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['project-integrations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', projectId)
        .order('categoria');
      if (error) throw error;
      return data as Integration[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error('Nome é obrigatório');
      const payload = {
        project_id: projectId,
        company_id: companyId,
        categoria: form.categoria,
        nome: form.nome.trim(),
        valor: form.valor.trim() || null,
        status: form.status,
        observacoes: form.observacoes.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from('project_integrations').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('project_integrations').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      setOpen(false);
      setEditing(null);
      setForm({ categoria: 'api', nome: '', valor: '', status: 'ativo', observacoes: '' });
      toast({ title: editing ? 'Integração atualizada' : 'Integração adicionada' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_integrations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-integrations', projectId] });
      toast({ title: 'Integração removida' });
    },
  });

  const openEdit = (i: Integration) => {
    setEditing(i);
    setForm({
      categoria: i.categoria,
      nome: i.nome,
      valor: i.valor || '',
      status: i.status,
      observacoes: i.observacoes || '',
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ categoria: 'api', nome: '', valor: '', status: 'ativo', observacoes: '' });
    setOpen(true);
  };

  const grouped = CATEGORIAS.map(cat => ({
    ...cat,
    items: items.filter(i => i.categoria === cat.value),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Infraestrutura do Projeto</h3>
          <p className="text-xs text-muted-foreground">Domínio, conta Supabase, Resend, APIs e demais integrações.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar integração' : 'Nova integração'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v as Integration['categoria'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nome / Identificação</Label>
                  <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="ex: cliente.com.br, projeto-xyz, RESEND_API_KEY" />
                </div>
                <div>
                  <Label>Valor / URL / Referência</Label>
                  <Input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="ex: https://xxx.supabase.co, conta@email.com" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as Integration['status'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma integração cadastrada.</p>
      ) : (
        <div className="space-y-4">
          {grouped.filter(g => g.items.length > 0).map(g => {
            const Icon = g.icon;
            return (
              <div key={g.value}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">{g.label}</h4>
                  <Badge variant="secondary" className="text-xs">{g.items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {g.items.map(i => (
                    <Card key={i.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">{i.nome}</p>
                              <Badge variant="outline" className={statusColors[i.status]}>{i.status}</Badge>
                            </div>
                            {i.valor && <p className="text-xs text-muted-foreground truncate mt-0.5">{i.valor}</p>}
                            {i.observacoes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{i.observacoes}</p>}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(i)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={async () => {
                                if (await confirmDialog('Remover esta integração?')) remove.mutate(i.id);
                              }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
