export type ProductItem = { name: string; logo_url?: string };
export type ProjectItem = {
  name: string;
  body: string;
  tags: string[];
  logo_url?: string;
  preview_url?: string;
  link?: string;
};
export type LegalSection = { heading: string; body: string };

export const landingDefaults: Record<string, any> = {
  hero: {
    badge: "Scalefy Sistemas",
    title: "Sistemas sob medida para organizar, automatizar e fazer sua empresa",
    title_highlight: "crescer",
    subtitle:
      "Desenvolvemos softwares, CRMs, automações e plataformas digitais adaptadas à realidade da sua operação.",
    tagline: "Soluções reais para operações reais.",
    cta_primary: "Falar sobre meu projeto",
    cta_secondary: "Conhecer projetos reais",
  },
  products: {
    label: "Projetos desenvolvidos para operações reais",
    items: [
      { name: "ScalefyCRM", logo_url: "" },
      { name: "BovinoAI", logo_url: "" },
      { name: "ScalefyPROSPECT", logo_url: "" },
      { name: "ScalefyLOG", logo_url: "" },
      { name: "MattiPhone", logo_url: "" },
    ] as ProductItem[],
  },
  services: {
    title: "O que podemos desenvolver",
    title_highlight: "para sua empresa",
    subtitle:
      "Tecnologia aplicada a processos reais: menos retrabalho, mais controle e informação no lugar certo.",
    cards: [
      { title: "Sistemas sob medida", body: "Plataformas desenvolvidas de acordo com os processos, regras e necessidades reais da sua empresa." },
      { title: "Automações inteligentes", body: "Integrações e fluxos automáticos para reduzir tarefas repetitivas, erros e perda de tempo." },
      { title: "Plataformas e experiências digitais", body: "Landing pages, portais e ambientes digitais desenvolvidos para conversão, operação e crescimento." },
      { title: "IA aplicada ao negócio", body: "Inteligência artificial aplicada a atendimento, análise, qualificação e automação de processos." },
    ],
  },
  projects: {
    title: "Projetos desenvolvidos",
    title_highlight: "para operações reais",
    subtitle: "Sistemas em uso, criados a partir de problemas concretos de operação.",
    items: [] as ProjectItem[],
  },
  process: {
    title: "Do problema ao",
    title_highlight: "sistema funcionando",
    subtitle:
      "Você acompanha cada etapa do projeto, valida as entregas e participa das decisões antes da solução chegar à operação.",
    steps: [
      { step: "Diagnóstico", body: "Entendemos sua operação, seus processos e o problema que precisa ser resolvido." },
      { step: "Planejamento", body: "Definimos funcionalidades, fluxos, prioridades e estrutura do projeto." },
      { step: "Construção", body: "Desenvolvemos e apresentamos entregas frequentes para validação." },
      { step: "Operação", body: "Implantamos, acompanhamos o uso e evoluímos a solução conforme a necessidade." },
    ],
  },
  diferenciais: {
    title: "Por que a Scalefy",
    title_highlight: "é diferente",
    items: [
      { title: "Entendimento da operação", body: "Antes de desenvolver, entendemos como sua empresa realmente trabalha." },
      { title: "Sistema preparado para crescer", body: "A estrutura é pensada para receber novos recursos e acompanhar a evolução do negócio." },
      { title: "Acompanhamento próximo", body: "Você participa das decisões e acompanha o desenvolvimento durante todo o projeto." },
      { title: "Tecnologia com objetivo", body: "Cada funcionalidade precisa resolver um problema real da operação." },
    ],
  },
  comparativo: {
    title: "Quando faz sentido",
    title_highlight: "falar com a gente",
    atual_title: "Cenário atual",
    scalefy_title: "Com a Scalefy",
    atual: [
      "Processos dependem de planilhas",
      "Informações ficam espalhadas",
      "A equipe executa tarefas repetitivas",
      "Os sistemas atuais não acompanham a operação",
      "A gestão não possui visão completa dos dados",
    ],
    scalefy: [
      "Processos centralizados",
      "Automações conectadas à rotina",
      "Informações acessíveis em um só lugar",
      "Regras adaptadas à realidade da empresa",
      "Mais controle sobre a operação",
    ],
  },
  experiencia: {
    title: "Experiência",
    title_highlight: "prática",
    items: [
      { title: "Sistemas próprios", body: "Produtos desenvolvidos pela Scalefy e utilizados em operações reais." },
      { title: "Projetos personalizados", body: "Soluções adaptadas às regras e processos de cada empresa." },
      { title: "Evolução contínua", body: "Sistemas preparados para receber melhorias e novas funcionalidades." },
    ],
  },
  cta: {
    title: "Vamos conversar sobre",
    title_highlight: "o seu projeto",
    subtitle:
      "Conte o que sua operação precisa resolver. A gente avalia e mostra o caminho mais direto.",
    button_text: "Falar com a Scalefy",
  },
  footer: {
    email: "contato@scalefy.com.br",
    whatsapp_url: "https://wa.me/5500000000000",
    whatsapp_label: "WhatsApp",
    company_name: "Scalefy Sistemas",
    description: "Software, automação e IA para operações reais.",
  },
  privacy: {
    title: "Política de Privacidade",
    updated: "01 de agosto de 2026",
    intro:
      "Esta Política descreve como a Scalefy Sistemas coleta, utiliza e protege os dados pessoais tratados em seus sites, sistemas e canais de atendimento.",
    sections: [] as LegalSection[],
  },
  terms: {
    title: "Termos de Uso",
    updated: "01 de agosto de 2026",
    intro:
      "Estes Termos regulam o uso do site, dos sistemas e dos serviços fornecidos pela Scalefy Sistemas.",
    sections: [] as LegalSection[],
  },
};

export const sectionLabels: Record<string, string> = {
  hero: "Hero (topo da página)",
  products: "Faixa de produtos",
  services: "Serviços",
  projects: "Projetos desenvolvidos",
  process: "Processo",
  diferenciais: "Diferenciais",
  comparativo: "Quando faz sentido (comparativo)",
  experiencia: "Experiência prática",
  cta: "CTA final",
  footer: "Rodapé",
  privacy: "Política de Privacidade",
  terms: "Termos de Uso",
};
