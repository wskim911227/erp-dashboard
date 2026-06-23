"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardData, formatCurrency } from "@/lib/analytics/kpis";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const AXIS_TICK = { fontSize: 13, fill: "#334155", fontWeight: 500 as const };
const AXIS_TICK_SM = { fontSize: 12, fill: "#475569" };
const LEGEND_STYLE = { fontSize: 13, color: "#334155", paddingTop: 8 };

const MARGIN_DEFAULT = { top: 12, right: 20, left: 4, bottom: 4 };
const MARGIN_LEFT = { top: 12, right: 20, left: 12, bottom: 4 };
const MARGIN_ROTATED = { top: 12, right: 20, left: 4, bottom: 56 };

function formatAxisWon(value: number): string {
  if (value >= 1_0000_0000) return `${(value / 1_0000_0000).toFixed(1)}억`;
  if (value >= 1_0000) return `${Math.round(value / 1_0000)}만`;
  return value.toLocaleString();
}

function truncateLabel(text: string, max = 14): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg">
      {label && (
        <p className="mb-1.5 max-w-[220px] text-sm font-semibold leading-snug text-slate-800">
          {label}
        </p>
      )}
      {payload.map((item, i) => (
        <p key={i} className="text-sm text-slate-600" style={{ color: item.color }}>
          <span className="font-medium text-slate-800">{item.name}</span>
          {": "}
          {typeof item.value === "number" && item.name?.includes("수량")
            ? `${item.value.toLocaleString()}개`
            : typeof item.value === "number"
              ? formatCurrency(item.value)
              : item.value}
        </p>
      ))}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: { label: string; type: "normal" | "caution" };
}

function SummaryCard({ title, value, subtitle, badge }: SummaryCardProps) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {badge && (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${
            badge.type === "normal"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {badge.label}
        </span>
      )}
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

interface DashboardProps {
  data: DashboardData;
  aiInsights?: string | null;
}

export default function Dashboard({ data, aiInsights }: DashboardProps) {
  const { overview, sales, profitability, customers, inventory } = data;

  const topProducts = sales.topProducts.map((p) => ({
    ...p,
    shortName: truncateLabel(p.name, 16),
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="유효매출"
          value={formatCurrency(overview.validRevenue)}
          subtitle={`유효주문 ${overview.validOrderCount.toLocaleString()}건`}
        />
        <SummaryCard title="매출원가" value={formatCurrency(overview.totalCost)} />
        <SummaryCard title="매출총이익" value={formatCurrency(overview.grossProfit)} />
        <SummaryCard
          title="매출총이익률"
          value={`${overview.grossMargin.toFixed(1)}%`}
          badge={{
            label: overview.grossMarginStatus === "normal" ? "정상" : "주의",
            type: overview.grossMarginStatus,
          }}
        />
        <SummaryCard
          title="평균 주문금액"
          value={formatCurrency(overview.averageOrderValue)}
        />
        <SummaryCard
          title="판매 수량"
          value={`${overview.totalQuantitySold.toLocaleString()}개`}
        />
        <SummaryCard
          title="취소율"
          value={`${overview.cancellationRate.toFixed(1)}%`}
          subtitle={formatCurrency(overview.cancellationAmount)}
          badge={{
            label: overview.cancellationStatus === "normal" ? "정상" : "주의",
            type: overview.cancellationStatus,
          }}
        />
        <SummaryCard
          title="반품율"
          value={`${overview.returnRate.toFixed(1)}%`}
          subtitle={formatCurrency(overview.returnAmount)}
          badge={{
            label: overview.returnStatus === "normal" ? "정상" : "주의",
            type: overview.returnStatus,
          }}
        />
        <SummaryCard
          title="활성 고객"
          value={`${overview.activeCustomers.toLocaleString()}명`}
          subtitle={`전체 ${overview.totalCustomers.toLocaleString()}명`}
        />
        <SummaryCard
          title="재고 위험"
          value={`${overview.inventoryRiskCount}건`}
          subtitle="재고 50개 이하 품목"
          badge={
            overview.inventoryRiskCount > 0
              ? { label: "주의", type: "caution" }
              : { label: "정상", type: "normal" }
          }
        />
        <SummaryCard
          title="단종 상품"
          value={`${overview.discontinuedProductCount}건`}
          badge={
            overview.discontinuedProductCount > 0
              ? { label: "주의", type: "caution" }
              : { label: "정상", type: "normal" }
          }
        />
        <SummaryCard
          title="총 거래액"
          value={formatCurrency(overview.totalTransactionVolume)}
          subtitle="취소·반품 포함"
        />
      </div>

      {aiInsights && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
          <h3 className="mb-2 font-semibold text-violet-800">Gemini AI 인사이트</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {aiInsights}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="월별 매출 추이">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sales.revenueByMonth} margin={MARGIN_LEFT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                tickMargin={10}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={AXIS_TICK_SM}
                tickFormatter={formatAxisWon}
                width={56}
                tickMargin={4}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="매출"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 매출">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sales.revenueByCategory}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="42%"
                outerRadius={88}
                innerRadius={40}
                paddingAngle={2}
              >
                {sales.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ ...LEGEND_STYLE, lineHeight: "22px" }}
                formatter={(value) => (
                  <span className="text-sm text-slate-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 수익">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitability.profitByCategory} margin={MARGIN_ROTATED}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="category"
                tick={AXIS_TICK_SM}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={70}
                tickMargin={8}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={AXIS_TICK_SM}
                tickFormatter={formatAxisWon}
                width={56}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="profit" name="이익" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="고객 세그먼트별 매출">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customers.customersBySegment} margin={MARGIN_DEFAULT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="segment"
                tick={AXIS_TICK}
                tickMargin={10}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={AXIS_TICK_SM}
                tickFormatter={formatAxisWon}
                width={56}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="매출" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="TOP 10 상품 매출">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={AXIS_TICK_SM}
                tickFormatter={formatAxisWon}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={AXIS_TICK_SM}
                width={130}
                tickMargin={6}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.name ?? ""
                }
              />
              <Bar dataKey="revenue" name="매출" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 재고">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventory.stockByCategory} margin={MARGIN_ROTATED}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="category"
                tick={AXIS_TICK_SM}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={70}
                tickMargin={8}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={AXIS_TICK_SM}
                tickFormatter={(v) => v.toLocaleString()}
                width={56}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="quantity" name="수량" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="value" name="재고가치" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {inventory.lowStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-3 font-semibold text-amber-800">
            저재고 알림 ({inventory.lowStockItems.length}건)
          </h3>
          <div className="flex flex-wrap gap-2">
            {inventory.lowStockItems.slice(0, 20).map((item) => (
              <span
                key={item.name}
                className="rounded-full bg-white px-3 py-1 text-sm text-amber-900 shadow-sm"
              >
                {item.name}: {item.stock}개
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}
