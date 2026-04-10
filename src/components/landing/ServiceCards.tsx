import { useLandingSection } from "@/hooks/useLandingConfig";
import { getLucideIcon } from "@/lib/lucide-icon-map";

const defaultCards = [
  { icon: "Code", title: "Sistemas Personalizados", description: "Desenvolvemos sistemas sob medida para o seu negócio, do planejamento à entrega final", subtitle: "100% customizado" },
  { icon: "Zap", title: "Automação com IA", description: "Chatbots inteligentes, fluxos automatizados e integração com WhatsApp", subtitle: "Resultados 24/7" },
  { icon: "Globe", title: "Landing Pages", description: "Páginas de alta conversão para captar clientes e vender seus serviços", subtitle: "Design profissional" },
  { icon: "MessageCircle", title: "Atendimento WhatsApp", description: "Múltiplas linhas, chatbot inteligente e gestão centralizada de conversas", subtitle: "Atendimento escalável" },
];

const defaultTexts = {
  title: "Soluções digitais para o seu negócio",
  subtitle: "Criamos sistemas, automações e landing pages que geram resultados reais para sua empresa.",
};

export function ServiceCards() {
  const { data: section } = useLandingSection("services");
  const config = section?.config as Record<string, any> | undefined;
  const cards = (config?.cards as any[]) || defaultCards;

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          {config?.title || defaultTexts.title}
        </h2>
        <p className="text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          {config?.subtitle || defaultTexts.subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cards.map((card: any, index: number) => {
            const Icon = getLucideIcon(card.icon);
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 flex flex-col gap-4 transition-all duration-300 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon className="size-6" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
                {card.subtitle && (
                  <span className="text-xs text-primary/70 font-medium mt-auto pt-2 border-t border-border/30">
                    {card.subtitle}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
