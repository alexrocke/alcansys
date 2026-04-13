import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Eye, EyeOff, KeyRound, ExternalLink, Copy, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "rede_social", label: "Rede Social" },
  { value: "aplicativo", label: "Aplicativo" },
  { value: "email", label: "E-mail" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "dominio", label: "Domínio" },
  { value: "outro", label: "Outro" },
];

const categoryColors: Record<string, string> = {
  rede_social: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  aplicativo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  email: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hospedagem: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  dominio: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface CredentialForm {
  id?: string;
  categoria: string;
  nome: string;
  usuario: string;
  senha: string;
  url: string;
  notas: string;
}

type CredentialCategory = "rede_social" | "aplicativo" | "email" | "hospedagem" | "dominio" | "outro";
const emptyForm: CredentialForm = { categoria: "outro", nome: "", usuario: "", senha: "", url: "", notas: "" };

export function CredentialsManager() {
  const { currentCompany } = useCompany();
  const { userRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CredentialForm>(emptyForm);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [accessDialogCred, setAccessDialogCred] = useState<any>(null);

  const isAdmin = userRole === "admin";

  const { data: credentials, isLoading } = useQuery({
    queryKey: ["company-credentials", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from("company_credentials")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany,
  });

  // Fetch team members for access management
  const { data: teamMembers } = useQuery({
    queryKey: ["team-members-for-access", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany) return [];
      const { data, error } = await supabase
        .from("memberships")
        .select("user_id, role, profiles(id, nome, email)")
        .eq("company_id", currentCompany.id);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        nome: m.profiles?.nome || "Sem nome",
        email: m.profiles?.email || "",
      }));
    },
    enabled: !!currentCompany && isAdmin,
  });

  // Fetch access grants for the selected credential
  const { data: accessGrants } = useQuery({
    queryKey: ["credential-access", accessDialogCred?.id],
    queryFn: async () => {
      if (!accessDialogCred) return [];
      const { data, error } = await supabase
        .from("credential_access")
        .select("*")
        .eq("credential_id", accessDialogCred.id);
      if (error) throw error;
      return data;
    },
    enabled: !!accessDialogCred,
  });

  const saveMutation = useMutation({
    mutationFn: async (cred: CredentialForm) => {
      if (!currentCompany) throw new Error("Sem empresa");
      const payload = {
        company_id: currentCompany.id,
        categoria: cred.categoria as CredentialCategory,
        nome: cred.nome,
        usuario: cred.usuario || null,
        senha_encrypted: cred.senha || null,
        url: cred.url || null,
        notas: cred.notas || null,
      };
      if (cred.id) {
        const { error } = await supabase.from("company_credentials").update(payload).eq("id", cred.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_credentials").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-credentials"] });
      toast.success("Credencial salva com sucesso!");
      setOpen(false);
      setForm(emptyForm);
    },
    onError: () => toast.error("Erro ao salvar credencial"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-credentials"] });
      toast.success("Credencial removida");
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async ({ credentialId, userId, grant }: { credentialId: string; userId: string; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase.from("credential_access").insert({
          credential_id: credentialId,
          user_id: userId,
          granted_by: user?.id || null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("credential_access")
          .delete()
          .eq("credential_id", credentialId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credential-access"] });
      toast.success("Acesso atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar acesso"),
  });

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const openEdit = (cred: any) => {
    setForm({
      id: cred.id, categoria: cred.categoria, nome: cred.nome,
      usuario: cred.usuario || "", senha: cred.senha_encrypted || "",
      url: cred.url || "", notas: cred.notas || "",
    });
    setOpen(true);
  };

  const filtered = (credentials || []).filter(
    (c: any) =>
      c.nome.toLowerCase().includes(filter.toLowerCase()) ||
      c.categoria.toLowerCase().includes(filter.toLowerCase())
  );

  const grantedUserIds = new Set((accessGrants || []).map((a: any) => a.user_id));
  // Filter out current admin from the access list
  const assignableMembers = (teamMembers || []).filter((m: any) => m.user_id !== user?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Credenciais & Logins
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? "Gerencie credenciais e controle quais funcionários têm acesso a cada login."
                : "Visualize os logins que foram liberados para você pelo administrador."}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Nova Credencial</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{form.id ? "Editar Credencial" : "Nova Credencial"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome do Serviço *</Label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Instagram, Google Ads" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Usuário / Login</Label>
                      <Input value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                      <Label>Senha</Label>
                      <Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="••••••••" />
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Buscar credencial..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm mb-4"
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !filtered.length ? (
          <p className="text-center text-muted-foreground py-8">
            {isAdmin ? "Nenhuma credencial cadastrada." : "Nenhuma credencial liberada para você."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cred: any) => (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium">{cred.nome}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[cred.categoria] || categoryColors.outro}>
                        {CATEGORIES.find((c) => c.value === cred.categoria)?.label || cred.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cred.usuario ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{cred.usuario}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.usuario, "Usuário")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      {cred.senha_encrypted ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-mono">
                            {visiblePasswords.has(cred.id) ? cred.senha_encrypted : "••••••••"}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePassword(cred.id)}>
                            {visiblePasswords.has(cred.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.senha_encrypted, "Senha")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      {cred.url ? (
                        <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                          <ExternalLink className="h-3 w-3" /> Acessar
                        </a>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" title="Gerenciar acessos" onClick={() => setAccessDialogCred(cred)}>
                              <Users className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(cred)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir esta credencial?")) deleteMutation.mutate(cred.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Access management dialog */}
        <Dialog open={!!accessDialogCred} onOpenChange={(v) => { if (!v) setAccessDialogCred(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Acessos: {accessDialogCred?.nome}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione quais funcionários podem visualizar este login.
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {!assignableMembers.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro da equipe encontrado.</p>
              ) : (
                assignableMembers.map((member: any) => {
                  const hasAccess = grantedUserIds.has(member.user_id);
                  return (
                    <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={hasAccess}
                          onCheckedChange={(checked) => {
                            if (accessDialogCred) {
                              toggleAccessMutation.mutate({
                                credentialId: accessDialogCred.id,
                                userId: member.user_id,
                                grant: !!checked,
                              });
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">{member.nome}</p>
                          <p className="text-xs text-muted-foreground">{member.email} • {member.role}</p>
                        </div>
                      </div>
                      {hasAccess && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                          Liberado
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
