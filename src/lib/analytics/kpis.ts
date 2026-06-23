import {
  Customer,
  Order,
  OrderDetail,
  Product,
} from "@/lib/schemas/erp";

export interface SalesKPIs {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
}

export interface ProfitabilityKPIs {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  profitByCategory: { category: string; profit: number; margin: number }[];
  profitByProduct: { name: string; profit: number; margin: number }[];
}

export interface CustomerKPIs {
  totalCustomers: number;
  activeCustomers: number;
  customersBySegment: { segment: string; count: number; revenue: number }[];
  customersByRegion: { region: string; count: number; revenue: number }[];
  topCustomers: { name: string; revenue: number; orders: number }[];
}

export interface InventoryKPIs {
  totalSKUs: number;
  totalStockValue: number;
  lowStockItems: { name: string; stock: number; category: string }[];
  stockByCategory: { category: string; quantity: number; value: number }[];
  inventoryTurnover: number;
}

export interface OverviewKPIs {
  validRevenue: number;
  validOrderCount: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  grossMarginStatus: "normal" | "caution";
  averageOrderValue: number;
  totalQuantitySold: number;
  cancellationRate: number;
  cancellationAmount: number;
  cancellationStatus: "normal" | "caution";
  returnRate: number;
  returnAmount: number;
  returnStatus: "normal" | "caution";
  activeCustomers: number;
  totalCustomers: number;
  inventoryRiskCount: number;
  discontinuedProductCount: number;
  totalTransactionVolume: number;
}

