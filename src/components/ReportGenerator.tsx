"use client";

import { useState } from "react";
import { DashboardData } from "@/lib/analytics/kpis";
import { downloadReportPDF, downloadReportWord } from "@/lib/export/report";
import { FileDown, FileText, Loader2, Sparkles } from "lucide-react";

interface ReportGeneratorProps {
  dashboard: DashboardData;
  validationInsights: string;
  dashboardInsights: string;
}

export default function ReportGenerator({
  dashboard,
  validationInsights,
  dashboardInsights,
}: ReportGeneratorProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "word" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboard, validationInsights, dashboardInsights }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "보고서 생성 실패");
      setReport(json.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "보고서 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!report) return;
    setDownloading("pdf");
    try {
      downloadReportPDF(report, dashboard);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Gemini AI 보고서 생성
        </button>

        {report && (
          <>
            <button
              onClick={handleDownloadPDF}
              disabled={!!downloading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {report && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">AI 경영 분석 보고서</h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
            {report}
          </div>
        </div>
      )}
    </div>
  );
}
