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
import { DashboardData, formatCurrency, formatPercent } from "@/lib/analytics/kpis";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function KPICard({ title, value, subtitle, icon, color }: KPICardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

interface DashboardProps {
  data: DashboardData;
  aiInsights?: string | null;
}

export default function Dashboard({ data, aiInsights }: DashboardProps) {
  const { sales, profitability, customers, inventory } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="총 매출"
          value={formatCurrency(sales.totalRevenue)}
          subtitle={`${sales.completedOrders}건 완료`}
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
        />
        <KPICard
          title="매출총이익률"
          value={formatPercent(profitability.grossMargin)}
          subtitle={formatCurrency(profitability.grossProfit)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          color="bg-emerald-100"
        />
        <KPICard
          title="활성 고객"
          value={`${customers.activeCustomers}명`}
          subtitle={`전체 ${customers.totalCustomers}명`}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          color="bg-violet-100"
        />
        <KPICard
          title="재고 자산"
          value={formatCurrency(inventory.totalStockValue)}
          subtitle={`${inventory.totalSKUs} SKU · 회전율 ${inventory.inventoryTurnover.toFixed(1)}`}
          icon={<Package className="h-5 w-5 text-amber-600" />}
          color="bg-amber-100"
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
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sales.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="매출" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 매출">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sales.revenueByCategory}
                dataKey="revenue"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
              >
                {sales.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 수익">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitability.profitByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="profit" name="이익" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="고객 세그먼트별 매출">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={customers.customersBySegment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="매출" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="TOP 10 상품 매출">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sales.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="매출" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="카테고리별 재고">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={inventory.stockByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" name="수량" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value" name="가치(원)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
            {inventory.lowStockItems.map((item) => (
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
      <h3 className="mb-4 font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}
