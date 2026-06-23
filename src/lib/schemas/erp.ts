import { z } from "zod";

export const productSchema = z.object({
  product_id: z.string().min(1, "product_id는 필수입니다"),
  name: z.string().min(1, "상품명은 필수입니다"),
  category: z.string().min(1, "카테고리는 필수입니다"),
  price: z.coerce.number().positive("판매가는 0보다 커야 합니다"),
  cost: z.coerce.number().nonnegative("원가는 0 이상이어야 합니다"),
  stock_quantity: z.coerce
    .number()
    .int("재고는 정수여야 합니다")
    .nonnegative("재고는 0 이상이어야 합니다"),
  status: z.string().optional(),
});

export const customerSchema = z.object({
  customer_id: z.string().min(1, "customer_id는 필수입니다"),
  name: z.string().min(1, "고객명은 필수입니다"),
  email: z.string().email("유효한 이메일이어야 합니다"),
  segment: z.string().min(1, "세그먼트는 필수입니다"),
  region: z.string().min(1, "지역은 필수입니다"),
});

export const orderSchema = z.object({
  order_id: z.string().min(1, "order_id는 필수입니다"),
  customer_id: z.string().min(1, "customer_id는 필수입니다"),
  order_date: z.string().min(1, "주문일은 필수입니다"),
  status: z.enum(["completed", "pending", "cancelled", "shipped", "returned"], {
    errorMap: () => ({
      message:
        "status는 completed, pending, cancelled, shipped, returned 중 하나여야 합니다",
    }),
  }),
  total_amount: z.coerce.number().nonnegative().optional(),
});

export const orderDetailSchema = z.object({
  detail_id: z.string().min(1, "detail_id는 필수입니다"),
  order_id: z.string().min(1, "order_id는 필수입니다"),
  product_id: z.string().min(1, "product_id는 필수입니다"),
  quantity: z.coerce
    .number()
    .int("수량은 정수여야 합니다")
    .positive("수량은 1 이상이어야 합니다"),
  unit_price: z.coerce.number().positive("단가는 0보다 커야 합니다"),
});

export type Product = z.infer<typeof productSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const ERP_SCHEMAS = {
  products: productSchema,
  customers: customerSchema,
  orders: orderSchema,
  order_details: orderDetailSchema,
} as const;

export type TableName = keyof typeof ERP_SCHEMAS;

export const TABLE_LABELS: Record<TableName, string> = {
  products: "상품",
  customers: "고객",
  orders: "주문",
  order_details: "주문상세",
};

export const REQUIRED_COLUMNS: Record<TableName, string[]> = {
  products: ["product_id", "name", "category", "price", "cost", "stock_quantity"],
  customers: ["customer_id", "name", "email", "segment", "region"],
  orders: ["order_id", "customer_id", "order_date", "status"],
  order_details: ["detail_id", "order_id", "product_id", "quantity", "unit_price"],
};
