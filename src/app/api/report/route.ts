import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateReport } from "@/lib/gemini/client";
import { DashboardData } from "@/lib/analytics/kpis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dashboard, validationInsights, dashboardInsights } = body as {
      dashboard: DashboardData;
      validationInsights: string;
      dashboardInsights: string;
    };

    if (!dashboard) {
      return NextResponse.json({ error: "대시보드 데이터가 필요합니다." }, { status: 400 });
    }

    const report = await geminiGenerateReport(
      dashboard,
      validationInsights ?? "",
      dashboardInsights ?? ""
    );

    return NextResponse.json({ report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "보고서 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
