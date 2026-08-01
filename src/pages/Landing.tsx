import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import heroAlex from "@/assets/hero-alex.webp";
import logo from "@/assets/logo-scalefy.png";

const WHATSAPP_URL = "https://wa.me/5500000000000";
const EMAIL = "contato@scalefy.com.br";

const products = ["ScalefyCRM", "BovinoAI", "ScalefyPROSPECT", "ScalefyLOG", "MattiPhone"];

const services = [
  {
    n: "01",
    title: "Sistemas sob medida",
    body: "Plataformas desenvolvidas de acordo com os processos, regras e necessidades reais da sua empresa.",
  },
  {
    n: "02",
    title: "Automações inteligentes",
    body: "Integrações e fluxos automáticos para reduzir tarefas repetitivas, erros e perda de tempo.",
  },
  {
    n: "03",
    title: "Plataformas e experiências digitais",
    body: "Landing pages, portais e ambientes digitais desenvolvidos para conversão, operação e crescimento.",
  },
  {
    n: "04",
    title: "IA aplicada ao negócio",
    body: "Inteligência artificial aplicada a atendimento, análise, qualificação e automação de processos.",
  },
];

// image: troque `image` por um print real quando disponível (src/assets/...)
const projects = [
  {
    name: "ScalefyCRM",
    body: "CRM com IA para centralizar atendimentos, qualificar leads e acompanhar cada oportunidade de venda.",
    tags: ["CRM", "WhatsApp", "IA", "Vendas"],
    image: null as string | null,
  },
  {
    name: "BovinoAI",
    body: "Plataforma que aplica inteligência artificial e organização de dados ao setor do agronegócio.",
    tags: ["Agronegócio", "IA", "Gestão", "Dados"],
    image: null as string | null,
  },
  {
    name: "ScalefyPROSPECT",
    body: "Sistema comercial para organizar prospecção, contatos, oportunidades e produtividade da equipe.",
    tags: ["Prospecção", "Comercial", "Leads", "Automação"],
    image: null as string | null,
  },
  {
    name: "ScalefyLOG",
    body: "Plataforma para gestão de frota, veículos, rotinas e informações operacionais.",
    tags: ["Logística", "Frota", "Gestão", "Operação"],
    image: null as string | null,
  },
  {
    name: "MattiPhone",
    body: "Solução digital desenvolvida para apoiar a gestão e a operação comercial de uma loja de celulares.",
    tags: ["Varejo", "Vendas", "Gestão", "Atendimento"],
    image: null as string | null,
  },
];

const process = [
  { step: "Diagnóstico", body: "Entendemos sua operação, seus processos e o problema que precisa ser resolvido." },
  { step: "Planejamento", body: "Definimos funcionalidades, fluxos, prioridades e estrutura do projeto." },
  { step: "Construção", body: "Desenvolvemos e apresentamos entregas frequentes para validação." },
  { step: "Operação", body: "Implantamos, acompanhamos o uso e evoluímos a solução conforme a necessidade." },
];

const diferenciais = [
  { title: "Entendimento da operação", body: "Antes de desenvolver, entendemos como sua empresa realmente trabalha." },
  { title: "Sistema preparado para crescer", body: "A estrutura é pensada para receber novos recursos e acompanhar a evolução do negócio." },
  { title: "Acompanhamento próximo", body: "Você participa das decisões e acompanha o desenvolvimento durante todo o projeto." },
  { title: "Tecnologia com objetivo", body: "Cada funcionalidade precisa resolver um problema real da operação." },
];

const cenarioAtual = [
  "Processos dependem de planilhas",
  "Informações ficam espalhadas",
  "A equipe executa tarefas repetitivas",
  "Os sistemas atuais não acompanham a operação",
  "A gestão não possui visão completa dos dados",
];

const comScalefy = [
  "Processos centralizados",
  "Automações conectadas à rotina",
  "Informações acessíveis em um só lugar",
  "Regras adaptadas à realidade da empresa",
  "Mais controle sobre a operação",
];

