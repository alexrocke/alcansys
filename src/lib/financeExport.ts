import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceData {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  area: string | null;
  data: string;
  project?: { nome: string } | null;
}

interface Settings {
  metaMensal: number;
  custosFixos: number;
}

export const exportFinanceToPDF = async (
  finances: FinanceData[],
  mesFilter: string,
  settings: Settings
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // primary color
  doc.text('Alcansys', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const mesFormatado = format(new Date(mesFilter + '-01'), "MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Relatório Financeiro - ${mesFormatado}`, 14, 30);
  
  // Calculate totals
  const totalReceitas = finances.filter(f => f.tipo === 'receita').reduce((sum, f) => sum + Number(f.valor), 0);
  const totalDespesas = finances.filter(f => f.tipo === 'despesa').reduce((sum, f) => sum + Number(f.valor), 0);
  const saldo = totalReceitas - totalDespesas;
  const roi = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0;
  
  // Summary section
  let yPos = 45;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  doc.text('Resumo do Período', 14, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.text(`Total de Receitas: ${formatCurrency(totalReceitas)}`, 14, yPos);
  yPos += 6;
  doc.text(`Total de Despesas: ${formatCurrency(totalDespesas)}`, 14, yPos);
  yPos += 6;
  doc.text(`Saldo: ${formatCurrency(saldo)}`, 14, yPos);
  yPos += 6;
  doc.text(`ROI: ${roi.toFixed(1)}%`, 14, yPos);
  yPos += 6;
  doc.text(`Meta Mensal: ${formatCurrency(settings.metaMensal)}`, 14, yPos);
  yPos += 6;
  doc.text(`Custos Fixos: ${formatCurrency(settings.custosFixos)}`, 14, yPos);
  yPos += 15;
  
  // Receitas table
  const receitas = finances.filter(f => f.tipo === 'receita');
  if (receitas.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Receitas', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Área', 'Projeto', 'Valor']],
      body: receitas.map(r => [
        format(new Date(r.data), 'dd/MM/yyyy'),
        r.descricao,
        r.area || '-',
        r.project?.nome || '-',
        formatCurrency(Number(r.valor))
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 8 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  // Despesas table
  const despesas = finances.filter(f => f.tipo === 'despesa');
  if (despesas.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Despesas', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Área', 'Projeto', 'Valor']],
      body: despesas.map(d => [
        format(new Date(d.data), 'dd/MM/yyyy'),
        d.descricao,
        d.area || '-',
        d.project?.nome || '-',
        formatCurrency(Number(d.valor))
      ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 8 },
    });
  }
  
  // Distribuição por área
  if (yPos > 200 || despesas.length > 0) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  const areaDistribution = finances
    .filter(f => f.area)
    .reduce((acc: any, f) => {
      if (!acc[f.area!]) {
        acc[f.area!] = { receitas: 0, despesas: 0 };
      }
      if (f.tipo === 'receita') {
        acc[f.area!].receitas += Number(f.valor);
      } else {
        acc[f.area!].despesas += Number(f.valor);
      }
      return acc;
    }, {});
  
  if (Object.keys(areaDistribution).length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Distribuição por Área', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Área', 'Receitas', 'Despesas', 'Saldo']],
      body: Object.entries(areaDistribution).map(([area, values]: any) => [
        area,
        formatCurrency(values.receitas),
        formatCurrency(values.despesas),
        formatCurrency(values.receitas - values.despesas)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { fontSize: 9 },
    });
  }
  
  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Save PDF
  const fileName = `alcansys-financeiro-${mesFilter}.pdf`;
  doc.save(fileName);
};
