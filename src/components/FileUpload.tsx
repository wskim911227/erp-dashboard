"use client";

import { useCallback, useState } from "react";
import { TableName } from "@/lib/schemas/erp";
import { TABLE_FILE_LABELS } from "@/lib/csv/parser";
import { ACCEPTED_FILE_HINTS } from "@/lib/csv/normalize";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface FileUploadProps {
  files: Partial<Record<TableName, File>>;
  onFileSelect: (table: TableName, file: File) => void;
  onFilesDrop: (files: File[]) => void;
  rowCounts: Partial<Record<TableName, number>>;
  parseErrors: Partial<Record<TableName, boolean>>;
}

const TABLES: TableName[] = ["products", "customers", "orders", "order_details"];

export default function FileUpload({
  files,
  onFileSelect,
  onFilesDrop,
  rowCounts,
  parseErrors,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.name.toLowerCase().endsWith(".csv")
      );
      if (dropped.length > 0) onFilesDrop(dropped);
    },
    [onFilesDrop]
  );

  const handleMultiInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      if (selected.length > 0) onFilesDrop(selected);
      e.target.value = "";
    },
    [onFilesDrop]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
        }`}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          id="csv-multi-upload"
          onChange={handleMultiInput}
        />
        <Upload
          className={`mx-auto mb-3 h-10 w-10 ${isDragging ? "text-blue-600" : "text-slate-400"}`}
        />
        <p className="text-sm font-semibold text-slate-700">
          CSV 파일 4개를 여기에 드래그 앤 드롭
        </p>
        <p className="mt-1 text-xs text-slate-500">
          products · customers · sales_orders · sales_order_items (파일명으로 자동 매칭)
        </p>
        <label
          htmlFor="csv-multi-upload"
          className="mt-4 inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          또는 파일 선택
        </label>
      </div>

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
              className={`relative flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-5 transition-colors ${
                isReady
                  ? "border-emerald-400 bg-emerald-50"
                  : uploaded
                    ? "border-amber-400 bg-amber-50"
                    : "border-slate-200 bg-white"
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
                <CheckCircle className="mb-2 h-7 w-7 text-emerald-500" />
              ) : uploaded ? (
                <AlertCircle className="mb-2 h-7 w-7 text-amber-500" />
              ) : (
                <FileText className="mb-2 h-7 w-7 text-slate-300" />
              )}
              <span className="text-sm font-semibold text-slate-700">
                {TABLE_FILE_LABELS[table]}
              </span>
              <span className="mt-0.5 text-xs text-slate-400">
                {ACCEPTED_FILE_HINTS[table]}
              </span>
              {uploaded ? (
                <span
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    isReady ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  {file.name} ({count ?? 0}행)
                </span>
              ) : (
                <span className="mt-1 text-xs text-slate-400">미업로드</span>
              )}
            </label>
          );
        })}
      </div>
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
