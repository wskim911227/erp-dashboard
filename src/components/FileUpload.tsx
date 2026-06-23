"use client";

import { TableName } from "@/lib/schemas/erp";
import { TABLE_FILE_LABELS } from "@/lib/csv/parser";
import { ACCEPTED_FILE_HINTS } from "@/lib/csv/normalize";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface FileUploadProps {
  files: Partial<Record<TableName, File>>;
  onFileSelect: (table: TableName, file: File) => void;
  rowCounts: Partial<Record<TableName, number>>;
  parseErrors: Partial<Record<TableName, boolean>>;
}

const TABLES: TableName[] = ["products", "customers", "orders", "order_details"];

export default function FileUpload({ files, onFileSelect, rowCounts, parseErrors }: FileUploadProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {TABLES.map((table) => {
        const file = files[table];
        const count = rowCounts[table];
        const uploaded = !!file;
        const hasError = parseErrors[table];
        const isReady = uploaded && !hasError && (count ?? 0) > 0;

        return (
          <label
            key={table}
            className={`relative flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-6 transition-colors ${
              isReady
                ? "border-emerald-400 bg-emerald-50"
                : uploaded
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect(table, f);
              }}
            />
            {isReady ? (
              <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
            ) : uploaded ? (
              <AlertCircle className="mb-2 h-8 w-8 text-amber-500" />
            ) : (
              <Upload className="mb-2 h-8 w-8 text-slate-400" />
            )}
            <span className="text-sm font-semibold text-slate-700">
              {TABLE_FILE_LABELS[table]}
            </span>
            <span className="mt-0.5 text-xs text-slate-400">
              {ACCEPTED_FILE_HINTS[table]}
            </span>
            {uploaded && (
              <span
                className={`mt-1 flex items-center gap-1 text-xs ${
                  isReady ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                <FileText className="h-3 w-3" />
                {file.name} ({count ?? 0}행)
              </span>
            )}
            {!uploaded && (
              <span className="mt-1 text-xs text-slate-400">CSV 파일을 선택하세요</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export function UploadStatus({ files }: { files: Partial<Record<TableName, File>> }) {
  const uploaded = TABLES.filter((t) => files[t]).length;
  const allUploaded = uploaded === 4;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
        allUploaded ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {allUploaded ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {uploaded}/4 파일 업로드 완료
    </div>
  );
}
