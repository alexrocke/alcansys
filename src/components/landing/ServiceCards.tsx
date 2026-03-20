import DisplayCards from "@/components/ui/display-cards";
import { useLandingSection } from "@/hooks/useLandingConfig";
import { getLucideIcon } from "@/lib/lucide-icon-map";

const defaultCards = [
  { icon: "Zap", title: "Automação com IA", description: "Chatbots inteligentes e fluxos automatizados", subtitle: "WhatsApp integrado" },
  { icon: "FolderKanban", title: "Gestão de Projetos", description: "Organize tarefas e acompanhe prazos", subtitle: "Dashboards em tempo real" },
  { icon: "TrendingUp", title: "Marketing Digital", description: "Campanhas otimizadas e geração de leads", subtitle: "Análise de ROI" },
  { icon: "MessageCircle", title: "Atendimento WhatsApp", description: "Múltiplas instâncias e chatbot IA", subtitle: "Gestão centralizada" },
];

const defaultTexts = {
  title: "Soluções que transformam negócios",
  subtitle: "Tecnologia de ponta para automatizar processos, gerenciar projetos e impulsionar vendas.",
};

export function ServiceCards() {
  const { data: section } = useLandingSection("services");
  const config = section?.config as Record<string, any> | undefined;
  const cards = (config?.cards as any[]) || defaultCards;

  const paddingX = config?.card_padding_x ?? 24;
  const paddingY = config?.card_padding_y ?? 24;
  const spacingX = config?.card_spacing_x ?? 80;
  const spacingY = config?.card_spacing_y ?? 48;

  const displayCards = cards.map((card: any) => {
    const Icon = getLucideIcon(card.icon);
    return {
      icon: <Icon className="size-5 text-primary" />,
      title: card.title,
      description: card.description,
      date: card.subtitle,
      iconClassName: "text-primary",
      titleClassName: "text-primary",
    };
  });

  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          {config?.title || defaultTexts.title}
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
          {config?.subtitle || defaultTexts.subtitle}
        </p>
        <div className="flex min-h-[450px] w-full items-center justify-center">
          <div className="w-full max-w-4xl">
            <DisplayCards
              cards={displayCards}
              paddingX={paddingX}
              paddingY={paddingY}
              spacingX={spacingX}
              spacingY={spacingY}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
