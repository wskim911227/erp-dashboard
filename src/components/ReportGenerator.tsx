"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/analytics/kpis";
import { downloadReportPDF, downloadReportWord } from "@/lib/export/report";
import { FileDown, FileText, Loader2 } from "lucide-react";

interface ReportGeneratorProps {
  dashboard: DashboardData;
  report: string | null;
  loading?: boolean;
}

export default function ReportGenerator({
  dashboard,
  report,
  loading = false,
}: ReportGeneratorProps) {
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);

  async function handleDownloadPDF() {
    if (!report) return;
    setDownloading("pdf");
    try {
      await downloadReportPDF(report, dashboard);
    } finally {
      setDownloading(null);
    }
  }

  async function handleDownloadWord() {
    if (!report) return;
    setDownloading("word");
    try {
      await downloadReportWord(report, dashboard);
    } finally {
      setDownloading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-6 text-violet-800">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Gemini AI 보고서 생성 중...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        AI 보고서를 생성하지 못했습니다. GEMINI_API_KEY 환경변수를 확인해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={!!downloading}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {downloading === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          PDF 다운로드
        </button>
        <button
          onClick={handleDownloadWord}
          disabled={!!downloading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {downloading === "word" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Word 다운로드
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">AI 경영 분석 보고서</h3>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
          {report}
        </div>
      </div>
    </div>
  );
}
