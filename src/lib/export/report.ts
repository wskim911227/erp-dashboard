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

const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_PADDING_PX = 48;
const CONTENT_MAX_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING_PX * 2;

const BASE_TEXT_STYLE =
  "font-family:" + KOREAN_FONT + ";font-size:14px;line-height:1.75;color:#1e293b;margin:0;";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportLineToHtml(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) {
    return `<div style="height:10px"></div>`;
  }
  if (trimmed.startsWith("### ")) {
    return `<h3 style="${BASE_TEXT_STYLE}font-size:15px;font-weight:700;margin:16px 0 8px;color:#1e293b">${escapeHtml(trimmed.slice(4))}</h3>`;
  }
  if (trimmed.startsWith("## ")) {
    return `<h2 style="${BASE_TEXT_STYLE}font-size:17px;font-weight:700;margin:20px 0 10px;color:#0f172a">${escapeHtml(trimmed.slice(3))}</h2>`;
  }
  if (trimmed.startsWith("# ")) {
    return `<h1 style="${BASE_TEXT_STYLE}font-size:19px;font-weight:700;margin:24px 0 12px;color:#0f172a">${escapeHtml(trimmed.slice(2))}</h1>`;
  }
  if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
    const bullet = trimmed.replace(/^[-*]\s*/, "");
    return `<p style="${BASE_TEXT_STYLE}margin:4px 0 4px 16px">• ${escapeHtml(bullet)}</p>`;
  }
  return `<p style="${BASE_TEXT_STYLE}margin:6px 0">${escapeHtml(trimmed.replace(/\*\*/g, ""))}</p>`;
}

function buildKpiTableHtml(dashboard: DashboardData): string {
  const { overview } = dashboard;
  const rows = [
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
  ];

  return `
    <h2 style="${BASE_TEXT_STYLE}font-size:16px;font-weight:700;margin:0 0 12px;color:#1e40af;border-bottom:2px solid #dbeafe;padding-bottom:6px">
      핵심 KPI 요약
    </h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:13px;font-family:${KOREAN_FONT}">
      <thead>
        <tr style="background:#2563eb;color:white">
          <th style="padding:10px 12px;text-align:left;font-weight:600">지표</th>
          <th style="padding:10px 12px;text-align:right;font-weight:600">값</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([label, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
            <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</td>
            <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${escapeHtml(value)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

function buildCoverHtml(dashboard: DashboardData): string {
  return `
    <h1 style="${BASE_TEXT_STYLE}text-align:center;font-size:24px;font-weight:800;margin:0 0 8px;color:#0f172a">
      ERP 데이터 분석 보고서
    </h1>
    <p style="${BASE_TEXT_STYLE}text-align:center;font-size:12px;color:#64748b;margin:0 0 24px">
      생성일: ${escapeHtml(new Date(dashboard.generatedAt).toLocaleString("ko-KR"))}
    </p>`;
}

function createMeasurer(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: -20000px;
    top: 0;
    width: ${PAGE_WIDTH_PX - PAGE_PADDING_PX * 2}px;
    visibility: hidden;
    pointer-events: none;
  `;
  document.body.appendChild(el);
  return el;
}

function measureHtml(measurer: HTMLDivElement, html: string): number {
  measurer.innerHTML = html;
  return measurer.getBoundingClientRect().height;
}

/** 긴 문단을 페이지 높이에 맞게 분할 */
function splitOverflowBlock(
  measurer: HTMLDivElement,
  html: string,
  maxHeight: number
): string[] {
  const textMatch = html.match(/>([^<]+)</);
  if (!textMatch) return [html];

  const prefix = html.slice(0, html.indexOf(">") + 1);
  const suffix = "</p>";
  const fullText = textMatch[1];
  const words = fullText.split(/\s+/);
  const parts: string[] = [];
  let chunk = "";

  for (const word of words) {
    const candidate = chunk ? `${chunk} ${word}` : word;
    const candidateHtml = `${prefix}${escapeHtml(candidate)}${suffix}`;
    if (measureHtml(measurer, candidateHtml) > maxHeight && chunk) {
      parts.push(`${prefix}${escapeHtml(chunk)}${suffix}`);
      chunk = word;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) parts.push(`${prefix}${escapeHtml(chunk)}${suffix}`);
  return parts.length > 0 ? parts : [html];
}

function paginateBlocks(
  measurer: HTMLDivElement,
  blocks: string[]
): string[][] {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentHeight = 0;

  for (let block of blocks) {
    let blockHeight = measureHtml(measurer, block);

    if (blockHeight > CONTENT_MAX_HEIGHT) {
      const split = splitOverflowBlock(measurer, block, CONTENT_MAX_HEIGHT);
      for (const part of split) {
        block = part;
        blockHeight = measureHtml(measurer, block);
        if (currentHeight + blockHeight > CONTENT_MAX_HEIGHT && currentPage.length > 0) {
          pages.push(currentPage);
          currentPage = [block];
          currentHeight = blockHeight;
        } else {
          currentPage.push(block);
          currentHeight += blockHeight;
        }
      }
      continue;
    }

    if (currentHeight + blockHeight > CONTENT_MAX_HEIGHT && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [block];
      currentHeight = blockHeight;
    } else {
      currentPage.push(block);
      currentHeight += blockHeight;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

function buildContentBlocks(report: string, dashboard: DashboardData): string[] {
  const blocks = [
    buildCoverHtml(dashboard),
    buildKpiTableHtml(dashboard),
    `<h2 style="${BASE_TEXT_STYLE}font-size:16px;font-weight:700;margin:16px 0 12px;color:#1e40af;border-bottom:2px solid #dbeafe;padding-bottom:6px">AI 분석 보고서</h2>`,
    ...report.split("\n").map(reportLineToHtml),
  ];
  return blocks.filter((b) => b.trim().length > 0);
}

async function renderPageToCanvas(blocksHtml: string[]): Promise<HTMLCanvasElement> {
  const page = document.createElement("div");
  page.style.cssText = `
    position: fixed;
    left: -10000px;
    top: 0;
    width: ${PAGE_WIDTH_PX}px;
    height: ${PAGE_HEIGHT_PX}px;
    padding: ${PAGE_PADDING_PX}px;
    box-sizing: border-box;
    background: #ffffff;
    overflow: hidden;
    font-family: ${KOREAN_FONT};
  `;
  page.innerHTML = blocksHtml.join("");
  document.body.appendChild(page);

  try {
    return await html2canvas(page, {
      scale: 2,
      width: PAGE_WIDTH_PX,
      height: PAGE_HEIGHT_PX,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  } finally {
    document.body.removeChild(page);
  }
}

export async function downloadReportPDF(
  report: string,
  dashboard: DashboardData
): Promise<void> {
  const measurer = createMeasurer();

  try {
    await document.fonts.ready;

    const blocks = buildContentBlocks(report, dashboard);
    const pages = paginateBlocks(measurer, blocks);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const canvas = await renderPageToCanvas(pages[i]);
      if (i > 0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pageWidth,
        pageHeight
      );
    }

    pdf.save(`ERP_분석보고서_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(measurer);
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
