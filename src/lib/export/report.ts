import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import { DashboardData, formatCurrency, formatPercent } from "@/lib/analytics/kpis";

function splitMarkdownLines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/^[-*]\s*/, "• ").trim())
    .filter(Boolean);
}

export function downloadReportPDF(
  report: string,
  dashboard: DashboardData
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFontSize(18);
  doc.text("ERP 데이터 분석 보고서", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `생성일: ${new Date(dashboard.generatedAt).toLocaleString("ko-KR")}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 15;

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text("핵심 KPI 요약", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["지표", "값"]],
    body: [
      ["총 매출", formatCurrency(dashboard.sales.totalRevenue)],
      ["총 주문", `${dashboard.sales.totalOrders}건`],
      ["평균 주문금액", formatCurrency(dashboard.sales.averageOrderValue)],
      ["매출총이익률", formatPercent(dashboard.profitability.grossMargin)],
      ["활성 고객", `${dashboard.customers.activeCustomers}명`],
      ["재고 자산가치", formatCurrency(dashboard.inventory.totalStockValue)],
    ],
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 15;

  doc.setFontSize(12);
  doc.text("AI 분석 보고서", margin, y);
  y += 8;

  doc.setFontSize(10);
  const lines = splitMarkdownLines(report);
  const maxWidth = pageWidth - margin * 2;

  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    wrapped.forEach((textLine: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(textLine, margin, y);
      y += 6;
    });
    y += 2;
  });

  doc.save(`ERP_분석보고서_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function downloadReportWord(
  report: string,
  dashboard: DashboardData
): Promise<void> {
  const lines = splitMarkdownLines(report);

  const children: Paragraph[] = [
    new Paragraph({
      text: "ERP 데이터 분석 보고서",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `생성일: ${new Date(dashboard.generatedAt).toLocaleString("ko-KR")}`,
          color: "666666",
          size: 20,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "핵심 KPI 요약",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun(`총 매출: ${formatCurrency(dashboard.sales.totalRevenue)}\n`),
        new TextRun(`총 주문: ${dashboard.sales.totalOrders}건\n`),
        new TextRun(`평균 주문금액: ${formatCurrency(dashboard.sales.averageOrderValue)}\n`),
        new TextRun(`매출총이익률: ${formatPercent(dashboard.profitability.grossMargin)}\n`),
        new TextRun(`활성 고객: ${dashboard.customers.activeCustomers}명\n`),
        new TextRun(`재고 자산가치: ${formatCurrency(dashboard.inventory.totalStockValue)}`),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "AI 분석 보고서",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 },
        })
    ),
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ERP_분석보고서_${new Date().toISOString().slice(0, 10)}.docx`);
}
