"use client";

import { useEffect, useState } from "react";

export type ProgressStage =
  | "loading_sample"
  | "validating"
  | "dashboard"
  | "ai_insights"
  | "ai_report"
  | "done";

const STAGE_LABELS: Record<ProgressStage, string> = {
  loading_sample: "샘플 데이터 불러오는 중...",
  validating: "데이터 검증 중...",
  dashboard: "대시보드 생성 중...",
  ai_insights: "AI 인사이트 분석 중...",
  ai_report: "AI 보고서 작성 중...",
  done: "완료!",
};

interface AnalysisLoaderProps {
  stage: ProgressStage;
  percent: number;
}

function stageOrder(s: ProgressStage): number {
  const order: Record<ProgressStage, number> = {
    loading_sample: 0,
    validating: 25,
    dashboard: 45,
    ai_insights: 70,
    ai_report: 90,
    done: 100,
  };
  return order[s];
}

export default function AnalysisLoader({ stage, percent }: AnalysisLoaderProps) {
  const [frame, setFrame] = useState<0 | 1>(0);
  const clamped = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 180);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border-2 border-slate-800 bg-gradient-to-b from-sky-100 to-emerald-50 p-8 shadow-inner">
      <div className="mb-4 text-center">
        <span className="inline-block rounded bg-slate-800 px-3 py-1 font-mono text-xs text-emerald-300">
          LOADING...
        </span>
      </div>

      <div className="mx-auto max-w-lg">
        <p className="mb-4 text-center text-sm font-semibold text-slate-700">
          {STAGE_LABELS[stage]}
        </p>

        <div className="pixel-progress-track relative h-12 overflow-hidden rounded-lg border-4 border-slate-800 bg-sky-300">
          <div className="pixel-cloud pixel-cloud-1" />
          <div className="pixel-cloud pixel-cloud-2" />
          <div
            className="absolute bottom-0 left-0 top-0 bg-emerald-400/60 transition-all duration-700 ease-out"
            style={{ width: `${clamped}%` }}
          />
          <div className="pixel-ground absolute bottom-0 left-0 right-0" />
          <div
            className="absolute bottom-1 z-10 transition-all duration-700 ease-out"
            style={{ left: `calc(${Math.max(4, clamped)}% - 24px)` }}
          >
            <div
              className={`pixel-cat ${frame === 0 ? "pixel-cat-run-1" : "pixel-cat-run-2"}`}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-600">
          <span>░░░</span>
          <span className="text-lg font-bold text-blue-600">{Math.round(clamped)}%</span>
          <span>███</span>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {(["validating", "dashboard", "ai_insights", "ai_report"] as ProgressStage[]).map(
            (s) => (
              <span
                key={s}
                className={`h-2 w-2 rounded-sm border border-slate-600 ${
                  percent >= stageOrder(s) ? "bg-emerald-500" : "bg-slate-300"
                }`}
                title={STAGE_LABELS[s]}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
