"use client";

import { useState, useCallback } from "react";
import { TableName } from "@/lib/schemas/erp";
import { parseCSVFile } from "@/lib/csv/parser";
import { detectTableFromFilename } from "@/lib/csv/normalize";
import { checkMissingColumns } from "@/lib/validation/integrity";
import { ValidationSummary } from "@/lib/validation/integrity";
import { DashboardData } from "@/lib/analytics/kpis";
import FileUpload, { UploadStatus } from "@/components/FileUpload";
import ValidationResults from "@/components/ValidationResults";
import Dashboard from "@/components/Dashboard";
import ReportGenerator from "@/components/ReportGenerator";
import { Sparkles, Loader2 } from "lucide-react";

const ERP_TABLES: TableName[] = ["products", "customers", "orders", "order_details"];

interface ERPData {
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  order_details: Record<string, unknown>[];
}

type AnalysisPhase = "idle" | "running" | "done";

export default function Home() {
  const [files, setFiles] = useState<Partial<Record<TableName, File>>>({});
  const [rowCounts, setRowCounts] = useState<Partial<Record<TableName, number>>>({});
  const [parseErrors, setParseErrors] = useState<Partial<Record<TableName, boolean>>>({});
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState("");
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [validationInsights, setValidationInsights] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardInsights, setDashboardInsights] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allFilesUploaded =
    !!files.products && !!files.customers && !!files.orders && !!files.order_details;

  const allFilesReady =
    allFilesUploaded &&
    ERP_TABLES.every((t) => !parseErrors[t] && (rowCounts[t] ?? 0) > 0);

  const processFile = useCallback(async (table: TableName, file: File) => {
    setFiles((prev) => ({ ...prev, [table]: file }));
    try {
      const parsed = await parseCSVFile(file);
      setRowCounts((prev) => ({ ...prev, [table]: parsed.rows.length }));

      if (parsed.rows.length === 0) {
        setParseErrors((prev) => ({ ...prev, [table]: true }));
        setError(`${file.name}: 데이터 행이 없습니다.`);
        return false;
      }

      const missing = checkMissingColumns(table, parsed.headers);
      if (missing.length > 0) {
        setParseErrors((prev) => ({ ...prev, [table]: true }));
        setError(
          `${file.name} — 인식된 컬럼: [${parsed.headers.join(", ")}]. 매핑 불가: ${missing.join(", ")}`
        );
        return false;
      }

      setParseErrors((prev) => ({ ...prev, [table]: false }));
      return true;
    } catch {
      setParseErrors((prev) => ({ ...prev, [table]: true }));
      setError(`${file.name} CSV 파싱 실패`);
      setRowCounts((prev) => ({ ...prev, [table]: 0 }));
      return false;
    }
  }, []);

  const handleFileSelect = useCallback(
    async (table: TableName, file: File) => {
      const ok = await processFile(table, file);
      if (ok) setError(null);
    },
    [processFile]
  );

  const handleFilesDrop = useCallback(
    async (droppedFiles: File[]) => {
      const csvFiles = droppedFiles.filter((f) => f.name.toLowerCase().endsWith(".csv"));
      if (csvFiles.length === 0) {
        setError("CSV 파일만 업로드할 수 있습니다.");
        return;
      }

      const unrecognized: string[] = [];
      let successCount = 0;

      for (const file of csvFiles) {
        const table = detectTableFromFilename(file.name);
        if (!table) {
          unrecognized.push(file.name);
          continue;
        }
        const ok = await processFile(table, file);
        if (ok) successCount++;
      }

      if (unrecognized.length > 0) {
        setError(`인식할 수 없는 파일: ${unrecognized.join(", ")}`);
      } else if (successCount > 0) {
        setError(null);
      }
    },
    [processFile]
  );

  async function loadAllData(): Promise<ERPData> {
    const data = {} as ERPData;
    for (const table of ERP_TABLES) {
      const file = files[table];
      if (!file) throw new Error(`${table} 파일이 없습니다`);
      const parsed = await parseCSVFile(file);
      data[table] = parsed.rows;
    }
    return data;
  }

  async function handleFullAnalysis() {
    setPhase("running");
    setError(null);
    setProgress("데이터 검증 · 대시보드 · AI 보고서 생성 중...");
    setValidation(null);
    setDashboard(null);
    setReport(null);

    try {
      const data = await loadAllData();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "full", data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 실패");

      setValidation(json.validation);
      setValidationInsights(json.validationInsights);
      setDashboard(json.dashboard);
      setDashboardInsights(json.dashboardInsights);
      setReport(json.report);
      setPhase("done");
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 실패");
      setPhase("idle");
      setProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">ERP 데이터 분석 대시보드</h1>
          <p className="mt-1 text-sm text-slate-500">
            CSV 4개 업로드 → 검증 · 대시보드 · AI 보고서 원클릭 생성
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">ERP CSV 파일 업로드</h2>
          <FileUpload
            files={files}
            onFileSelect={handleFileSelect}
            onFilesDrop={handleFilesDrop}
            rowCounts={rowCounts}
            parseErrors={parseErrors}
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <UploadStatus files={files} />
            <button
              onClick={handleFullAnalysis}
              disabled={!allFilesReady || phase === "running"}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-violet-700 disabled:opacity-50"
            >
              {phase === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              전체 분석 시작
            </button>
          </div>
          {progress && (
            <p className="mt-4 text-center text-sm text-blue-600">{progress}</p>
          )}
        </section>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {phase === "done" && validation && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                1. 데이터 검증 (Zod + 참조 무결성)
              </h2>
              <ValidationResults validation={validation} aiInsights={validationInsights} />
            </section>

            {dashboard && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-slate-800">2. KPI 대시보드</h2>
                <Dashboard data={dashboard} aiInsights={dashboardInsights} />
              </section>
            )}

            {dashboard && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-slate-800">
                  3. AI 보고서 (Gemini)
                </h2>
                <ReportGenerator dashboard={dashboard} report={report} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
