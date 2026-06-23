"use client";

import { ValidationSummary } from "@/lib/validation/integrity";
import { CheckCircle, XCircle, AlertTriangle, Sparkles } from "lucide-react";

interface ValidationResultsProps {
  validation: ValidationSummary;
  aiInsights: string | null;
}

export default function ValidationResults({ validation, aiInsights }: ValidationResultsProps) {
  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-3 rounded-xl p-4 ${
          validation.isValid ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
        }`}
      >
        {validation.isValid ? (
          <CheckCircle className="h-6 w-6 shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 shrink-0" />
        )}
        <div>
          <p className="font-semibold">
            {validation.isValid ? "데이터 검증 통과" : "데이터 검증 실패"}
          </p>
          <p className="text-sm opacity-80">
            Zod 스키마 검증 및 참조 무결성 점검 완료
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {validation.tables.map((table) => (
          <div
            key={table.table}
            className={`rounded-xl border p-4 ${
              table.valid ? "border-emerald-200 bg-white" : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{table.label}</h3>
              {table.valid ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {table.validRows}
              <span className="text-sm font-normal text-slate-500">/{table.totalRows}행</span>
            </p>
            {table.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{table.errors.length}개 오류</p>
            )}
          </div>
        ))}
      </div>

      {validation.integrityIssues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">
              참조 무결성 이슈 ({validation.integrityIssues.length}건)
            </h3>
          </div>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900">
            {validation.integrityIssues.slice(0, 20).map((issue, i) => (
              <li key={i} className="rounded bg-white/60 px-2 py-1">
                [{issue.table}] {issue.row}행 · {issue.field}: {issue.message}
              </li>
            ))}
            {validation.integrityIssues.length > 20 && (
              <li className="text-amber-600">
                ...외 {validation.integrityIssues.length - 20}건
              </li>
            )}
          </ul>
        </div>
      )}

      {validation.tables.some((t) => t.errors.length > 0) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="mb-3 font-semibold text-red-800">스키마 오류 상세</h3>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-red-900">
            {validation.tables.flatMap((t) =>
              t.errors.slice(0, 10).map((err, i) => (
                <li key={`${t.table}-${i}`} className="rounded bg-white/60 px-2 py-1">
                  [{t.label}] {err.row}행 · {err.field}: {err.message}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {aiInsights && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-violet-800">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-semibold">Gemini AI 데이터 품질 분석</h3>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {aiInsights}
          </p>
        </div>
      )}
    </div>
  );
}
