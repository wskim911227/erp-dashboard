import { TableName } from "@/lib/schemas/erp";

/** CSV 원본 컬럼 → 표준 스키마 컬럼 매핑 */
const COLUMN_ALIASES: Record<TableName, Record<string, string>> = {
  products: {
    product_id: "product_id",
    product_name: "name",
    name: "name",
    category: "category",
    unit_price_krw: "price",
    price: "price",
    unit_cost_krw: "cost",
    cost: "cost",
    stock_qty: "stock_quantity",
    stock_quantity: "stock_quantity",
  },
  customers: {
    customer_id: "customer_id",
    customer_name: "name",
    name: "name",
    email: "email",
    customer_type: "segment",
    segment: "segment",
    tier: "segment",
    city: "region",
    region: "region",
  },
  orders: {
    order_id: "order_id",
    order_no: "order_id",
    customer_id: "customer_id",
    order_date: "order_date",
    status: "status",
  },
  order_details: {
    detail_id: "detail_id",
    order_item_id: "detail_id",
    order_id: "order_id",
    order_no: "order_id",
    product_id: "product_id",
    quantity: "quantity",
    qty: "quantity",
    unit_price: "unit_price",
    unit_price_krw: "unit_price",
  },
};

/** 한국어 주문 상태 → 표준 status */
const STATUS_MAP: Record<string, string> = {
  배송완료: "completed",
  결제완료: "completed",
  완료: "completed",
  completed: "completed",
  배송중: "shipped",
  shipped: "shipped",
  주문접수: "pending",
  pending: "pending",
  취소: "cancelled",
  반품: "cancelled",
  cancelled: "cancelled",
  canceled: "cancelled",
};

const REQUIRED_BY_TABLE: Record<TableName, string[]> = {
  products: ["product_id", "name", "category", "price", "cost", "stock_quantity"],
  customers: ["customer_id", "name", "email", "segment", "region"],
  orders: ["order_id", "customer_id", "order_date", "status"],
  order_details: ["detail_id", "order_id", "product_id", "quantity", "unit_price"],
};

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim();
}

function pickValue(
  row: Record<string, unknown>,
  aliases: Record<string, string>,
  targetField: string
): unknown {
  for (const [sourceCol, mappedField] of Object.entries(aliases)) {
    if (mappedField !== targetField) continue;
    if (sourceCol in row && row[sourceCol] !== "" && row[sourceCol] != null) {
      return row[sourceCol];
    }
  }
  return undefined;
}

function normalizeStatus(value: unknown): string {
  const raw = String(value ?? "").trim();
  return STATUS_MAP[raw] ?? raw.toLowerCase();
}

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

export function getSupportedSourceColumns(table: TableName): string[] {
  return Object.keys(COLUMN_ALIASES[table]);
}

export function checkColumnsResolvable(
  table: TableName,
  headers: string[]
): { ok: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(normalizeHeader);
  const aliases = COLUMN_ALIASES[table];
  const missing: string[] = [];

  for (const required of REQUIRED_BY_TABLE[table]) {
    const hasSource = Object.entries(aliases).some(
      ([source, target]) =>
        target === required && normalizedHeaders.includes(source)
    );
    if (!hasSource) missing.push(required);
  }

  return { ok: missing.length === 0, missing };
}

export function normalizeRow(
  table: TableName,
  row: Record<string, unknown>
): Record<string, unknown> {
  const aliases = COLUMN_ALIASES[table];
  const normalized: Record<string, unknown> = {};

  for (const field of REQUIRED_BY_TABLE[table]) {
    normalized[field] = pickValue(row, aliases, field);
  }

  if (table === "products" || table === "order_details") {
    normalized.product_id = normalizeId(normalized.product_id);
  }
  if (table === "customers" || table === "orders") {
    normalized.customer_id = normalizeId(normalized.customer_id);
  }
  if (table === "orders" || table === "order_details") {
    if (table === "orders") {
      normalized.order_id = normalizeId(normalized.order_id);
      normalized.status = normalizeStatus(normalized.status);
    } else {
      normalized.order_id = normalizeId(normalized.order_id);
      normalized.detail_id = normalizeId(normalized.detail_id);
    }
  }
  if (table === "products") {
    normalized.product_id = normalizeId(normalized.product_id);
  }

  return normalized;
}

export function normalizeTable(
  table: TableName,
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const trimmed: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      trimmed[normalizeHeader(key)] =
        typeof value === "string" ? value.trim() : value;
    });
    return normalizeRow(table, trimmed);
  });
}

export const ACCEPTED_FILE_HINTS: Record<TableName, string> = {
  products: "products.csv",
  customers: "customers.csv",
  orders: "orders.csv · sales_orders.csv",
  order_details: "order_details.csv · sales_order_items.csv",
};
