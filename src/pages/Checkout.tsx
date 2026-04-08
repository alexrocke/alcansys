import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { CreditCard, QrCode, Plus, RefreshCw, ExternalLink, Copy, FileText, Package } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  approved: "bg-green-500/10 text-green-700 border-green-300",
  rejected: "bg-red-500/10 text-red-700 border-red-300",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-blue-500/10 text-blue-700 border-blue-300",
  authorized: "bg-green-500/10 text-green-700 border-green-300",
  paused: "bg-orange-500/10 text-orange-700 border-orange-300",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  authorized: "Autorizado",
  paused: "Pausado",
  charged_back: "Estornado",
};

export default function Checkout() {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [pixDialog, setPixDialog] = useState<{ qr: string; qrBase64: string } | null>(null);

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("company_id", currentCompany!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["subscriptions", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("company_id", currentCompany!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentCompany?.id,
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Checkout & Pagamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie cobranças e assinaturas via Mercado Pago</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Pagamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Criar Pagamento</DialogTitle></DialogHeader>
              <PaymentForm companyId={currentCompany?.id || ""} onSuccess={() => {
                setShowPaymentDialog(false);
                queryClient.invalidateQueries({ queryKey: ["payments"] });
              }} onPixGenerated={(qr, qrBase64) => {
                setShowPaymentDialog(false);
                setPixDialog({ qr, qrBase64 });
              }} />
            </DialogContent>
          </Dialog>
          <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
            <DialogTrigger asChild>
              <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Nova Assinatura</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Criar Assinatura</DialogTitle></DialogHeader>
              <SubscriptionForm companyId={currentCompany?.id || ""} onSuccess={() => {
                setShowSubDialog(false);
                queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* PIX QR Dialog */}
      <Dialog open={!!pixDialog} onOpenChange={() => setPixDialog(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle className="flex items-center justify-center gap-2"><QrCode className="h-5 w-5" /> Pague com Pix</DialogTitle></DialogHeader>
          {pixDialog?.qrBase64 && (
            <img src={`data:image/png;base64,${pixDialog.qrBase64}`} alt="QR Code Pix" className="mx-auto w-64 h-64 rounded-lg" />
          )}
          {pixDialog?.qr && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Ou copie o código Pix:</p>
              <div className="flex gap-2">
                <Input value={pixDialog.qr} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(pixDialog.qr);
                  toast({ title: "Código copiado!" });
                }}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />Pagamentos
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />Assinaturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>Cobranças avulsas via Pix, Cartão ou Boleto</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !payments?.length ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum pagamento criado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{p.descricao}</TableCell>
                          <TableCell>R$ {Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="capitalize">{p.method || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[p.status] || ""}>
                              {statusLabels[p.status] || p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yy HH:mm")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {p.pix_qr_code && (
                                <Button size="icon" variant="ghost" onClick={() => setPixDialog({ qr: p.pix_qr_code!, qrBase64: p.pix_qr_code_base64 || "" })}>
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              )}
                              {p.boleto_url && (
                                <Button size="icon" variant="ghost" asChild>
                                  <a href={p.boleto_url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /></a>
                                </Button>
                              )}
                              {p.metadata && (p.metadata as any)?.init_point && (
                                <Button size="icon" variant="ghost" asChild>
                                  <a href={(p.metadata as any).init_point} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas</CardTitle>
              <CardDescription>Cobranças recorrentes mensais ou anuais</CardDescription>
            </CardHeader>
            <CardContent>
              {subsLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !subscriptions?.length ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma assinatura criada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagador</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.plan_name}</TableCell>
                          <TableCell>R$ {Number(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{s.frequency === "yearly" ? "Anual" : "Mensal"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[s.status] || ""}>
                              {statusLabels[s.status] || s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{s.payer_email || "-"}</TableCell>
                          <TableCell>
                            {s.init_point && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={s.init_point} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-1" />Link
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function useItemsCatalog(companyId: string) {
  const { data: products = [] } = useQuery({
    queryKey: ["products-catalog", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, nome, preco, categoria").eq("ativo", true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-catalog", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, nome, preco_base, categoria").eq("ativo", true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates-catalog", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("workflow_templates").select("id, nome, preco, categoria").eq("ativo", true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: combos = [] } = useQuery({
    queryKey: ["combos-catalog", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_combos")
        .select("id, nome, preco_original, preco_combo, descricao")
        .eq("ativo", true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const allItems = [
    ...combos.map((c: any) => ({
      id: c.id,
      label: c.nome,
      price: c.preco_combo,
      group: "Combo",
    })),
    ...products.map((p: any) => ({ id: p.id, label: p.nome, price: p.preco, group: "Produto" })),
    ...services.map((s: any) => ({ id: s.id, label: s.nome, price: s.preco_base, group: "Serviço" })),
    ...templates.map((t: any) => ({ id: t.id, label: t.nome, price: t.preco, group: "Automação" })),
  ];

  return allItems;
}

function PaymentForm({ companyId, onSuccess, onPixGenerated }: {
  companyId: string;
  onSuccess: () => void;
  onPixGenerated: (qr: string, qrBase64: string) => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [method, setMethod] = useState("pix");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const items = useItemsCatalog(companyId);

  const handleItemSelect = (itemId: string) => {
    if (itemId === "custom") {
      setDescricao("");
      setValor("");
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setDescricao(item.label);
      setValor(item.price ? String(item.price) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("mp-create-payment", {
        body: {
          company_id: companyId,
          valor: parseFloat(valor),
          descricao,
          method,
          payer_email: payerEmail || undefined,
          payer_name: payerName || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (method === "pix" && data?.payment?.pix_qr_code) {
        onPixGenerated(data.payment.pix_qr_code, data.payment.pix_qr_code_base64 || "");
        toast({ title: "Pix gerado com sucesso!" });
      } else if (method === "credit_card" && data?.init_point) {
        window.open(data.init_point, "_blank");
        toast({ title: "Checkout aberto em nova aba" });
        onSuccess();
      } else if (method === "boleto" && data?.payment?.boleto_url) {
        window.open(data.payment.boleto_url, "_blank");
        toast({ title: "Boleto gerado!" });
        onSuccess();
      } else {
        toast({ title: "Pagamento criado!" });
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao criar pagamento", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="flex items-center gap-1.5 mb-1.5"><Package className="h-3.5 w-3.5" />Selecionar Item</Label>
        <Select onValueChange={handleItemSelect}>
          <SelectTrigger><SelectValue placeholder="Escolha um item do catálogo..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Personalizado</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}{item.price ? ` — R$ ${Number(item.price).toFixed(2)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Separator className="mt-3" />
      </div>
      <div><Label>Descrição *</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required /></div>
      <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" min="1" value={valor} onChange={(e) => setValor(e.target.value)} required /></div>
      <div>
        <Label>Método *</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Email do Pagador</Label><Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} /></div>
      <div><Label>Nome do Pagador</Label><Input value={payerName} onChange={(e) => setPayerName(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar Pagamento"}
      </Button>
    </form>
  );
}

function SubscriptionForm({ companyId, onSuccess }: { companyId: string; onSuccess: () => void }) {
  const [planName, setPlanName] = useState("");
  const [valor, setValor] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerName, setPayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const items = useItemsCatalog(companyId);

  const handleItemSelect = (itemId: string) => {
    if (itemId === "custom") {
      setPlanName("");
      setValor("");
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setPlanName(item.label);
      setValor(item.price ? String(item.price) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !valor || !payerEmail) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
        body: {
          company_id: companyId,
          plan_name: planName,
          valor: parseFloat(valor),
          frequency,
          payer_email: payerEmail,
          payer_name: payerName || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.init_point) {
        window.open(data.init_point, "_blank");
      }
      toast({ title: "Assinatura criada!" });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao criar assinatura", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="flex items-center gap-1.5 mb-1.5"><Package className="h-3.5 w-3.5" />Selecionar Item</Label>
        <Select onValueChange={handleItemSelect}>
          <SelectTrigger><SelectValue placeholder="Escolha um item do catálogo..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Personalizado</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}{item.price ? ` — R$ ${Number(item.price).toFixed(2)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Separator className="mt-3" />
      </div>
      <div><Label>Nome do Plano *</Label><Input value={planName} onChange={(e) => setPlanName(e.target.value)} required /></div>
      <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" min="1" value={valor} onChange={(e) => setValor(e.target.value)} required /></div>
      <div>
        <Label>Frequência</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Email do Pagador *</Label><Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} required /></div>
      <div><Label>Nome do Pagador</Label><Input value={payerName} onChange={(e) => setPayerName(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar Assinatura"}
      </Button>
    </form>
  );
}
