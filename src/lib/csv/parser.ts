import Papa from "papaparse";
import { TableName } from "@/lib/schemas/erp";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, unknown>[];
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim();
}

function isNonEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).some((v) => String(v ?? "").trim() !== "");
}

export async function parseCSVFile(file: File): Promise<ParsedCSV> {
  const text = await file.text();

  if (!text.trim()) {
    return { headers: [], rows: [] };
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: normalizeHeader,
      complete: (results) => {
        const headers = (results.meta.fields ?? []).map(normalizeHeader);
        const rows = results.data
          .filter(isNonEmptyRow)
          .map((row) => {
            const normalized: Record<string, unknown> = {};
            Object.entries(row).forEach(([key, value]) => {
              normalized[normalizeHeader(key)] = String(value ?? "").trim();
            });
            return normalized;
          });

        resolve({ headers, rows });
      },
      error: (error) => reject(error),
    });
  });
}

export const TABLE_FILE_KEYS: Record<TableName, string> = {
  products: "products",
  customers: "customers",
  orders: "orders",
  order_details: "order_details",
};

export const TABLE_FILE_LABELS: Record<TableName, string> = {
  products: "상품",
  customers: "고객",
  orders: "주문",
  order_details: "주문상세",
};
