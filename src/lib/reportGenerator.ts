import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
}

function createBasePdf(title: string, subtitle?: string): jsPDF {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);

  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 30);
  }

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, subtitle ? 37 : 30);

  return doc;
}

function addSummary(doc: jsPDF, summary: { label: string; value: string }[], startY: number) {
  let y = startY + 8;
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Resumo', 14, y);
  y += 6;

  summary.forEach((item) => {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`${item.label}: `, 14, y);
    doc.setTextColor(40);
    doc.text(item.value, 14 + doc.getTextWidth(`${item.label}: `), y);
    y += 6;
  });
}

export function generateReport(config: ReportConfig) {
  const doc = createBasePdf(config.title, config.subtitle);
  const startY = config.subtitle ? 42 : 35;

  autoTable(doc, {
    head: [config.columns],
    body: config.rows.map((row) => row.map(String)),
    startY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  if (config.summary) {
    const finalY = (doc as any).lastAutoTable?.finalY || startY + 20;
    addSummary(doc, config.summary, finalY);
  }

  doc.save(`${config.title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

// Pre-built report generators

export function generateProjectsReport(projects: any[], projectCosts: Record<string, number>) {
  const statusLabels: Record<string, string> = {
    planejamento: 'Planejamento',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  const totalBudget = projects.reduce((s, p) => s + (Number(p.orcamento) || 0), 0);
  const totalCost = Object.values(projectCosts).reduce((s, c) => s + c, 0);

  generateReport({
    title: 'Relatório de Projetos',
    subtitle: `${projects.length} projetos`,
    columns: ['Projeto', 'Cliente', 'Status', 'Área', 'Orçamento', 'Custo', 'Margem'],
    rows: projects.map((p) => {
      const budget = Number(p.orcamento) || 0;
      const cost = projectCosts[p.id] || 0;
      const margin = budget > 0 ? ((budget - cost) / budget * 100).toFixed(1) + '%' : '-';
      return [
        p.nome,
        p.client?.nome || '-',
        statusLabels[p.status] || p.status,
        p.area,
        formatCurrency(budget),
        formatCurrency(cost),
        margin,
      ];
    }),
    summary: [
      { label: 'Orçamento Total', value: formatCurrency(totalBudget) },
      { label: 'Custo Total', value: formatCurrency(totalCost) },
      { label: 'Margem Geral', value: totalBudget > 0 ? ((totalBudget - totalCost) / totalBudget * 100).toFixed(1) + '%' : '-' },
    ],
  });
}

export function generateLeadsReport(leads: any[]) {
  const statusLabels: Record<string, string> = {
    novo: 'Novo', contatado: 'Contatado', qualificado: 'Qualificado',
    proposta: 'Proposta', negociacao: 'Negociação', ganho: 'Ganho', perdido: 'Perdido',
  };
  const originLabels: Record<string, string> = {
    site: 'Site', whatsapp: 'WhatsApp', indicacao: 'Indicação',
    campanha: 'Campanha', organico: 'Orgânico', outro: 'Outro',
  };

  const totalValue = leads.filter((l) => l.status !== 'perdido').reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0);
  const wonLeads = leads.filter((l) => l.status === 'ganho');
  const wonValue = wonLeads.reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0);
  const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : '0';

  generateReport({
    title: 'Relatório de Leads',
    subtitle: `${leads.length} leads`,
    columns: ['Nome', 'Empresa', 'Status', 'Origem', 'Valor Estimado', 'Responsável'],
    rows: leads.map((l) => [
      l.nome,
      l.empresa || '-',
      statusLabels[l.status] || l.status,
      originLabels[l.origem] || l.origem,
      l.valor_estimado ? formatCurrency(Number(l.valor_estimado)) : '-',
      l.responsavel?.nome || '-',
    ]),
    summary: [
      { label: 'Pipeline Total', value: formatCurrency(totalValue) },
      { label: 'Valor Ganho', value: formatCurrency(wonValue) },
      { label: 'Taxa de Conversão', value: `${conversionRate}%` },
      { label: 'Leads Ganhos', value: `${wonLeads.length}` },
    ],
  });
}

export function generateSalesReport(commissions: any[], salespeople: any[]) {
  const totalSales = commissions.reduce((s, c) => s + Number(c.valor_venda), 0);
  const totalCommissions = commissions.reduce((s, c) => s + Number(c.valor_comissao), 0);
  const paidCommissions = commissions.filter((c) => c.status === 'paga').reduce((s, c) => s + Number(c.valor_comissao), 0);

  const statusLabels: Record<string, string> = { pendente: 'Pendente', aprovada: 'Aprovada', paga: 'Paga' };

  generateReport({
    title: 'Relatório de Vendas',
    subtitle: `${commissions.length} comissões de ${salespeople.length} vendedores`,
    columns: ['Vendedor', 'Descrição', 'Valor Venda', 'Comissão', '%', 'Status', 'Data'],
    rows: commissions.map((c) => [
      c.salespeople?.nome || '-',
      c.descricao,
      formatCurrency(Number(c.valor_venda)),
      formatCurrency(Number(c.valor_comissao)),
      `${c.percentual}%`,
      statusLabels[c.status] || c.status,
      format(new Date(c.data_venda), 'dd/MM/yyyy'),
    ]),
    summary: [
      { label: 'Total em Vendas', value: formatCurrency(totalSales) },
      { label: 'Total Comissões', value: formatCurrency(totalCommissions) },
      { label: 'Comissões Pagas', value: formatCurrency(paidCommissions) },
      { label: 'Vendedores Ativos', value: `${salespeople.filter((s) => s.status === 'ativo').length}` },
    ],
  });
}