const experiencia = [
  { title: "Sistemas próprios", body: "Produtos desenvolvidos pela Scalefy e utilizados em operações reais." },
  { title: "Projetos personalizados", body: "Soluções adaptadas às regras e processos de cada empresa." },
  { title: "Evolução contínua", body: "Sistemas preparados para receber melhorias e novas funcionalidades." },
];

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  if (session) return null;

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      <LandingHeader />

      {/* ============ HERO ============ */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-10">
        {/* ambient ember */}
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 md:gap-10 items-center relative">
          <div className="md:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Scalefy Sistemas
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-[4.2rem] leading-[1.02] tracking-tight">
              Sistemas sob medida para organizar, automatizar e fazer sua empresa{" "}
              <em className="not-italic text-gradient-ember">crescer</em>.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Desenvolvemos softwares, CRMs, automações e plataformas digitais adaptadas
              à realidade da sua operação.
            </p>

            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Soluções reais para operações reais.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember"
                >
                  Falar sobre meu projeto <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border bg-transparent hover:bg-surface font-medium tracking-wide"
                onClick={() => scrollTo("projetos")}
              >
                Conhecer projetos reais
              </Button>
            </div>
          </div>

          {/* Composição hero — foto + luz âmbar + gráfico de crescimento */}
          <div className="md:col-span-6 relative">
            <div className="relative aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden bg-gradient-noir border border-border shadow-noir">
              <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-primary/40 blur-[110px]" />
              <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-accent/20 blur-[100px]" />

              {/* barras sutis de crescimento */}
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
                src={heroAlex}
                alt="Alex Fraga, fundador da Scalefy"
                loading="eager"
                className="absolute bottom-0 right-0 h-[105%] w-auto object-cover object-top [mask-image:linear-gradient(to_left,black_60%,transparent)]"
              />

              <div className="absolute top-6 left-6 flex items-center gap-3">
                <img src={logo} alt="Scalefy" className="h-8 w-auto object-contain" />
              </div>
              <div className="absolute bottom-6 left-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Software · Automação · IA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Faixa de produtos ============ */}
      <section className="border-y border-border bg-surface/50 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground shrink-0">
            Projetos desenvolvidos para operações reais
          </span>
          <div className="flex flex-wrap gap-3 md:gap-4">
            {products.map((p) => (
              <span
                key={p}
                className="px-4 py-2 rounded-full border border-border bg-background font-display text-base md:text-lg text-foreground/70 hover:text-primary hover:border-primary/50 transition-colors"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Serviços ============ */}
      <section id="servicos" className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-6 mb-16">
            <div className="md:col-span-5">
              <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Serviços</div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight">
                O que podemos desenvolver <em className="text-gradient-ember not-italic">para sua empresa</em>.
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7 flex items-end">
              <p className="text-muted-foreground text-lg leading-relaxed">
                Criamos soluções digitais para eliminar processos manuais, centralizar
                informações e dar mais controle à operação.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {services.map((s) => (
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

      {/* ============ Projetos reais ============ */}
      <section id="projetos" className="py-24 md:py-32 px-6 md:px-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4 mb-16">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Portfólio</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Sistemas que já <em className="text-gradient-ember not-italic">saíram do papel</em>.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Conheça algumas soluções desenvolvidas pela Scalefy para diferentes tipos de operação.
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {projects.map((p, i) => (
              <article
                key={p.name}
                className="grid md:grid-cols-12 gap-8 md:gap-12 items-center rounded-2xl border border-border bg-background p-6 md:p-10"
              >
                <div
                  className={`md:col-span-6 ${i % 2 === 1 ? "md:order-2" : ""}`}
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border bg-gradient-noir">
                    <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-primary/25 blur-[80px]" />
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={`Interface do sistema ${p.name}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <span className="font-display text-3xl md:text-4xl text-gradient-ember">{p.name}</span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Preview do sistema
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`md:col-span-6 space-y-5 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <h3 className="font-display text-3xl md:text-4xl">{p.name}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{p.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-full border border-border text-xs uppercase tracking-[0.15em] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block pt-1">
                    <Button variant="outline" className="border-border hover:bg-surface gap-2">
                      Preciso de uma solução parecida <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Processo ============ */}
      <section id="processo" className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-5 md:sticky md:top-32 self-start space-y-6">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Processo</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Do problema ao <em className="text-gradient-ember not-italic">sistema funcionando</em>.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Você acompanha cada etapa do projeto, valida as entregas e participa das
              decisões antes da solução chegar à operação.
            </p>
          </div>

          <div className="md:col-span-7 space-y-px bg-border rounded-2xl overflow-hidden border border-border">
            {process.map((p, i) => (
              <div key={p.step} className="bg-background p-8 md:p-10 flex gap-8 items-start">
                <div className="font-display text-3xl text-primary shrink-0 w-14">0{i + 1}</div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl">{p.step}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Diferenciais ============ */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-2xl mb-14">
            Não entregamos apenas uma <em className="text-gradient-ember not-italic">tela bonita</em>.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {diferenciais.map((d) => (
              <div key={d.title} className="bg-background p-8 space-y-3 min-h-[200px]">
                <h3 className="font-display text-xl md:text-2xl">{d.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Quando faz sentido ============ */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight text-center mb-14 max-w-3xl mx-auto">
            Quando um sistema sob medida <em className="text-gradient-ember not-italic">faz sentido</em>?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-background p-8 md:p-10 space-y-6">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Cenário atual</div>
              <ul className="space-y-4">
                {cenarioAtual.map((c) => (
                  <li key={c} className="flex gap-3 text-muted-foreground">
                    <X className="w-5 h-5 shrink-0 text-destructive/70" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-gradient-noir p-8 md:p-10 space-y-6 shadow-noir relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-primary/25 blur-[90px]" />
              <div className="relative text-xs uppercase tracking-[0.25em] text-primary">Com uma solução Scalefy</div>
              <ul className="relative space-y-4">
                {comScalefy.map((c) => (
                  <li key={c} className="flex gap-3 text-foreground/90">
                    <Check className="w-5 h-5 shrink-0 text-primary" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Experiência prática ============ */}
      <section id="numeros" className="py-24 md:py-32 px-6 md:px-10 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3 text-center">Experiência prática</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight text-center mb-16 max-w-3xl mx-auto">
            Projetos criados para <em className="text-gradient-ember not-italic">diferentes operações</em>.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {experiencia.map((e) => (
              <div key={e.title} className="bg-background p-10 md:p-12 space-y-4">
                <h3 className="font-display text-2xl md:text-3xl text-gradient-ember">{e.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{e.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA final ============ */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-noir border border-border p-12 md:p-20 text-center shadow-noir">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="relative space-y-8">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Vamos conversar</div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl mx-auto">
              Sua operação precisa de um sistema que realmente acompanhe sua empresa?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conte o que sua empresa precisa organizar, automatizar ou desenvolver.
              A Scalefy estrutura a solução com você.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button
                size="lg"
                className="h-14 px-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-medium tracking-wide shadow-ember text-base"
              >
                Falar sobre meu projeto <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer id="contato" className="border-t border-border py-14 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <img src={logo} alt="Scalefy" className="h-10 w-auto object-contain" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Sistemas sob medida, automações e IA aplicada para operações reais.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Navegação</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#servicos" className="hover:text-primary transition-colors">Serviços</a></li>
              <li><a href="#projetos" className="hover:text-primary transition-colors">Projetos</a></li>
              <li><a href="#processo" className="hover:text-primary transition-colors">Processo</a></li>
              <li><a href="#contato" className="hover:text-primary transition-colors">Contato</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Produtos</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#projetos" className="hover:text-primary transition-colors">ScalefyCRM</a></li>
              <li><a href="#projetos" className="hover:text-primary transition-colors">ScalefyPROSPECT</a></li>
              <li><a href="#projetos" className="hover:text-primary transition-colors">ScalefyLOG</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Contato</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`mailto:${EMAIL}`} className="hover:text-primary transition-colors">{EMAIL}</a></li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  WhatsApp
                </a>
              </li>
              <li><a href="/politica-de-privacidade" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="/termos-de-uso" className="hover:text-primary transition-colors">Termos de Uso</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
          © {new Date().getFullYear()} Scalefy. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
