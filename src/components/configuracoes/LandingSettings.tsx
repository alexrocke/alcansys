import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff, Upload, Loader2 } from "lucide-react";
import { landingDefaults, sectionLabels } from "@/lib/landingContent";

interface LandingSection {
  id: string;
  section: string;
  config: Record<string, any>;
  order: number;
  visible: boolean;
}

const SECTION_ORDER = [
  "hero",
  "products",
  "services",
  "projects",
  "process",
  "diferenciais",
  "comparativo",
  "experiencia",
  "cta",
  "footer",
  "privacy",
  "terms",
];

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function uploadLandingAsset(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("landing-assets").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("landing-assets")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw signError || new Error("Falha ao gerar URL");
  return data.signedUrl;
}

function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLandingAsset(file);
      onChange(url);
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-14 w-14 rounded-lg object-contain border border-border bg-surface p-1"
          />
        ) : null}
        <div className="flex-1 space-y-2">
          <Input
            value={value || ""}
            placeholder="https://..."
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm cursor-pointer hover:border-primary/50 hover:text-primary transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar imagem
              </span>
            </label>
            {value ? (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
                Remover
              </Button>
            ) : null}
          </div>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function LandingSettings() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["landing-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_config").select("*").order("order");
      if (error) throw error;
      return data as unknown as LandingSection[];
    },
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      section,
      config,
      visible,
    }: {
      section: string;
      config: Record<string, any>;
      visible: boolean;
    }) => {
      const existing = sections?.find((s) => s.section === section);
      if (existing) {
        const { error } = await supabase
          .from("landing_config")
          .update({ config, visible })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("landing_config").insert({
          section,
          config,
          visible,
          order: SECTION_ORDER.indexOf(section),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-config"] });
      queryClient.invalidateQueries({ queryKey: ["landing-config-admin"] });
      toast.success("Seção atualizada!");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <>
      <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          Tudo que aparece na landing page, no rodapé e nas páginas de Política de Privacidade e
          Termos de Uso pode ser editado aqui. Campos deixados em branco voltam ao conteúdo padrão.
        </p>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        {SECTION_ORDER.map((key) => {
          const row = sections?.find((s) => s.section === key);
          return (
            <SectionEditor
              key={key}
              sectionKey={key}
              initialConfig={{ ...(landingDefaults[key] || {}), ...(row?.config || {}) }}
              initialVisible={row?.visible ?? true}
              onSave={(config, visible) => saveMutation.mutate({ section: key, config, visible })}
              saving={saveMutation.isPending}
            />
          );
        })}
      </Accordion>
    </>
  );
}

function SectionEditor({
  sectionKey,
  initialConfig,
  initialVisible,
  onSave,
  saving,
}: {
  sectionKey: string;
  initialConfig: Record<string, any>;
  initialVisible: boolean;
  onSave: (config: Record<string, any>, visible: boolean) => void;
  saving: boolean;
}) {
  const [config, setConfig] = useState<Record<string, any>>(initialConfig);
  const [visible, setVisible] = useState(initialVisible);

  return (
    <AccordionItem value={sectionKey} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full">
          <span className="font-medium">{sectionLabels[sectionKey] || sectionKey}</span>
          <span className="ml-auto mr-4">
            {visible ? (
              <Eye className="h-4 w-4 text-primary" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2 pb-4">
        {sectionKey !== "privacy" && sectionKey !== "terms" && sectionKey !== "footer" && (
          <div className="flex items-center gap-2">
            <Switch checked={visible} onCheckedChange={setVisible} />
            <Label>Seção visível na landing page</Label>
          </div>
        )}

        {sectionKey === "hero" && <HeroEditor config={config} onChange={setConfig} />}
        {sectionKey === "products" && <ProductsEditor config={config} onChange={setConfig} />}
        {sectionKey === "services" && <ServicesEditor config={config} onChange={setConfig} />}
        {sectionKey === "projects" && <ProjectsEditor config={config} onChange={setConfig} />}
        {sectionKey === "process" && <ProcessEditor config={config} onChange={setConfig} />}
        {sectionKey === "diferenciais" && <ItemsEditor config={config} onChange={setConfig} />}
        {sectionKey === "comparativo" && <ComparativoEditor config={config} onChange={setConfig} />}
        {sectionKey === "experiencia" && <ItemsEditor config={config} onChange={setConfig} />}
        {sectionKey === "cta" && <CtaEditor config={config} onChange={setConfig} />}
        {sectionKey === "footer" && <FooterEditor config={config} onChange={setConfig} />}
        {(sectionKey === "privacy" || sectionKey === "terms") && (
          <LegalEditor config={config} onChange={setConfig} />
        )}

        <Button onClick={() => onSave(config, visible)} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar seção
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

type EditorProps = { config: Record<string, any>; onChange: (c: Record<string, any>) => void };

function TitleFields({ config, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="text-xs">Título</Label>
        <Input value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Destaque (em laranja)</Label>
        <Input
          value={config.title_highlight || ""}
          onChange={(e) => onChange({ ...config, title_highlight: e.target.value })}
        />
      </div>
    </div>
  );
}

function HeroEditor({ config, onChange }: EditorProps) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });
  return (
    <div className="grid gap-4">
      <div>
        <Label className="text-xs">Selo (topo)</Label>
        <Input value={config.badge || ""} onChange={(e) => set("badge", e.target.value)} />
      </div>
      <TitleFields config={config} onChange={onChange} />
      <div>
        <Label className="text-xs">Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Frase de apoio</Label>
        <Input value={config.tagline || ""} onChange={(e) => set("tagline", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Botão primário</Label>
          <Input value={config.cta_primary || ""} onChange={(e) => set("cta_primary", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Botão secundário</Label>
          <Input value={config.cta_secondary || ""} onChange={(e) => set("cta_secondary", e.target.value)} />
        </div>
      </div>
      <ImageField
        label="Foto do hero"
        value={config.image_url}
        onChange={(url) => set("image_url", url)}
        hint="Deixe vazio para usar a foto padrão."
      />
    </div>
  );
}

function ProductsEditor({ config, onChange }: EditorProps) {
  const items = (config.items as any[]) || [];
  const update = (i: number, key: string, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, items: next });
  };
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Texto da faixa</Label>
        <Input value={config.label || ""} onChange={(e) => onChange({ ...config, label: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Produtos</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ ...config, items: [...items, { name: "Novo produto", logo_url: "" }] })}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {items.map((p: any, i: number) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Label className="text-xs">Nome</Label>
              <Input value={p.name || ""} onChange={(e) => update(i, "name", e.target.value)} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive mt-5"
              onClick={() => onChange({ ...config, items: items.filter((_, x) => x !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <ImageField label="Logo" value={p.logo_url} onChange={(url) => update(i, "logo_url", url)} />
        </Card>
      ))}
    </div>
  );
}

function ServicesEditor({ config, onChange }: EditorProps) {
  const cards = (config.cards as any[]) || [];
  const update = (i: number, key: string, val: string) => {
    const next = [...cards];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, cards: next });
  };
  return (
    <div className="space-y-4">
      <TitleFields config={config} onChange={onChange} />
      <div>
        <Label className="text-xs">Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Serviços</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ ...config, cards: [...cards, { title: "Novo serviço", body: "" }] })}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {cards.map((c: any, i: number) => (
        <Card key={i} className="p-4 flex items-start gap-3">
          <div className="grid gap-3 flex-1">
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={c.title || ""} onChange={(e) => update(i, "title", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={c.body || ""} onChange={(e) => update(i, "body", e.target.value)} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange({ ...config, cards: cards.filter((_, x) => x !== i) })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ProjectsEditor({ config, onChange }: EditorProps) {
  const items = (config.items as any[]) || [];
  const update = (i: number, key: string, val: any) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, items: next });
  };
  return (
    <div className="space-y-4">
      <TitleFields config={config} onChange={onChange} />
      <div>
        <Label className="text-xs">Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Projetos</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() =>
            onChange({
              ...config,
              items: [...items, { name: "Novo projeto", body: "", tags: [], logo_url: "", preview_url: "", link: "" }],
            })
          }
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {items.map((p: any, i: number) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Label className="text-xs">Nome do projeto</Label>
              <Input value={p.name || ""} onChange={(e) => update(i, "name", e.target.value)} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive mt-5"
              onClick={() => onChange({ ...config, items: items.filter((_, x) => x !== i) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={p.body || ""} onChange={(e) => update(i, "body", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input
                value={(p.tags || []).join(", ")}
                onChange={(e) =>
                  update(i, "tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Link do projeto (opcional)</Label>
              <Input value={p.link || ""} onChange={(e) => update(i, "link", e.target.value)} />
            </div>
          </div>
          <ImageField label="Logo do projeto" value={p.logo_url} onChange={(url) => update(i, "logo_url", url)} />
          <ImageField
            label="Preview do sistema (print da tela)"
            value={p.preview_url}
            onChange={(url) => update(i, "preview_url", url)}
            hint="Recomendado 16:10, ex.: 1600x1000px."
          />
        </Card>
      ))}
    </div>
  );
}

function ProcessEditor({ config, onChange }: EditorProps) {
  const steps = (config.steps as any[]) || [];
  const update = (i: number, key: string, val: string) => {
    const next = [...steps];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, steps: next });
  };
  return (
    <div className="space-y-4">
      <TitleFields config={config} onChange={onChange} />
      <div>
        <Label className="text-xs">Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Etapas</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ ...config, steps: [...steps, { step: "Nova etapa", body: "" }] })}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {steps.map((s: any, i: number) => (
        <Card key={i} className="p-4 flex items-start gap-3">
          <div className="grid gap-3 flex-1">
            <div>
              <Label className="text-xs">Etapa</Label>
              <Input value={s.step || ""} onChange={(e) => update(i, "step", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={s.body || ""} onChange={(e) => update(i, "body", e.target.value)} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange({ ...config, steps: steps.filter((_, x) => x !== i) })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ItemsEditor({ config, onChange }: EditorProps) {
  const items = (config.items as any[]) || [];
  const update = (i: number, key: string, val: string) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, items: next });
  };
  return (
    <div className="space-y-4">
      <TitleFields config={config} onChange={onChange} />
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Itens</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ ...config, items: [...items, { title: "Novo item", body: "" }] })}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {items.map((it: any, i: number) => (
        <Card key={i} className="p-4 flex items-start gap-3">
          <div className="grid gap-3 flex-1">
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={it.title || ""} onChange={(e) => update(i, "title", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={it.body || ""} onChange={(e) => update(i, "body", e.target.value)} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange({ ...config, items: items.filter((_, x) => x !== i) })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => onChange([...values, ""])}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={v}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive shrink-0"
            onClick={() => onChange(values.filter((_, x) => x !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function ComparativoEditor({ config, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <TitleFields config={config} onChange={onChange} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Título coluna esquerda</Label>
          <Input
            value={config.atual_title || ""}
            onChange={(e) => onChange({ ...config, atual_title: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-xs">Título coluna direita</Label>
          <Input
            value={config.scalefy_title || ""}
            onChange={(e) => onChange({ ...config, scalefy_title: e.target.value })}
          />
        </div>
      </div>
      <ListEditor
        label="Cenário atual"
        values={config.atual || []}
        onChange={(v) => onChange({ ...config, atual: v })}
      />
      <ListEditor
        label="Com a Scalefy"
        values={config.scalefy || []}
        onChange={(v) => onChange({ ...config, scalefy: v })}
      />
    </div>
  );
}

function CtaEditor({ config, onChange }: EditorProps) {
  return (
    <div className="grid gap-4">
      <TitleFields config={config} onChange={onChange} />
      <div>
        <Label className="text-xs">Subtítulo</Label>
        <Textarea value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Texto do botão</Label>
        <Input
          value={config.button_text || ""}
          onChange={(e) => onChange({ ...config, button_text: e.target.value })}
        />
      </div>
    </div>
  );
}

function FooterEditor({ config, onChange }: EditorProps) {
  const set = (key: string, val: string) => onChange({ ...config, [key]: val });
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Nome da empresa</Label>
          <Input value={config.company_name || ""} onChange={(e) => set("company_name", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">E-mail</Label>
          <Input value={config.email || ""} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Descrição curta</Label>
        <Textarea value={config.description || ""} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">URL do WhatsApp</Label>
          <Input value={config.whatsapp_url || ""} onChange={(e) => set("whatsapp_url", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Label do WhatsApp</Label>
          <Input value={config.whatsapp_label || ""} onChange={(e) => set("whatsapp_label", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function LegalEditor({ config, onChange }: EditorProps) {
  const sections = (config.sections as any[]) || [];
  const update = (i: number, key: string, val: string) => {
    const next = [...sections];
    next[i] = { ...next[i], [key]: val };
    onChange({ ...config, sections: next });
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Título da página</Label>
          <Input value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">Última atualização</Label>
          <Input value={config.updated || ""} onChange={(e) => onChange({ ...config, updated: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Introdução</Label>
        <Textarea value={config.intro || ""} onChange={(e) => onChange({ ...config, intro: e.target.value })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Cláusulas</Label>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onChange({ ...config, sections: [...sections, { heading: "Nova cláusula", body: "" }] })}
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {sections.map((s: any, i: number) => (
        <Card key={i} className="p-4 flex items-start gap-3">
          <div className="grid gap-3 flex-1">
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={s.heading || ""} onChange={(e) => update(i, "heading", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Texto</Label>
              <Textarea rows={4} value={s.body || ""} onChange={(e) => update(i, "body", e.target.value)} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onChange({ ...config, sections: sections.filter((_, x) => x !== i) })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
