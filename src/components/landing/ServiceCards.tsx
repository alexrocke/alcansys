import { Zap, FolderKanban, TrendingUp, MessageCircle } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";

const serviceCards = [
  {
    icon: <Zap className="size-4 text-primary" />,
    title: "Automação com IA",
    description: "Chatbots inteligentes e fluxos automatizados",
    date: "WhatsApp integrado",
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <FolderKanban className="size-4 text-primary" />,
    title: "Gestão de Projetos",
    description: "Organize tarefas e acompanhe prazos",
    date: "Dashboards em tempo real",
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <TrendingUp className="size-4 text-primary" />,
    title: "Marketing Digital",
    description: "Campanhas otimizadas e geração de leads",
    date: "Análise de ROI",
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <MessageCircle className="size-4 text-primary" />,
    title: "Atendimento WhatsApp",
    description: "Múltiplas instâncias e chatbot IA",
    date: "Gestão centralizada",
    iconClassName: "text-primary",
    titleClassName: "text-primary",
    className:
      "[grid-area:stack] translate-x-48 translate-y-28 hover:translate-y-16",
  },
];

export function ServiceCards() {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Soluções que transformam negócios
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-2xl mx-auto">
          Tecnologia de ponta para automatizar processos, gerenciar projetos e impulsionar vendas.
        </p>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <div className="w-full max-w-3xl">
            <DisplayCards cards={serviceCards} />
          </div>
        </div>
      </div>
    </section>
  );
}
