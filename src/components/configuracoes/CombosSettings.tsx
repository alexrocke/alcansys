import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Percent } from "lucide-react";

export function CombosSettings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["automation-combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_combos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: comboItems = [] } = useQuery({
    queryKey: ["automation-combo-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_combo_items")
        .select("*, workflow_templates:template_id(id, nome, categoria)");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-combos"] });
      queryClient.invalidateQueries({ queryKey: ["automation-combo-items"] });
      toast({ title: "Combo excluído!" });
    },
  });

  const getComboTemplates = (comboId: string) =>
    comboItems.filter((item: any) => item.combo_id === comboId);

  const getDiscount = (original: number, combo: number) => {
    if (!original || original <= 0) return 0;
    return Math.round(((original - combo) / original) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Crie pacotes de automações com preços promocionais
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCombo(null);
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Combo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCombo ? "Editar Combo" : "Novo Combo"}</DialogTitle>
            </DialogHeader>
            <ComboForm
              combo={editingCombo}
              onSuccess={() => {
                setDialogOpen(false);
                setEditingCombo(null);
                queryClient.invalidateQueries({ queryKey: ["automation-combos"] });
                queryClient.invalidateQueries({ queryKey: ["automation-combo-items"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !combos.length ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum combo criado.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {combos.map((combo: any) => {
            const templates = getComboTemplates(combo.id);
            const discount = getDiscount(combo.preco_original, combo.preco_combo);
            return (
              <Card key={combo.id} className={!combo.ativo ? "opacity-60" : ""}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {combo.nome}
                      </h3>
                      {combo.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">{combo.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => {
                        setEditingCombo(combo);
                        setDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(combo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm line-through text-muted-foreground">
                      R$ {Number(combo.preco_original).toFixed(2)}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      R$ {Number(combo.preco_combo).toFixed(2)}
                    </span>
                    {discount > 0 && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                        <Percent className="h-3 w-3 mr-1" />{discount}% OFF
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {templates.map((item: any) => (
                      <Badge key={item.id} variant="outline" className="text-xs">
                        {(item as any).workflow_templates?.nome || "Template"}
                      </Badge>
                    ))}
                    {!templates.length && (
                      <span className="text-xs text-muted-foreground">Nenhum template vinculado</span>
                    )}
                  </div>

                  <Badge variant={combo.ativo ? "default" : "secondary"}>
                    {combo.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ComboForm({ combo, onSuccess }: { combo?: any; onSuccess: () => void }) {
  const [nome, setNome] = useState(combo?.nome || "");
  const [descricao, setDescricao] = useState(combo?.descricao || "");
  const [precoOriginal, setPrecoOriginal] = useState(combo?.preco_original?.toString() || "");
  const [precoCombo, setPrecoCombo] = useState(combo?.preco_combo?.toString() || "");
  const [ativo, setAtivo] = useState(combo?.ativo ?? true);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["workflow-templates-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_templates")
        .select("id, nome, categoria, preco")
        .order("categoria");
      if (error) throw error;
      return data;
    },
  });

  // Load existing combo items
  useQuery({
    queryKey: ["combo-items-edit", combo?.id],
    queryFn: async () => {
      if (!combo?.id) return [];
      const { data, error } = await supabase
        .from("automation_combo_items")
        .select("template_id")
        .eq("combo_id", combo.id);
      if (error) throw error;
      setSelectedTemplates(data.map((d: any) => d.template_id));
      return data;
    },
    enabled: !!combo?.id,
  });

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      // Auto-calculate original price
      const total = templates
        .filter((t: any) => next.includes(t.id))
        .reduce((sum: number, t: any) => sum + (t.preco || 0), 0);
      setPrecoOriginal(total.toFixed(2));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !precoCombo || !selectedTemplates.length) {
      toast({ title: "Preencha nome, preço e selecione templates", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      let comboId = combo?.id;

      if (combo?.id) {
        const { error } = await supabase
          .from("automation_combos")
          .update({ nome, descricao, preco_original: parseFloat(precoOriginal), preco_combo: parseFloat(precoCombo), ativo })
          .eq("id", combo.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("automation_combos")
          .insert({ nome, descricao, preco_original: parseFloat(precoOriginal || "0"), preco_combo: parseFloat(precoCombo), ativo })
          .select("id")
          .single();
        if (error) throw error;
        comboId = data.id;
      }

      // Sync combo items
      await supabase.from("automation_combo_items").delete().eq("combo_id", comboId);
      if (selectedTemplates.length) {
        const items = selectedTemplates.map((tid) => ({ combo_id: comboId, template_id: tid }));
        const { error } = await supabase.from("automation_combo_items").insert(items);
        if (error) throw error;
      }

      toast({ title: combo ? "Combo atualizado!" : "Combo criado!" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
      <div><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} /></div>

      <div>
        <Label className="mb-2 block">Automações do Combo *</Label>
        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
          {templates.map((t: any) => (
            <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
              <Checkbox
                checked={selectedTemplates.includes(t.id)}
                onCheckedChange={() => toggleTemplate(t.id)}
              />
              <span className="text-sm flex-1">{t.nome}</span>
              <Badge variant="outline" className="text-xs">{t.categoria}</Badge>
              {t.preco && <span className="text-xs text-muted-foreground">R$ {Number(t.preco).toFixed(2)}</span>}
            </label>
          ))}
        </div>
        {selectedTemplates.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedTemplates.length} selecionados — Total: R$ {precoOriginal || "0.00"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Preço Original (R$)</Label><Input type="number" step="0.01" value={precoOriginal} onChange={(e) => setPrecoOriginal(e.target.value)} /></div>
        <div><Label>Preço Combo (R$) *</Label><Input type="number" step="0.01" min="0" value={precoCombo} onChange={(e) => setPrecoCombo(e.target.value)} required /></div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={ativo} onCheckedChange={setAtivo} />
        <Label>Combo ativo</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : combo ? "Atualizar" : "Criar Combo"}
      </Button>
    </form>
  );
}
