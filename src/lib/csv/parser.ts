import Papa from "papaparse";
import { TableName } from "@/lib/schemas/erp";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, unknown>[];
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data.map((row) => {
          const normalized: Record<string, unknown> = {};
          Object.entries(row).forEach(([key, value]) => {
            normalized[key.trim()] = value?.trim() ?? "";
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
