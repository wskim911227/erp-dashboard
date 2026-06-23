import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SAMPLE_FILES = {
  products: "products.csv",
  customers: "customers.csv",
  orders: "sales_orders.csv",
  order_details: "sales_order_items.csv",
} as const;

export async function GET() {
  try {
    const base = path.join(process.cwd(), "sample-data");
    const entries = await Promise.all(
      Object.entries(SAMPLE_FILES).map(async ([key, filename]) => {
        const content = await readFile(path.join(base, filename), "utf-8");
        return [key, { filename, content }] as const;
      })
    );

    const files = Object.fromEntries(entries);
    return NextResponse.json({ files });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "샘플 데이터 로드 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
