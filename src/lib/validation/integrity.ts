import {
  Customer,
  Order,
  OrderDetail,
  Product,
  TableName,
  TABLE_LABELS,
  ERP_SCHEMAS,
  REQUIRED_COLUMNS,
} from "@/lib/schemas/erp";

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface TableValidationResult {
  table: TableName;
  label: string;
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: RowError[];
}

export interface IntegrityIssue {
  type: "missing_reference" | "duplicate_key" | "date_invalid";
  table: TableName;
  row: number;
  field: string;
  message: string;
}

export interface ValidationSummary {
  tables: TableValidationResult[];
  integrityIssues: IntegrityIssue[];
  isValid: boolean;
  data: {
    products: Product[];
    customers: Customer[];
    orders: Order[];
    order_details: OrderDetail[];
  };
}

function validateTable<T>(
  table: TableName,
  rows: Record<string, unknown>[]
): { errors: RowError[]; validRows: T[] } {
  const schema = ERP_SCHEMAS[table];
  const errors: RowError[] = [];
  const validRows: T[] = [];

  rows.forEach((row, index) => {
    const result = schema.safeParse(row);
    if (result.success) {
      validRows.push(result.data as T);
    } else {
      result.error.issues.forEach((issue) => {
        errors.push({
          row: index + 2,
          field: issue.path.join("."),
          message: issue.message,
        });
      });
    }
  });

  return { errors, validRows };
}

function checkDuplicateKeys(
  table: TableName,
  rows: Record<string, unknown>[],
  keyField: string
): IntegrityIssue[] {
  const seen = new Map<string, number>();
  const issues: IntegrityIssue[] = [];

  rows.forEach((row, index) => {
    const key = String(row[keyField] ?? "");
    if (!key) return;
    if (seen.has(key)) {
      issues.push({
        type: "duplicate_key",
        table,
        row: index + 2,
        field: keyField,
        message: `${keyField} '${key}' 중복 (첫 등장: ${seen.get(key)}행)`,
      });
    } else {
      seen.set(key, index + 2);
    }
  });

  return issues;
}

function checkReferentialIntegrity(
  products: Product[],
  customers: Customer[],
  orders: Order[],
  orderDetails: OrderDetail[],
  rawOrders: Record<string, unknown>[],
  rawOrderDetails: Record<string, unknown>[]
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const productIds = new Set(products.map((p) => p.product_id));
  const customerIds = new Set(customers.map((c) => c.customer_id));
  const orderIds = new Set(orders.map((o) => o.order_id));

  rawOrders.forEach((row, index) => {
    const customerId = String(row.customer_id ?? "");
    if (customerId && !customerIds.has(customerId)) {
      issues.push({
        type: "missing_reference",
        table: "orders",
        row: index + 2,
        field: "customer_id",
        message: `customer_id '${customerId}'가 고객 테이블에 없습니다`,
      });
    }
    const dateStr = String(row.order_date ?? "");
    if (dateStr && isNaN(Date.parse(dateStr))) {
      issues.push({
        type: "date_invalid",
        table: "orders",
        row: index + 2,
        field: "order_date",
        message: `order_date '${dateStr}'는 유효한 날짜가 아닙니다`,
      });
    }
  });

  rawOrderDetails.forEach((row, index) => {
    const orderId = String(row.order_id ?? "");
    const productId = String(row.product_id ?? "");
    if (orderId && !orderIds.has(orderId)) {
      issues.push({
        type: "missing_reference",
        table: "order_details",
        row: index + 2,
        field: "order_id",
        message: `order_id '${orderId}'가 주문 테이블에 없습니다`,
      });
    }
    if (productId && !productIds.has(productId)) {
      issues.push({
        type: "missing_reference",
        table: "order_details",
        row: index + 2,
        field: "product_id",
        message: `product_id '${productId}'가 상품 테이블에 없습니다`,
      });
    }
  });

  return issues;
}

export function validateERPData(raw: {
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  order_details: Record<string, unknown>[];
}): ValidationSummary {
  const tables: TableValidationResult[] = [];
  const allData = {
    products: [] as Product[],
    customers: [] as Customer[],
    orders: [] as Order[],
    order_details: [] as OrderDetail[],
  };

  (Object.keys(ERP_SCHEMAS) as TableName[]).forEach((table) => {
    const rows = raw[table];
    const { errors, validRows } = validateTable(table, rows);
    allData[table] = validRows as never;

    tables.push({
      table,
      label: TABLE_LABELS[table],
      valid: errors.length === 0,
      totalRows: rows.length,
      validRows: validRows.length,
      errors,
    });
  });

  const integrityIssues: IntegrityIssue[] = [
    ...checkDuplicateKeys("products", raw.products, "product_id"),
    ...checkDuplicateKeys("customers", raw.customers, "customer_id"),
    ...checkDuplicateKeys("orders", raw.orders, "order_id"),
    ...checkDuplicateKeys("order_details", raw.order_details, "detail_id"),
    ...checkReferentialIntegrity(
      allData.products,
      allData.customers,
      allData.orders,
      allData.order_details,
      raw.orders,
      raw.order_details
    ),
  ];

  const schemaValid = tables.every((t) => t.valid);
  const integrityValid = integrityIssues.length === 0;

  return {
    tables,
    integrityIssues,
    isValid: schemaValid && integrityValid,
    data: allData,
  };
}

export function checkMissingColumns(
  table: TableName,
  headers: string[]
): string[] {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  return REQUIRED_COLUMNS[table].filter(
    (col) => !normalized.includes(col.toLowerCase())
  );
}
