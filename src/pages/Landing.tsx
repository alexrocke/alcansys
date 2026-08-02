import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { MobileCtaBar } from "@/components/landing/MobileCtaBar";
import { useLandingContent } from "@/hooks/useLandingContent";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import heroAlex from "@/assets/hero-alex.webp";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const content = useLandingContent();
  const [showAllProjects, setShowAllProjects] = useState(false);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  // Rola até a seção quando a URL chega com hash (ex: /#projetos)
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const t = setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
    return () => clearTimeout(t);
  }, []);

  if (session) return null;

  const hero = content.get("hero");
  const products = content.get("products");
  const services = content.get("services");
  const projects = content.get("projects");
  const process = content.get("process");
  const diferenciais = content.get("diferenciais");
  const comparativo = content.get("comparativo");
  const experiencia = content.get("experiencia");
  const cta = content.get("cta");
  const footer = content.get("footer");

  const rawWhatsapp = (footer.whatsapp_url || "").trim();
  const isPlaceholder = !rawWhatsapp || /0{6,}/.test(rawWhatsapp);
  // Sem número configurado, o botão leva para o contato em vez de um link morto
  const whatsapp = isPlaceholder ? "#contato" : rawWhatsapp;
  const waProps = isPlaceholder ? {} : { target: "_blank", rel: "noopener noreferrer" };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const outlineBtn =
    "border-border bg-transparent text-foreground hover:bg-surface hover:text-primary hover:border-primary/50";

  const section = "py-14 md:py-24 px-5 md:px-10";

  const allProjects = (projects.items || []) as any[];
  const visibleProjects = showAllProjects ? allProjects : allProjects.slice(0, 2);
  const hasHiddenProjects = allProjects.length > 2;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <LandingHeader />

      {/* ============ HERO ============ */}
      {content.isVisible("hero") && (
        <section className="relative pt-28 md:pt-36 pb-12 md:pb-20 px-5 md:px-10">
          <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />
          <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-10 items-center relative">
            <div className="md:col-span-6 space-y-6">
              {hero.badge ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {hero.badge}
                </div>
              ) : null}

              <h1 className="font-display text-4xl md:text-6xl lg:text-[4.2rem] leading-[1.05] tracking-tight">
                {hero.title}{" "}
                <em className="not-italic text-gradient-ember">{hero.title_highlight}</em>.
              </h1>

              <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                {hero.subtitle}
              </p>

              <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-primary">
                {hero.tagline}
              </p>

              <div className="flex flex-wrap gap-3 md:gap-4 pt-1">
                <a href={whatsapp} {...waProps}>
                  <Button
                    size="lg"
                    className="h-12 px-6 md:px-7 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember"
                  >
                    {hero.cta_primary} <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  className={`h-12 px-6 md:px-7 font-medium tracking-wide ${outlineBtn}`}
                  onClick={() => scrollTo("projetos")}
                >
                  {hero.cta_secondary}
                </Button>
              </div>
            </div>

            {/* Composição hero — foto + luz âmbar + gráfico de crescimento */}
            <div className="md:col-span-6 relative">
              <div className="relative aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden bg-gradient-noir border border-border shadow-noir">
                <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-primary/40 blur-[110px]" />
                <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-accent/20 blur-[100px]" />

                <div className="absolute bottom-0 left-0 right-0 h-2/3 flex items-end gap-2 px-8 pb-0 opacity-30">
                  {[18, 30, 44, 60, 78, 96].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-ember"
                      style={{ height: `${h}%`, opacity: 0.25 + i * 0.1 }}
                    />
                  ))}
                </div>

                <img
                  src={hero.image_url || heroAlex}
                  alt="Alex Fraga, fundador da Scalefy"
                  loading="eager"
                  className="absolute bottom-0 right-0 h-[105%] w-auto object-cover object-top [mask-image:linear-gradient(to_left,black_60%,transparent)]"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ Prova rápida (experiência) ============ */}
      {content.isVisible("experiencia") && (
        <section id="numeros" className="border-y border-border bg-surface/50 py-8 px-5 md:px-10">
          <div className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-6 md:gap-10">
            {(experiencia.items || []).map((e: any) => (
              <div key={e.title} className="space-y-1.5">
                <h3 className="font-display text-xl md:text-2xl text-gradient-ember">{e.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ Faixa de produtos ============ */}
      {content.isVisible("products") && (
        <section className="border-b border-border py-7 px-5 md:px-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground shrink-0 max-w-[16rem]">
              {products.label}
            </span>
            <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
              {(products.items || []).map((p: any) => (
                <span
                  key={p.name}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-background text-foreground/80 hover:text-primary hover:border-primary/50 transition-colors"
                >
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} loading="lazy" className="h-5 w-auto object-contain" />
                  ) : null}
                  <span className="font-display text-sm md:text-lg">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ Projetos reais (+ o que fazemos) ============ */}
      {content.isVisible("projects") && (
        <section id="projetos" className={`${section} bg-surface border-b border-border`}>
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl space-y-3 mb-8 md:mb-12">
              <div className="text-xs uppercase tracking-[0.25em] text-primary">Portfólio</div>
              <h2 className="font-display text-3xl md:text-5xl leading-tight">
                {projects.title}{" "}
                <em className="text-gradient-ember not-italic">{projects.title_highlight}</em>.
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                {projects.subtitle}
              </p>
            </div>

            {/* Serviços como chips — o que fazemos */}
            {content.isVisible("services") && (
              <div id="servicos" className="flex flex-wrap gap-2 mb-8 md:mb-12">
                {(services.cards || []).map((s: any) => (
                  <span
                    key={s.title}
                    title={s.body}
                    className="px-3.5 py-1.5 rounded-full border border-border bg-background text-xs md:text-sm text-foreground/80"
                  >
                    {s.title}
                  </span>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {visibleProjects.map((p: any) => (
                <article
                  key={p.name}
                  className="flex flex-col rounded-2xl border border-border bg-background overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="relative aspect-[16/10] bg-gradient-noir border-b border-border overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-primary/25 blur-[80px]" />
                    {p.preview_url ? (
                      <img
                        src={p.preview_url}
                        alt={`Interface do sistema ${p.name}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="font-display text-3xl text-gradient-ember">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Preview do sistema
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3.5 p-5 md:p-8 flex-1">
                    <div className="flex items-center gap-3">
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={`Logo ${p.name}`}
                          loading="lazy"
                          className="h-9 w-9 rounded-lg object-contain bg-surface border border-border p-1"
                        />
                      ) : null}
                      <h3 className="font-display text-xl md:text-3xl">{p.name}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed flex-1">{p.body}</p>
                    <div className="flex flex-wrap gap-2">
                      {(p.tags || []).map((t: string) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-full border border-border text-[10px] md:text-xs uppercase tracking-[0.15em] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="pt-1">
                        <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 px-0">
                          Ver projeto <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {hasHiddenProjects && !showAllProjects ? (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  className={outlineBtn}
                  onClick={() => setShowAllProjects(true)}
                >
                  Ver todos os projetos ({allProjects.length})
                </Button>
              </div>
            ) : null}

            {/* CTA intermediário */}
            <div className="mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-background p-6 md:p-8">
              <p className="font-display text-xl md:text-2xl max-w-xl">
                Quer um sistema assim para a sua operação?
              </p>
              <a href={whatsapp} {...waProps} className="shrink-0">
                <Button className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember">
                  {cta.button_text} <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ============ Processo ============ */}
      {content.isVisible("process") && (
        <section id="processo" className={section}>
          <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5 md:sticky md:top-32 self-start space-y-4">
              <div className="text-xs uppercase tracking-[0.25em] text-primary">Processo</div>
              <h2 className="font-display text-3xl md:text-5xl leading-tight">
                {process.title}{" "}
                <em className="text-gradient-ember not-italic">{process.title_highlight}</em>.
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                {process.subtitle}
              </p>
            </div>

            <div className="md:col-span-7 space-y-px bg-border rounded-2xl overflow-hidden border border-border">
              {(process.steps || []).map((p: any, i: number) => (
                <div key={p.step} className="bg-background p-5 md:p-9 flex gap-5 md:gap-8 items-start">
                  <div className="font-display text-2xl md:text-3xl text-primary shrink-0 w-10 md:w-14">
                    0{i + 1}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl md:text-2xl">{p.step}</h3>
                    <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ Por que a Scalefy (diferenciais + comparativo) ============ */}
      {(content.isVisible("diferenciais") || content.isVisible("comparativo")) && (
        <section className={`${section} bg-surface border-y border-border`}>
          <div className="max-w-7xl mx-auto space-y-10 md:space-y-14">
            {content.isVisible("diferenciais") && (
              <>
                <h2 className="font-display text-3xl md:text-5xl leading-tight max-w-2xl">
                  {diferenciais.title}{" "}
                  <em className="text-gradient-ember not-italic">{diferenciais.title_highlight}</em>.
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
                  {(diferenciais.items || []).map((d: any) => (
                    <div key={d.title} className="bg-background p-6 md:p-8 space-y-2">
                      <h3 className="font-display text-lg md:text-2xl">{d.title}</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {d.body}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {content.isVisible("comparativo") && (
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                <div className="rounded-2xl border border-border bg-background p-6 md:p-8 space-y-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {comparativo.atual_title}
                  </div>
                  <ul className="space-y-2.5">
                    {(comparativo.atual || []).map((c: string) => (
                      <li key={c} className="flex gap-3 text-sm md:text-base text-muted-foreground">
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-destructive/70" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-primary/40 bg-gradient-noir p-6 md:p-8 space-y-4 shadow-noir relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-primary/25 blur-[90px]" />
                  <div className="relative text-xs uppercase tracking-[0.25em] text-primary">
                    {comparativo.scalefy_title}
                  </div>
                  <ul className="relative space-y-2.5">
                    {(comparativo.scalefy || []).map((c: string) => (
                      <li key={c} className="flex gap-3 text-sm md:text-base text-foreground/90">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ CTA final ============ */}
      {content.isVisible("cta") && (
        <section className={section}>
          <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-noir border border-border p-8 md:p-16 text-center shadow-noir">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="relative space-y-6">
              <h2 className="font-display text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
                {cta.title}{" "}
                <em className="text-gradient-ember not-italic">{cta.title_highlight}</em>.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                {cta.subtitle}
              </p>
              <a href={whatsapp} {...waProps} className="inline-block">
                <Button
                  size="lg"
                  className="h-13 md:h-14 px-8 md:px-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember text-base"
                >
                  {cta.button_text} <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      <LandingFooter />

      <MobileCtaBar
        href={whatsapp}
        external={!isPlaceholder}
        label={cta.button_text || "Falar com a Scalefy"}
      />
      <div className="md:hidden h-16" />
    </div>
  );
}
