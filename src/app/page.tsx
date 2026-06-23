"use client";

import { useState, useCallback } from "react";
import { TableName } from "@/lib/schemas/erp";
import { parseCSVFile } from "@/lib/csv/parser";
import { normalizeTable } from "@/lib/csv/normalize";
import { checkMissingColumns } from "@/lib/validation/integrity";
import { ValidationSummary } from "@/lib/validation/integrity";
import { DashboardData } from "@/lib/analytics/kpis";
import FileUpload, { UploadStatus } from "@/components/FileUpload";
import ValidationResults from "@/components/ValidationResults";
import Dashboard from "@/components/Dashboard";
import ReportGenerator from "@/components/ReportGenerator";
import {
  BarChart3,
  ShieldCheck,
  FileBarChart,
  Loader2,
  ChevronRight,
} from "lucide-react";

const ERP_TABLES: TableName[] = ["products", "customers", "orders", "order_details"];

type Step = "upload" | "validation" | "dashboard" | "report";

interface ERPData {
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  order_details: Record<string, unknown>[];
}

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "upload", label: "데이터 업로드", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "validation", label: "데이터 검증", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "dashboard", label: "대시보드", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "report", label: "AI 보고서", icon: <FileBarChart className="h-4 w-4" /> },
];

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<Partial<Record<TableName, File>>>({});
  const [rowCounts, setRowCounts] = useState<Partial<Record<TableName, number>>>({});
  const [parseErrors, setParseErrors] = useState<Partial<Record<TableName, boolean>>>({});
  const [erpData, setErpData] = useState<ERPData | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [validationInsights, setValidationInsights] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardInsights, setDashboardInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilesUploaded =
    !!files.products && !!files.customers && !!files.orders && !!files.order_details;

  const handleFileSelect = useCallback(async (table: TableName, file: File) => {
    setFiles((prev) => ({ ...prev, [table]: file }));
    try {
      const parsed = await parseCSVFile(file);

      setRowCounts((prev) => ({ ...prev, [table]: parsed.rows.length }));

      if (parsed.rows.length === 0) {
        setParseErrors((prev) => ({ ...prev, [table]: true }));
        setError(`${file.name}: 데이터 행이 없습니다. CSV 파일 내용을 확인해 주세요.`);
        return;
      }

      const missing = checkMissingColumns(table, parsed.headers);
      if (missing.length > 0) {
        setParseErrors((prev) => ({ ...prev, [table]: true }));
        setError(
          `${file.name} — 인식된 컬럼: [${parsed.headers.join(", ")}]. 매핑 불가: ${missing.join(", ")}`
        );
        return;
      }

      setParseErrors((prev) => ({ ...prev, [table]: false }));
      setError(null);
    } catch {
      setParseErrors((prev) => ({ ...prev, [table]: true }));
      setError(`${file.name} CSV 파싱 실패`);
      setRowCounts((prev) => ({ ...prev, [table]: 0 }));
    }
  }, []);

  const allFilesReady =
    allFilesUploaded &&
    ERP_TABLES.every((t) => !parseErrors[t] && (rowCounts[t] ?? 0) > 0);

  async function loadAllData(): Promise<ERPData> {
    const tables: TableName[] = ERP_TABLES;
    const data = {} as ERPData;
    for (const table of tables) {
      const file = files[table];
      if (!file) throw new Error(`${table} 파일이 없습니다`);
      const parsed = await parseCSVFile(file);
      data[table] = normalizeTable(table, parsed.rows);
    }
    return data;
  }

  async function handleValidate() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAllData();
      setErpData(data);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "검증 실패");
      setValidation(json.validation);
      setValidationInsights(json.aiInsights);
      setStep("validation");
    } catch (e) {
      setError(e instanceof Error ? e.message : "검증 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = erpData ?? (await loadAllData());
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "insights", data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "대시보드 생성 실패");
      setValidation(json.validation);
      setDashboard(json.dashboard);
      setValidationInsights(json.validationInsights);
      setDashboardInsights(json.dashboardInsights);
      setStep("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "대시보드 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">
            ERP 데이터 분석 대시보드
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            CSV 업로드 → Zod 검증 → KPI 대시보드 → Gemini AI 보고서
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const stepIndex = STEPS.findIndex((x) => x.id === step);
            const thisIndex = STEPS.findIndex((x) => x.id === s.id);
            const isDone = thisIndex < stepIndex;

            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id === "upload") setStep("upload");
                  else if (s.id === "validation" && validation) setStep("validation");
                  else if (s.id === "dashboard" && dashboard) setStep("dashboard");
                  else if (s.id === "report" && dashboard) setStep("report");
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : isDone
                      ? "bg-blue-100 text-blue-700"
                      : "bg-white text-slate-500"
                }`}
              >
                {s.icon}
                {s.label}
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
              </button>
            );
          })}
        </nav>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "upload" && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                ERP CSV 파일 업로드
              </h2>
              <FileUpload
                files={files}
                onFileSelect={handleFileSelect}
                rowCounts={rowCounts}
                parseErrors={parseErrors}
              />
              <div className="mt-6 flex items-center justify-between">
                <UploadStatus files={files} />
                <button
                  onClick={handleValidate}
                  disabled={!allFilesReady || loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  데이터 검증 시작
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "validation" && validation && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                1. 데이터 검증 (Zod + 참조 무결성)
              </h2>
              <ValidationResults validation={validation} aiInsights={validationInsights} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleDashboard}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  대시보드 생성
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "dashboard" && dashboard && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                2. KPI 대시보드
              </h2>
              <Dashboard data={dashboard} aiInsights={dashboardInsights} />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep("report")}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  <FileBarChart className="h-4 w-4" />
                  AI 보고서 작성
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "report" && dashboard && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">
                3. AI 보고서 생성 (Gemini)
              </h2>
              <ReportGenerator
                dashboard={dashboard}
                validationInsights={validationInsights ?? ""}
                dashboardInsights={dashboardInsights ?? ""}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
