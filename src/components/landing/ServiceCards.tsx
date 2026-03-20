import DisplayCards from "@/components/ui/display-cards";
import { useLandingSection } from "@/hooks/useLandingConfig";
import { getLucideIcon } from "@/lib/lucide-icon-map";

const stackClasses = [
  "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  "[grid-area:stack] translate-x-20 translate-y-12 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  "[grid-area:stack] translate-x-40 translate-y-24 hover:translate-y-12 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  "[grid-area:stack] translate-x-60 translate-y-36 hover:translate-y-24",
];

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

  const displayCards = cards.map((card: any, i: number) => {
    const Icon = getLucideIcon(card.icon);
    return {
      icon: <Icon className="size-5 text-primary" />,
      title: card.title,
      description: card.description,
      date: card.subtitle,
      iconClassName: "text-primary",
      titleClassName: "text-primary",
      className: stackClasses[i % stackClasses.length],
    };
  });

  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          {config.title || defaultTexts.title}
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
          {config.subtitle || defaultTexts.subtitle}
        </p>
        <div className="flex min-h-[450px] w-full items-center justify-center">
          <div className="w-full max-w-4xl">
            <DisplayCards cards={displayCards} />
          </div>
        </div>
      </div>
    </section>
  );
}
