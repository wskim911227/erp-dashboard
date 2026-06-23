import { GoogleGenerativeAI } from "@google/generative-ai";
import { DashboardData } from "@/lib/analytics/kpis";
import { ValidationSummary } from "@/lib/validation/integrity";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";

function getClient() {
  return new GoogleGenerativeAI(getGeminiApiKey());
}

async function generateText(prompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModel() });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function geminiValidateInsights(
  validation: ValidationSummary
): Promise<string> {
  const prompt = `당신은 ERP 데이터 품질 분석 전문가입니다.
다음 데이터 검증 결과를 분석하고, 한국어로 간결한 품질 평가 보고를 작성하세요.

## 검증 결과
- 전체 유효성: ${validation.isValid ? "통과" : "실패"}
- 테이블별 결과:
${validation.tables.map((t) => `  - ${t.label}: ${t.validRows}/${t.totalRows}행 유효, 오류 ${t.errors.length}건`).join("\n")}
- 참조 무결성 이슈: ${validation.integrityIssues.length}건
${validation.integrityIssues.slice(0, 10).map((i) => `  - [${i.table}] ${i.message}`).join("\n")}

## 작성 지침
1. 데이터 품질 종합 등급 (A~F) 제시
2. 주요 문제점 3가지 이내 요약
3. 데이터 정제를 위한 구체적 권장사항
4. 300자 이내로 작성`;

  return generateText(prompt);
}

export async function geminiDashboardInsights(
  dashboard: DashboardData
): Promise<string> {
  const prompt = `당신은 ERP 비즈니스 인텔리전스 분석가입니다.
다음 KPI 데이터를 기반으로 핵심 인사이트를 한국어로 작성하세요.

## 매출 KPI
- 총 매출: ${dashboard.sales.totalRevenue.toLocaleString()}원
- 총 주문: ${dashboard.sales.totalOrders}건 (완료 ${dashboard.sales.completedOrders}건)
- 평균 주문금액: ${Math.round(dashboard.sales.averageOrderValue).toLocaleString()}원
- 상위 카테고리: ${dashboard.sales.revenueByCategory.slice(0, 3).map((c) => c.category).join(", ")}

## 수익성 KPI
- 총 매출: ${dashboard.profitability.totalRevenue.toLocaleString()}원
- 총 원가: ${dashboard.profitability.totalCost.toLocaleString()}원
- 매출총이익: ${dashboard.profitability.grossProfit.toLocaleString()}원
- 매출총이익률: ${dashboard.profitability.grossMargin.toFixed(1)}%

## 고객 KPI
- 전체 고객: ${dashboard.customers.totalCustomers}명
- 활성 고객: ${dashboard.customers.activeCustomers}명
- 상위 세그먼트: ${dashboard.customers.customersBySegment.slice(0, 2).map((s) => s.segment).join(", ")}

## 재고 KPI
- SKU 수: ${dashboard.inventory.totalSKUs}개
- 재고 자산가치: ${dashboard.inventory.totalStockValue.toLocaleString()}원
- 재고회전율: ${dashboard.inventory.inventoryTurnover.toFixed(2)}
- 저재고 품목: ${dashboard.inventory.lowStockItems.length}개

## 작성 지침
1. 핵심 발견사항 3~5개 (bullet point)
2. 리스크 및 기회 요인
3. 실행 가능한 권장 조치 2~3개
4. 500자 이내`;

  return generateText(prompt);
}

export async function geminiGenerateReport(
  dashboard: DashboardData,
  validationInsights: string,
  dashboardInsights: string
): Promise<string> {
  const prompt = `당신은 ERP 경영 분석 보고서 작성 전문가입니다.
다음 데이터를 기반으로 경영진용 ERP 분석 보고서를 한국어 마크다운 형식으로 작성하세요.

## 데이터 검증 AI 분석
${validationInsights}

## 대시보드 AI 인사이트
${dashboardInsights}

## 상세 KPI 데이터
### 매출
- 총매출: ${dashboard.sales.totalRevenue.toLocaleString()}원
- 월별 매출: ${dashboard.sales.revenueByMonth.map((m) => `${m.month}: ${m.revenue.toLocaleString()}원`).join(", ")}
- TOP 상품: ${dashboard.sales.topProducts.slice(0, 5).map((p) => `${p.name}(${p.revenue.toLocaleString()}원)`).join(", ")}

### 수익성
- 매출총이익률: ${dashboard.profitability.grossMargin.toFixed(1)}%
- 카테고리별 이익: ${dashboard.profitability.profitByCategory.map((c) => `${c.category}: ${c.profit.toLocaleString()}원`).join(", ")}

### 고객
- TOP 고객: ${dashboard.customers.topCustomers.slice(0, 5).map((c) => `${c.name}(${c.revenue.toLocaleString()}원)`).join(", ")}

### 재고
- 저재고 품목: ${dashboard.inventory.lowStockItems.map((i) => i.name).join(", ") || "없음"}

## 보고서 구조 (반드시 포함)
1. **요약 (Executive Summary)**
2. **매출 분석**
3. **수익성 분석**
4. **고객 분석**
5. **재고 분석**
6. **리스크 및 권장사항**
7. **결론**

전문적이고 간결한 경영 보고서 톤으로 작성하세요.`;

  return generateText(prompt);
}
