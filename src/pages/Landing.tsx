import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import { getLucideIcon } from "@/lib/lucide-icon-map";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { data: sections } = useLandingConfig();

  // Force dark theme on the public landing page — Amber Noir signature.
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  if (session) return null;

  const getSection = (name: string) => sections?.find((s) => s.section === name);
  const hero = getSection("hero");
  const stats = getSection("stats");
  const cta = getSection("cta");
  const footer = getSection("footer");

  const heroConfig = hero?.config || {
    title: "Tecnologia que faz seu negócio",
    title_highlight: "crescer",
    subtitle:
      "Sistemas sob medida, automações inteligentes e páginas de alta conversão. Operação enxuta, resultado que aparece no caixa.",
    cta_primary: "Solicitar orçamento",
    cta_secondary: "Ver serviços",
  };

  const statsConfig = stats?.config || {
    items: [
      { icon: "Users", value: "150+", label: "Clientes ativos" },
      { icon: "Zap", value: "500+", label: "Automações rodando" },
      { icon: "BarChart3", value: "320%", label: "ROI médio" },
    ],
  };

  const ctaConfig = cta?.config || {
    title: "Pronto para transformar seu negócio?",
    subtitle: "Comece agora e veja resultado em poucos dias.",
    button_text: "Criar conta grátis",
  };

  const footerConfig = footer?.config || {
    email: "contato@scalefy.com.br",
    whatsapp_url: "https://wa.me/5500000000000",
    whatsapp_label: "WhatsApp",
  };

  const services = [
    {
      n: "01",
      title: "Sistemas sob medida",
      body: "CRM, ERP e painéis internos desenhados para o jeito que sua empresa opera — não o contrário.",
    },
    {
      n: "02",
      title: "Automações inteligentes",
      body: "Rotinas manuais viram fluxos que rodam sozinhos, integrados aos canais que você já usa.",
    },
    {
      n: "03",
      title: "Landing pages que vendem",
      body: "Páginas de alta conversão, com copy afiada e performance de verdade — mensuradas de ponta a ponta.",
    },
    {
      n: "04",
      title: "IA aplicada ao negócio",
      body: "Atendimento, qualificação e análise com IA sob curadoria humana. Sem promessa mágica — só resultado.",
    },
  ];

  const process = [
    { step: "Descoberta", body: "Mergulhamos no seu processo antes de propor qualquer linha de código." },
    { step: "Desenho", body: "Arquitetura e protótipos revisados com você. Nada de surpresa depois." },
    { step: "Construção", body: "Ciclos curtos, entregas visíveis toda semana. Você acompanha em tempo real." },
    { step: "Operação", body: "Depois do go-live seguimos junto — monitoramento, ajustes e evolução contínua." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <LandingHeader />

      {/* ============ HERO — Split-screen editorial ============ */}
      {hero?.visible !== false && (
        <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-6 md:px-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-16 items-center">
            {/* Left — editorial title */}
            <div className="md:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Scalefy · Software & automação
              </div>

              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
                {heroConfig.title}{" "}
                <em className="not-italic text-gradient-ember">
                  {heroConfig.title_highlight}
                </em>
                .
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                {heroConfig.subtitle}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember"
                >
                  {heroConfig.cta_primary} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 border-border bg-transparent hover:bg-surface font-medium tracking-wide"
                  onClick={() => document.getElementById("servicos")?.scrollIntoView({ behavior: "smooth" })}
                >
                  {heroConfig.cta_secondary}
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-6 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-background bg-gradient-ember"
                      style={{ opacity: 1 - i * 0.15 }}
                    />
                  ))}
                </div>
                <span>+150 operações rodando com Scalefy</span>
              </div>
            </div>

            {/* Right — abstract editorial visual */}
            <div className="md:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-noir border border-border shadow-noir">
                {/* Ember glow */}
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/40 blur-[100px]" />
                <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-accent/30 blur-[90px]" />

                {/* Typographic composition */}
                <div className="relative h-full flex flex-col justify-between p-8">
                  <div className="flex items-start justify-between text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    <span>Índice</span>
                    <span>2026 / 01</span>
                  </div>

                  <div className="space-y-6">
                    <div className="font-display text-[7rem] md:text-[9rem] leading-[0.85] text-gradient-ember">
                      01
                    </div>
                    <div className="space-y-2 border-t border-border/50 pt-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Capítulo</div>
                      <div className="font-display text-2xl">Software que trabalha por você.</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" /> Editorial
                    </span>
                    <span>ALCANSYS ©</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ Prova social ============ */}
      <section className="border-y border-border bg-surface/50 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-wrap items-center justify-between gap-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <span>Confiança de operações que valem</span>
          <div className="flex flex-wrap gap-8 md:gap-12 font-display text-lg text-foreground/60">
            <span>Nordeste Tech</span>
            <span>Alcance+</span>
            <span>Coppertown</span>
            <span>Vialume</span>
            <span>Rota 41</span>
          </div>
        </div>
      </section>

      {/* ============ Serviços — Zigzag editorial ============ */}
      <section id="servicos" className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-6 mb-16">
            <div className="md:col-span-4">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Serviços</div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight">
                O que construímos <em className="text-gradient-ember not-italic">para você</em>.
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 flex items-end">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Quatro frentes, uma mesma obsessão: reduzir atrito e devolver tempo para
                quem toca o negócio. Sem jargão, sem tecnologia por moda.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {services.map((s, i) => (
              <div
                key={s.n}
                className="group relative bg-background hover:bg-surface transition-colors p-8 md:p-10 min-h-[280px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-6xl md:text-7xl text-primary/80 group-hover:text-primary transition-colors">
                    {s.n}
                  </span>
                  <ArrowUpRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-display text-2xl md:text-3xl">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Processo — split-screen ============ */}
      <section id="processo" className="py-24 md:py-32 px-6 md:px-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-5 md:sticky md:top-32 self-start space-y-6">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Processo</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Quatro passos, <em className="text-gradient-ember not-italic">sem drama</em>.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Trabalhamos em ciclos curtos e transparentes. Você vê o que está sendo
              construído toda semana — e decide o rumo com a gente.
            </p>
          </div>

          <div className="md:col-span-7 space-y-px bg-border rounded-2xl overflow-hidden border border-border">
            {process.map((p, i) => (
              <div key={p.step} className="bg-background p-8 md:p-10 flex gap-8 items-start">
                <div className="font-display text-3xl text-primary shrink-0 w-14">
                  0{i + 1}
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl">{p.step}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Números ============ */}
      {stats?.visible !== false && (
        <section id="numeros" className="py-24 md:py-32 px-6 md:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3 text-center">Resultados</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-center mb-16 max-w-3xl mx-auto">
              Números que a gente <em className="text-gradient-ember not-italic">mostra</em>.
            </h2>
            <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
              {(statsConfig.items as any[]).map((stat: any) => {
                const Icon = getLucideIcon(stat.icon);
                return (
                  <div
                    key={stat.label}
                    className="bg-background p-10 md:p-12 text-center space-y-4"
                  >
                    <Icon className="w-6 h-6 mx-auto text-primary" />
                    <p className="font-display text-6xl md:text-7xl text-gradient-ember">{stat.value}</p>
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ CTA final ============ */}
      {cta?.visible !== false && (
        <section className="py-24 md:py-32 px-6 md:px-10">
          <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-noir border border-border p-12 md:p-20 text-center shadow-noir">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="relative space-y-8">
              <div className="text-xs uppercase tracking-[0.25em] text-primary">Vamos conversar</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl mx-auto">
                {ctaConfig.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {ctaConfig.subtitle}
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember text-base"
              >
                {ctaConfig.button_text} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ============ Footer ============ */}
      {footer?.visible !== false && (
        <footer id="contato" className="border-t border-border py-12 px-6 md:px-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="font-display text-2xl">Scalefy</div>
              <p className="text-sm text-muted-foreground mt-1">
                © {new Date().getFullYear()} Scalefy. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-muted-foreground">
              <a href={`mailto:${footerConfig.email}`} className="hover:text-primary transition-colors">
                {footerConfig.email}
              </a>
              <a
                href={footerConfig.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {footerConfig.whatsapp_label}
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
