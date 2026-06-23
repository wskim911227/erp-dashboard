import { NextRequest, NextResponse } from "next/server";
import { validateERPData } from "@/lib/validation/integrity";
import { computeDashboard } from "@/lib/analytics/kpis";
import {
  geminiValidateInsights,
  geminiDashboardInsights,
} from "@/lib/gemini/client";
import { isGeminiConfigured, VERCEL_ENV_HINT } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body as {
      action: "validate" | "dashboard" | "insights";
      data: {
        products: Record<string, unknown>[];
        customers: Record<string, unknown>[];
        orders: Record<string, unknown>[];
        order_details: Record<string, unknown>[];
      };
    };

    if (!data?.products || !data?.customers || !data?.orders || !data?.order_details) {
      return NextResponse.json(
        { error: "4개 테이블 데이터가 모두 필요합니다." },
        { status: 400 }
      );
    }

    const validation = validateERPData(data);

    if (action === "validate") {
      let aiInsights: string | null = null;
      if (isGeminiConfigured()) {
        try {
          aiInsights = await geminiValidateInsights(validation);
        } catch (e) {
          aiInsights = e instanceof Error ? e.message : "AI 분석 실패";
        }
      } else {
        aiInsights = `AI 분석을 사용할 수 없습니다. ${VERCEL_ENV_HINT}`;
      }
      return NextResponse.json({ validation, aiInsights });
    }

    if (action === "dashboard") {
      const dashboard = computeDashboard(
        validation.data.products,
        validation.data.customers,
        validation.data.orders,
        validation.data.order_details
      );
      return NextResponse.json({ validation, dashboard });
    }

    if (action === "insights") {
      const dashboard = computeDashboard(
        validation.data.products,
        validation.data.customers,
        validation.data.orders,
        validation.data.order_details
      );

      let validationInsights = "";
      let dashboardInsights = "";
      try {
        [validationInsights, dashboardInsights] = await Promise.all([
          geminiValidateInsights(validation),
          geminiDashboardInsights(dashboard),
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "AI 분석 실패";
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      return NextResponse.json({
        validation,
        dashboard,
        validationInsights,
        dashboardInsights,
      });
    }

    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
