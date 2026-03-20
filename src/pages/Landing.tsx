import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SplineRobot } from "@/components/landing/SplineRobot";
import { ServiceCards } from "@/components/landing/ServiceCards";
import { ArrowRight, Users, Zap, BarChart3 } from "lucide-react";

const stats = [
  { icon: Users, label: "Clientes ativos", value: "150+" },
  { icon: Zap, label: "Automações rodando", value: "500+" },
  { icon: BarChart3, label: "ROI médio", value: "320%" },
];

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  if (session) return null;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white overflow-x-hidden">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Sua empresa mais{" "}
              <span className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(217,91%,75%)] bg-clip-text text-transparent">
                inteligente
              </span>
            </h1>
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Automação, gestão e marketing digital integrados em uma única plataforma. Escale resultados com tecnologia e IA.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("servicos")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver serviços
              </Button>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <SplineRobot />
          </div>
        </div>
      </section>

      {/* Services */}
      <div id="servicos">
        <ServiceCards />
      </div>

      {/* Numbers */}
      <section id="numeros" className="py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
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

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-white/50">
            Comece gratuitamente e veja resultados em poucos dias.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            Criar conta grátis <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
