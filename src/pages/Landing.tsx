import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";

import { SplineScene } from "@/components/landing/SplineRobot";
import { ServiceCards } from "@/components/landing/ServiceCards";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight } from "lucide-react";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import { getLucideIcon } from "@/lib/lucide-icon-map";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: sections } = useLandingConfig();

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
    title: "Sua empresa mais",
    title_highlight: "inteligente",
    subtitle: "Automação, gestão e marketing digital integrados em uma única plataforma. Escale resultados com tecnologia e IA.",
    spline_url: "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
    cta_primary: "Começar agora",
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
    subtitle: "Comece gratuitamente e veja resultados em poucos dias.",
    button_text: "Criar conta grátis",
  };

  const footerConfig = footer?.config || {
    email: "contato@alcansys.com.br",
    whatsapp_url: "https://wa.me/5500000000000",
    whatsapp_label: "WhatsApp",
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white overflow-x-hidden">
      <LandingHeader />

      {/* Hero — Spline Scene without card wrapper */}
      {(hero?.visible !== false) && (
        <section className="pt-28 md:pt-32 pb-8 md:pb-16 px-6 md:px-12">
          <div className="max-w-6xl mx-auto relative overflow-hidden rounded-2xl">
            <Spotlight
              className="-top-40 left-0 md:left-60 md:-top-20"
              fill="white"
            />

            <div className="flex flex-col md:flex-row md:h-[500px]">
              {/* Left content */}
              <div className="flex-1 p-6 md:p-8 relative z-10 flex flex-col justify-center">
                <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
                  {heroConfig.title}{" "}
                  <span className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(217,91%,75%)] bg-clip-text text-transparent">
                    {heroConfig.title_highlight}
                  </span>
                </h1>
                <p className="mt-4 text-neutral-300 max-w-lg leading-relaxed text-sm md:text-base">
                  {heroConfig.subtitle}
                </p>
                <div className="flex flex-wrap gap-3 md:gap-4 mt-6">
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,50%)] gap-2"
                  >
                    {heroConfig.cta_primary} <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => document.getElementById("servicos")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    {heroConfig.cta_secondary}
                  </Button>
                </div>
              </div>

              {/* Right content — 3D Robot */}
              <div className="flex-1 relative h-[300px] md:h-auto">
                <div className="absolute inset-0 md:inset-y-0 md:-right-8 md:left-0 flex items-end md:items-center justify-center">
                  <SplineScene
                    scene={heroConfig.spline_url}
                    className="w-full h-full"
                  />
                </div>
                {/* Gradient fade at the bottom to ground the robot */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[hsl(222,47%,11%)] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services — Display Cards */}
      {(getSection("services")?.visible !== false) && (
        <div id="servicos">
          <ServiceCards />
        </div>
      )}

      {/* Numbers */}
      {(stats?.visible !== false) && (
        <section id="numeros" className="py-24 px-6 md:px-12">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {(statsConfig.items as any[]).map((stat: any) => {
              const Icon = getLucideIcon(stat.icon);
              return (
                <div
                  key={stat.label}
                  className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-8 h-8 mx-auto mb-4 text-[hsl(217,91%,60%)]" />
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-white/50">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      {(cta?.visible !== false) && (
        <section className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              {ctaConfig.title}
            </h2>
            <p className="text-white/50">
              {ctaConfig.subtitle}
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,50%)] gap-2"
            >
              {ctaConfig.button_text} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      {(footer?.visible !== false) && (
        <footer id="contato" className="border-t border-white/10 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/40">
            <p>© {new Date().getFullYear()} Alcansys. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href={`mailto:${footerConfig.email}`} className="hover:text-white transition-colors">{footerConfig.email}</a>
              <a href={footerConfig.whatsapp_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{footerConfig.whatsapp_label}</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
