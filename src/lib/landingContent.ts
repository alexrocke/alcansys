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
    badge: "",
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
    items: [
      {
        name: "ScalefyCRM",
        body: "Plataforma de gestão comercial com funil de vendas, controle de clientes, projetos, financeiro e portal do cliente.",
        tags: ["CRM", "Gestão", "Portal do cliente"],
        logo_url: "",
        preview_url: "",
        link: "",
      },
      {
        name: "BovinoAI",
        body: "Sistema de acompanhamento de rebanho com registro de manejo, indicadores de produção e apoio de inteligência artificial.",
        tags: ["Agro", "IA", "Indicadores"],
        logo_url: "",
        preview_url: "",
        link: "",
      },
      {
        name: "ScalefyPROSPECT",
        body: "Ferramenta de prospecção e qualificação de leads com automações de contato e organização das oportunidades.",
        tags: ["Prospecção", "Automação", "Leads"],
        logo_url: "",
        preview_url: "",
        link: "",
      },
      {
        name: "ScalefyLOG",
        body: "Controle logístico com acompanhamento de rotas, entregas e status operacional em tempo real.",
        tags: ["Logística", "Operação", "Tempo real"],
        logo_url: "",
        preview_url: "",
        link: "",
      },
      {
        name: "MattiPhone",
        body: "Plataforma de atendimento e vendas integrada ao WhatsApp, com histórico de conversas e automações de resposta.",
        tags: ["WhatsApp", "Atendimento", "Vendas"],
        logo_url: "",
        preview_url: "",
        link: "",
      },
    ] as ProjectItem[],
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
    whatsapp_url: "https://wa.me/5548988660826",
    whatsapp_label: "WhatsApp",
    company_name: "Scalefy Sistemas",
    description: "Software, automação e IA para operações reais.",
  },
  privacy: {
    title: "Política de Privacidade",
    updated: "01 de agosto de 2026",
    intro:
      "Esta Política descreve como a Scalefy Sistemas coleta, utiliza e protege os dados pessoais tratados em seus sites, sistemas e canais de atendimento.",
    sections: [
      {
        heading: "1. Quem somos",
        body: "A Scalefy Sistemas desenvolve softwares, automações e plataformas digitais sob medida. Esta página é mantida pela Scalefy para explicar como tratamos dados pessoais em nossos canais. Para qualquer dúvida, fale com contato@scalefy.com.br.",
      },
      {
        heading: "2. Dados que coletamos",
        body: "Coletamos os dados que você nos envia diretamente, como nome, e-mail, telefone, empresa e mensagens enviadas pelos formulários ou pelo WhatsApp. Em nossos sistemas, coletamos também os dados necessários para criar e manter sua conta e registrar o uso das funcionalidades contratadas.",
      },
      {
        heading: "3. Como usamos os dados",
        body: "Utilizamos os dados para responder solicitações, elaborar propostas, prestar os serviços contratados, emitir cobranças, dar suporte e melhorar nossos produtos. Não vendemos dados pessoais.",
      },
      {
        heading: "4. Compartilhamento e fornecedores",
        body: "Podemos compartilhar dados com fornecedores de tecnologia necessários à operação, como hospedagem, banco de dados, envio de e-mails, mensageria e meios de pagamento. Esses fornecedores tratam os dados apenas conforme nossas instruções.",
      },
      {
        heading: "5. Armazenamento e segurança",
        body: "Adotamos controles de acesso, autenticação e criptografia de credenciais sensíveis. Nenhum sistema é totalmente imune a incidentes, por isso mantemos práticas de monitoramento e resposta e comunicamos o cliente quando um incidente relevante ocorre.",
      },
      {
        heading: "6. Retenção e exclusão",
        body: "Mantemos os dados pelo tempo necessário à finalidade que motivou a coleta e às obrigações legais e contratuais. Depois disso, os dados são excluídos ou anonimizados.",
      },
      {
        heading: "7. Seus direitos",
        body: "Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, além de revogar consentimentos. Basta enviar o pedido para contato@scalefy.com.br.",
      },
      {
        heading: "8. Cookies",
        body: "Nosso site pode utilizar cookies e tecnologias equivalentes para funcionamento básico, medição de audiência e melhoria da navegação. Você pode gerenciar cookies nas configurações do seu navegador.",
      },
      {
        heading: "9. Alterações desta Política",
        body: "Esta Política pode ser atualizada para refletir mudanças em nossos serviços ou na legislação. A data da última atualização é sempre indicada no topo desta página.",
      },
    ] as LegalSection[],
  },
  terms: {
    title: "Termos de Uso",
    updated: "01 de agosto de 2026",
    intro:
      "Estes Termos regulam o uso do site, dos sistemas e dos serviços fornecidos pela Scalefy Sistemas.",
    sections: [
      {
        heading: "1. Aceite",
        body: "Ao acessar o site ou utilizar qualquer sistema da Scalefy Sistemas, você concorda com estes Termos. Se não concordar, não utilize os serviços.",
      },
      {
        heading: "2. Serviços",
        body: "A Scalefy desenvolve e disponibiliza sistemas, automações e plataformas digitais. O escopo, prazos, valores e responsabilidades específicas de cada projeto são definidos em proposta ou contrato próprio, que prevalece sobre estes Termos em caso de divergência.",
      },
      {
        heading: "3. Conta e acesso",
        body: "Os acessos são pessoais e intransferíveis. Você é responsável por manter suas credenciais em sigilo e por todas as atividades realizadas na sua conta. Comunique imediatamente qualquer uso não autorizado.",
      },
      {
        heading: "4. Uso permitido",
        body: "É proibido utilizar os serviços para atividades ilícitas, tentar burlar mecanismos de segurança, realizar engenharia reversa, sobrecarregar a infraestrutura ou reproduzir os sistemas sem autorização.",
      },
      {
        heading: "5. Propriedade intelectual",
        body: "A marca, o código-fonte, o design e os materiais da Scalefy são protegidos por direitos de propriedade intelectual. A contratação de um serviço não transfere titularidade, salvo previsão expressa em contrato.",
      },
      {
        heading: "6. Pagamentos",
        body: "Valores, formas de pagamento, reajustes e prazos são definidos na proposta ou contrato. O atraso no pagamento pode gerar suspensão do acesso, após comunicação prévia.",
      },
      {
        heading: "7. Disponibilidade e suporte",
        body: "Trabalhamos para manter os sistemas disponíveis, mas podem ocorrer interrupções por manutenção, atualização ou falhas de terceiros. Condições de suporte e garantia seguem o que estiver acordado em contrato.",
      },
      {
        heading: "8. Limitação de responsabilidade",
        body: "A Scalefy não se responsabiliza por danos decorrentes de uso indevido dos sistemas, de dados incorretos fornecidos pelo cliente ou de falhas em serviços de terceiros fora do nosso controle.",
      },
      {
        heading: "9. Vigência e encerramento",
        body: "Estes Termos vigoram enquanto durar o uso dos serviços. O encerramento não afeta obrigações já assumidas, especialmente as financeiras e de confidencialidade.",
      },
      {
        heading: "10. Foro e contato",
        body: "Estes Termos são regidos pela legislação brasileira. Dúvidas podem ser enviadas para contato@scalefy.com.br.",
      },
    ] as LegalSection[],

  },
};

export const sectionLabels: Record<string, string> = {
  hero: "Hero (topo da página)",
  products: "Faixa de produtos",
  services: "Serviços (chips na seção de projetos)",
  projects: "Projetos desenvolvidos",
  process: "Processo",
  diferenciais: "Por que a Scalefy (diferenciais)",
  comparativo: "Por que a Scalefy (comparativo)",
  experiencia: "Prova rápida (faixa abaixo do hero)",
  cta: "CTA final",
  footer: "Rodapé",
  privacy: "Política de Privacidade",
  terms: "Termos de Uso",
};
