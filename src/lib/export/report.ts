import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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

const KOREAN_FONT =
  "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatReportHtml(report: string): string {
  return report
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<br/>";
      if (trimmed.startsWith("### ")) {
        return `<h3 style="font-size:15px;font-weight:700;margin:16px 0 8px;color:#1e293b">${escapeHtml(trimmed.slice(4))}</h3>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2 style="font-size:17px;font-weight:700;margin:20px 0 10px;color:#0f172a">${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h1 style="font-size:19px;font-weight:700;margin:24px 0 12px;color:#0f172a">${escapeHtml(trimmed.slice(2))}</h1>`;
      }
      const bullet = trimmed.replace(/^[-*]\s*/, "");
      if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return `<p style="margin:4px 0 4px 16px">• ${escapeHtml(bullet)}</p>`;
      }
      const bold = trimmed.replace(/\*\*/g, "");
      return `<p style="margin:6px 0">${escapeHtml(bold)}</p>`;
    })
    .join("");
}

function buildReportElement(report: string, dashboard: DashboardData): HTMLDivElement {
  const { overview } = dashboard;
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: -10000px;
    top: 0;
    width: 794px;
    padding: 48px;
    background: #ffffff;
    color: #1e293b;
    font-family: ${KOREAN_FONT};
    font-size: 14px;
    line-height: 1.75;
    box-sizing: border-box;
  `;

  el.innerHTML = `
    <h1 style="text-align:center;font-size:24px;font-weight:800;margin:0 0 8px;color:#0f172a">
      ERP 데이터 분석 보고서
    </h1>
    <p style="text-align:center;font-size:12px;color:#64748b;margin:0 0 32px">
      생성일: ${escapeHtml(new Date(dashboard.generatedAt).toLocaleString("ko-KR"))}
    </p>

    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#1e40af;border-bottom:2px solid #dbeafe;padding-bottom:6px">
      핵심 KPI 요약
    </h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px">
      <thead>
        <tr style="background:#2563eb;color:white">
          <th style="padding:10px 12px;text-align:left;font-weight:600">지표</th>
          <th style="padding:10px 12px;text-align:right;font-weight:600">값</th>
        </tr>
      </thead>
      <tbody>
        ${[
          ["유효매출", formatCurrency(overview.validRevenue)],
          ["유효주문", `${overview.validOrderCount.toLocaleString()}건`],
          ["매출원가", formatCurrency(overview.totalCost)],
          ["매출총이익", formatCurrency(overview.grossProfit)],
          ["매출총이익률", formatPercent(overview.grossMargin)],
          ["평균 주문금액", formatCurrency(overview.averageOrderValue)],
          ["판매 수량", `${overview.totalQuantitySold.toLocaleString()}개`],
          ["취소율", formatPercent(overview.cancellationRate)],
          ["반품율", formatPercent(overview.returnRate)],
          ["활성 고객", `${overview.activeCustomers.toLocaleString()}명`],
          ["총 거래액", formatCurrency(overview.totalTransactionVolume)],
        ]
          .map(
            ([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
            <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</td>
            <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${escapeHtml(value)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#1e40af;border-bottom:2px solid #dbeafe;padding-bottom:6px">
      AI 분석 보고서
    </h2>
    <div>${formatReportHtml(report)}</div>
  `;

  return el;
}

export async function downloadReportPDF(
  report: string,
  dashboard: DashboardData
): Promise<void> {
  const element = buildReportElement(report, dashboard);
  document.body.appendChild(element);

  try {
    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL("image/png");

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`ERP_분석보고서_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(element);
  }
}

function koreanText(text: string, opts?: { bold?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text,
    font: "Malgun Gothic",
    bold: opts?.bold,
    size: opts?.size,
    color: opts?.color,
  });
}

export async function downloadReportWord(
  report: string,
  dashboard: DashboardData
): Promise<void> {
  const { overview } = dashboard;
  const lines = report
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/^[-*]\s*/, "• ").trim())
    .filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      children: [koreanText("ERP 데이터 분석 보고서", { bold: true, size: 36 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        koreanText(
          `생성일: ${new Date(dashboard.generatedAt).toLocaleString("ko-KR")}`,
          { color: "666666", size: 20 }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [koreanText("핵심 KPI 요약", { bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        koreanText(`유효매출: ${formatCurrency(overview.validRevenue)}\n`),
        koreanText(`유효주문: ${overview.validOrderCount.toLocaleString()}건\n`),
        koreanText(`매출총이익률: ${formatPercent(overview.grossMargin)}\n`),
        koreanText(`활성 고객: ${overview.activeCustomers.toLocaleString()}명\n`),
        koreanText(`총 거래액: ${formatCurrency(overview.totalTransactionVolume)}`),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [koreanText("AI 분석 보고서", { bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          children: [koreanText(line)],
          spacing: { after: 120 },
        })
    ),
  ];

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ERP_분석보고서_${new Date().toISOString().slice(0, 10)}.docx`);
}
