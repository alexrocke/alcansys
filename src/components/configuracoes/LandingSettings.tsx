import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { availableIcons, getLucideIcon } from "@/lib/lucide-icon-map";

interface LandingSection {
  id: string;
  section: string;
  config: Record<string, any>;
  order: number;
  visible: boolean;
}

export function LandingSettings() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["landing-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_config")
        .select("*")
        .order("order");
      if (error) throw error;
      return data as LandingSection[];
    },
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, config, visible }: { id: string; config: Record<string, any>; visible: boolean }) => {
      const { error } = await supabase
        .from("landing_config")
        .update({ config, visible })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-config"] });
      queryClient.invalidateQueries({ queryKey: ["landing-config-admin"] });
      toast.success("Seção atualizada!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <Accordion type="multiple" className="space-y-4">
      {sections?.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          onSave={(config, visible) =>
            updateMutation.mutate({ id: section.id, config, visible })
          }
          saving={updateMutation.isPending}
        />
      ))}
    </Accordion>
  );
}

function SectionEditor({
  section,
  onSave,
  saving,
}: {
  section: LandingSection;
  onSave: (config: Record<string, any>, visible: boolean) => void;
  saving: boolean;
}) {
  const [config, setConfig] = useState<Record<string, any>>(section.config);
  const [visible, setVisible] = useState(section.visible);

  const sectionLabels: Record<string, string> = {
    hero: "🏠 Hero (Cabeçalho)",
    services: "⚡ Serviços (Cards)",
    stats: "📊 Números / Resultados",
    cta: "🎯 CTA (Chamada para ação)",
    footer: "📋 Rodapé",
  };

  return (
    <AccordionItem value={section.section} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <span className="font-medium">{sectionLabels[section.section] || section.section}</span>
          <span className="ml-auto mr-4">
            {visible ? (
              <Eye className="h-4 w-4 text-green-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Switch checked={visible} onCheckedChange={setVisible} />
          <Label>Seção visível</Label>
        </div>

        {section.section === "hero" && (
          <HeroEditor config={config} onChange={setConfig} />
        )}
        {section.section === "services" && (
          <ServicesEditor config={config} onChange={setConfig} />
        )}
        {section.section === "stats" && (
          <StatsEditor config={config} onChange={setConfig} />
        )}
        {section.section === "cta" && (
          <CtaEditor config={config} onChange={setConfig} />
        )}
        {section.section === "footer" && (
          <FooterEditor config={config} onChange={setConfig} />
        )}

        <Button
          onClick={() => onSave(config, visible)}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar seção
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

function HeroEditor({ config, onChange }: { config: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });
  return (
    <div className="grid gap-4">
      <div>
        <Label>Título</Label>
        <Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <Label>Palavra destaque</Label>
        <Input value={config.title_highlight || ""} onChange={(e) => set("title_highlight", e.target.value)} />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>
      <div>
        <Label>URL da cena Spline</Label>
        <Input value={config.spline_url || ""} onChange={(e) => set("spline_url", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Botão primário</Label>
          <Input value={config.cta_primary || ""} onChange={(e) => set("cta_primary", e.target.value)} />
        </div>
        <div>
          <Label>Botão secundário</Label>
          <Input value={config.cta_secondary || ""} onChange={(e) => set("cta_secondary", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ServicesEditor({ config, onChange }: { config: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const cards = (config.cards as any[]) || [];

  const updateCard = (index: number, key: string, val: string) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [key]: val };
    onChange({ ...config, cards: updated });
  };

  const addCard = () => {
    onChange({
      ...config,
      cards: [...cards, { icon: "Sparkles", title: "Novo Serviço", description: "Descrição do serviço", subtitle: "Detalhes" }],
    });
  };

  const removeCard = (index: number) => {
    onChange({ ...config, cards: cards.filter((_: any, i: number) => i !== index) });
  };

  const paddingX = config.card_padding_x ?? 24;
  const paddingY = config.card_padding_y ?? 24;
  const spacingX = config.card_spacing_x ?? 80;
  const spacingY = config.card_spacing_y ?? 48;

  return (
    <div className="space-y-4">
      <div>
        <Label>Título da seção</Label>
        <Input value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <Label>Subtítulo da seção</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} />
      </div>

      <Card className="p-4 space-y-4">
        <Label className="text-base font-semibold">Tamanho e Espaçamento dos Cards</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Padding Horizontal (px)</Label>
            <Input
              type="number"
              min={8}
              max={64}
              value={paddingX}
              onChange={(e) => onChange({ ...config, card_padding_x: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Padding Vertical (px)</Label>
            <Input
              type="number"
              min={8}
              max={64}
              value={paddingY}
              onChange={(e) => onChange({ ...config, card_padding_y: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Espaçamento Lateral (px)</Label>
            <Input
              type="number"
              min={0}
              max={160}
              value={spacingX}
              onChange={(e) => onChange({ ...config, card_spacing_x: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Espaçamento Vertical (px)</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={spacingY}
              onChange={(e) => onChange({ ...config, card_spacing_y: Number(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Cards de Serviço</Label>
          <Button variant="outline" size="sm" onClick={addCard} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
        {cards.map((card: any, i: number) => {
          const Icon = getLucideIcon(card.icon);
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-4">
                <Icon className="h-5 w-5 mt-2 text-primary shrink-0" />
                <div className="grid gap-3 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Título</Label>
                      <Input value={card.title || ""} onChange={(e) => updateCard(i, "title", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Ícone</Label>
                      <Select value={card.icon || "Sparkles"} onValueChange={(v) => updateCard(i, "icon", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {availableIcons.map((icon) => (
                            <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Input value={card.description || ""} onChange={(e) => updateCard(i, "description", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Subtítulo</Label>
                    <Input value={card.subtitle || ""} onChange={(e) => updateCard(i, "subtitle", e.target.value)} />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCard(i)} className="text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatsEditor({ config, onChange }: { config: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const items = (config.items as any[]) || [];

  const updateItem = (index: number, key: string, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: val };
    onChange({ ...config, items: updated });
  };

  const addItem = () => {
    onChange({ ...config, items: [...items, { icon: "Star", value: "0", label: "Nova métrica" }] });
  };

  const removeItem = (index: number) => {
    onChange({ ...config, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Métricas</Label>
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {items.map((item: any, i: number) => (
        <div key={i} className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-xs">Ícone</Label>
            <Select value={item.icon || "Star"} onValueChange={(v) => updateItem(i, "icon", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Valor</Label>
            <Input value={item.value || ""} onChange={(e) => updateItem(i, "value", e.target.value)} />
          </div>
          <div className="flex-[2]">
            <Label className="text-xs">Label</Label>
            <Input value={item.label || ""} onChange={(e) => updateItem(i, "label", e.target.value)} />
          </div>
          <Button variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function CtaEditor({ config, onChange }: { config: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });
  return (
    <div className="grid gap-4">
      <div>
        <Label>Título</Label>
        <Input value={config.title || ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>
      <div>
        <Label>Texto do botão</Label>
        <Input value={config.button_text || ""} onChange={(e) => set("button_text", e.target.value)} />
      </div>
    </div>
  );
}

function FooterEditor({ config, onChange }: { config: Record<string, any>; onChange: (c: Record<string, any>) => void }) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });
  return (
    <div className="grid gap-4">
      <div>
        <Label>Email</Label>
        <Input value={config.email || ""} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <Label>URL do WhatsApp</Label>
        <Input value={config.whatsapp_url || ""} onChange={(e) => set("whatsapp_url", e.target.value)} />
      </div>
      <div>
        <Label>Label do WhatsApp</Label>
        <Input value={config.whatsapp_label || ""} onChange={(e) => set("whatsapp_label", e.target.value)} />
      </div>
    </div>
  );
}
