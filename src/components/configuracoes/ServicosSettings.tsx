import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS = ['Automação', 'Desenvolvimento', 'Consultoria', 'Chatbot', 'Marketing', 'Outro'];

interface ServiceForm {
  id?: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_base: string;
  ativo: boolean;
}

const emptyForm: ServiceForm = { nome: '', descricao: '', categoria: '', preco_base: '', ativo: true };

export function ServicosSettings() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (s: ServiceForm) => {
      const payload = {
        nome: s.nome,
        descricao: s.descricao || null,
        categoria: s.categoria || null,
        preco_base: s.preco_base ? Number(s.preco_base) : null,
        ativo: s.ativo,
      };
      if (s.id) {
        const { error } = await supabase.from('services').update(payload).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(form.id ? 'Serviço atualizado!' : 'Serviço criado!');
      setOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error('Erro ao salvar serviço'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Serviço excluído!');
    },
    onError: () => toast.error('Erro ao excluir serviço'),
  });

  const filtered = services?.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || s.categoria === filterCat;
    return matchSearch && matchCat;
  });

  const openEdit = (s: any) => {
    setForm({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao || '',
      categoria: s.categoria || '',
      preco_base: s.preco_base?.toString() || '',
      ativo: s.ativo,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => { e.preventDefault(); upsert.mutate(form); }}
            >
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço Base (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.preco_base} onChange={(e) => setForm({ ...form, preco_base: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                <Label>Ativo</Label>
              </div>
              <Button type="submit" className="w-full" disabled={upsert.isPending}>
                {upsert.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filtered?.length ? (
        <p className="text-center text-muted-foreground py-8">Nenhum serviço encontrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço Base</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nome}</TableCell>
                <TableCell>{s.categoria ? <Badge variant="secondary">{s.categoria}</Badge> : '—'}</TableCell>
                <TableCell>{s.preco_base ? `R$ ${Number(s.preco_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.ativo ? 'default' : 'outline'}>{s.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
