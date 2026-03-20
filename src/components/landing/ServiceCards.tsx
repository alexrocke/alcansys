import { useRef, useState } from "react";
import { Zap, FolderKanban, TrendingUp, MessageCircle } from "lucide-react";

interface ServiceCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const services: ServiceCard[] = [
  {
    icon: Zap,
    title: "Automação com IA",
    description: "Chatbots inteligentes, fluxos automatizados e integração com WhatsApp para escalar seu atendimento.",
  },
  {
    icon: FolderKanban,
    title: "Gestão de Projetos",
    description: "Organize tarefas, acompanhe prazos e gerencie sua equipe com dashboards em tempo real.",
  },
  {
    icon: TrendingUp,
    title: "Marketing Digital",
    description: "Campanhas otimizadas, geração de leads e análise de ROI para maximizar seus resultados.",
  },
  {
    icon: MessageCircle,
    title: "Atendimento WhatsApp",
    description: "Múltiplas instâncias, chatbot IA e gestão centralizada de conversas em um só lugar.",
  },
];

function TiltCard({ card }: { card: ServiceCard }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)" });
  };

  const Icon = card.icon;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, transition: "transform 0.2s ease-out" }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 cursor-default"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/40 transition-colors">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{card.description}</p>
      </div>
    </div>
  );
}

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((card) => (
            <TiltCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
