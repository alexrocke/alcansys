import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, AppWindow, ExternalLink, DollarSign } from "lucide-react";
import { toast } from "sonner";

type AppStatus = "ativo" | "suspenso" | "cancelado";

const statusConfig: Record<string, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  suspenso: { label: "Suspenso", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

interface AppForm {
  id?: string;
  nome: string;
  descricao: string;
  categoria: string;
  valor_mensal: number;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  url: string;
  notas: string;
}

const emptyForm: AppForm = {
  nome: "", descricao: "", categoria: "", valor_mensal: 0,
  dia_vencimento: 1, data_inicio: new Date().toISOString().split("T")[0],
  data_fim: "", status: "ativo", url: "", notas: "",
};

export function ContractedAppsManager() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AppForm>(emptyForm);

  const { data: apps, isLoading } = useQuery({
    queryKey: ["contracted-apps", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from("contracted_apps")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany,
  });

  const saveMutation = useMutation({
    mutationFn: async (app: AppForm) => {
      if (!currentCompany) throw new Error("Sem empresa");
      const payload = {
        company_id: currentCompany.id,
        nome: app.nome,
        descricao: app.descricao || null,
        categoria: app.categoria || null,
        valor_mensal: app.valor_mensal,
        dia_vencimento: app.dia_vencimento,
        data_inicio: app.data_inicio,
        data_fim: app.data_fim || null,
        status: app.status as AppStatus,
        url: app.url || null,
        notas: app.notas || null,
      };
      if (app.id) {
        const { error } = await supabase.from("contracted_apps").update(payload).eq("id", app.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contracted_apps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracted-apps"] });
      toast.success("Aplicativo salvo com sucesso!");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar aplicativo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracted_apps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracted-apps"] });
      toast.success("Aplicativo removido");
    },
  });

  const openEdit = (app: any) => {
    setForm({
      id: app.id, nome: app.nome, descricao: app.descricao || "",
      categoria: app.categoria || "", valor_mensal: app.valor_mensal,
      dia_vencimento: app.dia_vencimento, data_inicio: app.data_inicio,
      data_fim: app.data_fim || "", status: app.status,
      url: app.url || "", notas: app.notas || "",
    });
    setOpen(true);
  };

  const totalMensal = (apps || [])
    .filter((a: any) => a.status === "ativo")
    .reduce((sum: number, a: any) => sum + Number(a.valor_mensal), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AppWindow className="h-5 w-5" />
              Aplicativos Contratados
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Controle os aplicativos e serviços com custo mensal recorrente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">Total Mensal</p>
              <p className="text-lg font-bold text-primary flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {totalMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Novo App</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{form.id ? "Editar Aplicativo" : "Novo Aplicativo"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Canva Pro" />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Design, Marketing" />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Valor Mensal (R$) *</Label>
                      <Input type="number" step="0.01" min="0" value={form.valor_mensal} onChange={(e) => setForm({ ...form, valor_mensal: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label>Dia Vencimento *</Label>
                      <Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={(e) => setForm({ ...form, dia_vencimento: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data Início</Label>
                      <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                    </div>
                    <div>
                      <Label>Data Fim (opcional)</Label>
                      <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>URL de Acesso</Label>
                    <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !apps?.length ? (
          <p className="text-center text-muted-foreground py-8">Nenhum aplicativo contratado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aplicativo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app: any) => {
                  const st = statusConfig[app.status] || statusConfig.ativo;
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.nome}</p>
                          {app.descricao && <p className="text-xs text-muted-foreground">{app.descricao}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.categoria ? (
                          <Badge variant="outline">{app.categoria}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(app.valor_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>Dia {app.dia_vencimento}</TableCell>
                      <TableCell><Badge className={st.className}>{st.label}</Badge></TableCell>
                      <TableCell>
                        {app.url ? (
                          <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                            <ExternalLink className="h-3 w-3" /> Acessar
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(app)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este aplicativo?")) deleteMutation.mutate(app.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