export interface DashboardData {
  overview: OverviewKPIs;
  sales: SalesKPIs;
  profitability: ProfitabilityKPIs;
  customers: CustomerKPIs;
  inventory: InventoryKPIs;
  generatedAt: string;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const VALID_STATUSES = new Set(["completed", "shipped", "pending"]);
const INVENTORY_RISK_THRESHOLD = 50;

function marginStatus(margin: number): "normal" | "caution" {
  return margin >= 25 ? "normal" : "caution";
}

function rateStatus(rate: number, cautionAbove: number): "normal" | "caution" {
  return rate <= cautionAbove ? "normal" : "caution";
}

export function computeDashboard(
  products: Product[],
  customers: Customer[],
  orders: Order[],
  orderDetails: OrderDetail[]
): DashboardData {
  const productMap = new Map(products.map((p) => [p.product_id, p]));
  const customerMap = new Map(customers.map((c) => [c.customer_id, c]));
  const orderMap = new Map(orders.map((o) => [o.order_id, o]));

  const orderLineTotal = new Map<string, number>();
  orderDetails.forEach((d) => {
    orderLineTotal.set(
      d.order_id,
      (orderLineTotal.get(d.order_id) ?? 0) + d.quantity * d.unit_price
    );
  });

  function orderAmount(orderId: string): number {
    const order = orderMap.get(orderId);
    if (order?.total_amount != null && order.total_amount > 0) {
      return order.total_amount;
    }
    return orderLineTotal.get(orderId) ?? 0;
  }

  const completedOrderIds = new Set(
    orders
      .filter((o) => o.status === "completed" || o.status === "shipped")
      .map((o) => o.order_id)
  );

  const validOrderIds = new Set(
    orders.filter((o) => VALID_STATUSES.has(o.status)).map((o) => o.order_id)
  );

  const lineItems = orderDetails
    .filter((d) => completedOrderIds.has(d.order_id))
    .map((d) => {
      const product = productMap.get(d.product_id);
      const order = orderMap.get(d.order_id);
      const revenue = d.quantity * d.unit_price;
      const cost = product ? d.quantity * product.cost : 0;
      return {
        ...d,
        revenue,
        cost,
        profit: revenue - cost,
        productName: product?.name ?? d.product_id,
        category: product?.category ?? "미분류",
        orderDate: order?.order_date ?? "",
        customerId: order?.customer_id ?? "",
      };
    });

  const totalRevenue = lineItems.reduce((s, i) => s + i.revenue, 0);
  const totalCost = lineItems.reduce((s, i) => s + i.cost, 0);
  const completedOrders = completedOrderIds.size;

  const monthMap = new Map<string, { revenue: number; orders: Set<string> }>();
  lineItems.forEach((item) => {
    if (!item.orderDate) return;
    const month = formatMonth(item.orderDate);
    const entry = monthMap.get(month) ?? { revenue: 0, orders: new Set<string>() };
    entry.revenue += item.revenue;
    entry.orders.add(item.order_id);
    monthMap.set(month, entry);
  });

  const categoryRevenue = new Map<string, number>();
  const categoryProfit = new Map<string, { profit: number; revenue: number }>();
  lineItems.forEach((item) => {
    categoryRevenue.set(item.category, (categoryRevenue.get(item.category) ?? 0) + item.revenue);
    const cp = categoryProfit.get(item.category) ?? { profit: 0, revenue: 0 };
    cp.profit += item.profit;
    cp.revenue += item.revenue;
    categoryProfit.set(item.category, cp);
  });

  const productStats = new Map<string, { revenue: number; quantity: number; profit: number; cost: number }>();
  lineItems.forEach((item) => {
    const ps = productStats.get(item.productName) ?? { revenue: 0, quantity: 0, profit: 0, cost: 0 };
    ps.revenue += item.revenue;
    ps.quantity += item.quantity;
    ps.profit += item.profit;
    ps.cost += item.revenue - item.profit;
    productStats.set(item.productName, ps);
  });

  const customerRevenue = new Map<string, { revenue: number; orders: Set<string> }>();
  lineItems.forEach((item) => {
    if (!item.customerId) return;
    const cr = customerRevenue.get(item.customerId) ?? { revenue: 0, orders: new Set<string>() };
    cr.revenue += item.revenue;
    cr.orders.add(item.order_id);
    customerRevenue.set(item.customerId, cr);
  });

  const segmentStats = new Map<string, { count: number; revenue: number }>();
  const regionStats = new Map<string, { count: number; revenue: number }>();
  customers.forEach((c) => {
    const cr = customerRevenue.get(c.customer_id);
    const revenue = cr?.revenue ?? 0;
    const seg = segmentStats.get(c.segment) ?? { count: 0, revenue: 0 };
    seg.count += 1;
    seg.revenue += revenue;
    segmentStats.set(c.segment, seg);
    const reg = regionStats.get(c.region) ?? { count: 0, revenue: 0 };
    reg.count += 1;
    reg.revenue += revenue;
    regionStats.set(c.region, reg);
  });

  const stockByCategory = new Map<string, { quantity: number; value: number }>();
  products.forEach((p) => {
    const sc = stockByCategory.get(p.category) ?? { quantity: 0, value: 0 };
    sc.quantity += p.stock_quantity;
    sc.value += p.stock_quantity * p.cost;
    stockByCategory.set(p.category, sc);
  });

  const lowStockThreshold = 10;
  const lowStockItems = products
    .filter((p) => p.stock_quantity <= lowStockThreshold)
    .map((p) => ({ name: p.name, stock: p.stock_quantity, category: p.category }))
    .sort((a, b) => a.stock - b.stock);

  const avgInventoryValue =
    products.reduce((s, p) => s + p.stock_quantity * p.cost, 0) / Math.max(products.length, 1);
  const inventoryTurnover = avgInventoryValue > 0 ? totalCost / avgInventoryValue : 0;

  let validRevenue = 0;
  let cancellationAmount = 0;
  let returnAmount = 0;
  let totalTransactionVolume = 0;
  let validOrderCount = 0;
  const activeCustomerIds = new Set<string>();

  orders.forEach((order) => {
    const amount = orderAmount(order.order_id);
    totalTransactionVolume += amount;

    if (VALID_STATUSES.has(order.status)) {
      validRevenue += amount;
      validOrderCount += 1;
      activeCustomerIds.add(order.customer_id);
    } else if (order.status === "cancelled") {
      cancellationAmount += amount;
    } else if (order.status === "returned") {
      returnAmount += amount;
    }
  });

  let totalQuantitySold = 0;
  let validCost = 0;
  orderDetails.forEach((d) => {
    if (!validOrderIds.has(d.order_id)) return;
    const product = productMap.get(d.product_id);
    totalQuantitySold += d.quantity;
    validCost += product ? d.quantity * product.cost : 0;
  });

  const grossProfit = validRevenue - validCost;
  const grossMargin = validRevenue > 0 ? (grossProfit / validRevenue) * 100 : 0;
  const cancellationRate =
    totalTransactionVolume > 0 ? (cancellationAmount / totalTransactionVolume) * 100 : 0;
  const returnRate =
    totalTransactionVolume > 0 ? (returnAmount / totalTransactionVolume) * 100 : 0;

  const inventoryRiskCount = products.filter(
    (p) => p.status !== "단종" && p.stock_quantity <= INVENTORY_RISK_THRESHOLD
  ).length;
  const discontinuedProductCount = products.filter((p) => p.status === "단종").length;

  const overview: OverviewKPIs = {
    validRevenue,
    validOrderCount,
    totalCost: validCost,
    grossProfit,
    grossMargin,
    grossMarginStatus: marginStatus(grossMargin),
    averageOrderValue: validOrderCount > 0 ? validRevenue / validOrderCount : 0,
    totalQuantitySold,
    cancellationRate,
    cancellationAmount,
    cancellationStatus: rateStatus(cancellationRate, 10),
    returnRate,
    returnAmount,
    returnStatus: rateStatus(returnRate, 5),
    activeCustomers: activeCustomerIds.size,
    totalCustomers: customers.length,
    inventoryRiskCount,
    discontinuedProductCount,
    totalTransactionVolume,
  };

  return {
    overview,
    sales: {
      totalRevenue,
      totalOrders: orders.length,
      completedOrders,
      averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
      revenueByMonth: Array.from(monthMap.entries())
        .map(([month, v]) => ({ month, revenue: v.revenue, orders: v.orders.size }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      revenueByCategory: Array.from(categoryRevenue.entries())
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: Array.from(productStats.entries())
        .map(([name, v]) => ({ name, revenue: v.revenue, quantity: v.quantity }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    },
    profitability: {
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      profitByCategory: Array.from(categoryProfit.entries())
        .map(([category, v]) => ({
          category,
          profit: v.profit,
          margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit),
      profitByProduct: Array.from(productStats.entries())
        .map(([name, v]) => ({
          name,
          profit: v.profit,
          margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10),
    },
    customers: {
      totalCustomers: customers.length,
      activeCustomers: activeCustomerIds.size,
      customersBySegment: Array.from(segmentStats.entries())
        .map(([segment, v]) => ({ segment, count: v.count, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      customersByRegion: Array.from(regionStats.entries())
        .map(([region, v]) => ({ region, count: v.count, revenue: v.revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      topCustomers: Array.from(customerRevenue.entries())
        .map(([id, v]) => ({
          name: customerMap.get(id)?.name ?? id,
          revenue: v.revenue,
          orders: v.orders.size,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    },
    inventory: {
      totalSKUs: products.length,
      totalStockValue: products.reduce((s, p) => s + p.stock_quantity * p.cost, 0),
      lowStockItems,
      stockByCategory: Array.from(stockByCategory.entries())
        .map(([category, v]) => ({ category, quantity: v.quantity, value: v.value }))
        .sort((a, b) => b.value - a.value),
      inventoryTurnover,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
