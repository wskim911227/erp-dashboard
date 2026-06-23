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

        <div className="pixel-progress-track relative h-20 overflow-visible rounded-lg border-4 border-slate-800 bg-sky-300">
          <div className="absolute inset-0 overflow-hidden rounded-[4px]">
            <div className="pixel-cloud pixel-cloud-1" />
            <div className="pixel-cloud pixel-cloud-2" />
            <div
              className="absolute bottom-0 left-0 top-0 bg-emerald-400/50 transition-all duration-700 ease-out"
              style={{ width: `${clamped}%` }}
            />
            <div className="pixel-ground absolute bottom-0 left-0 right-0" />
          </div>
          <div
            className="absolute z-20 transition-all duration-700 ease-out"
            style={{
              left: `calc(${Math.max(2, clamped)}% - 28px)`,
              bottom: "10px",
            }}
          >
            <PixelCatSprite frame={frame} />
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

/** SVG 픽셀 고양이 (2프레임 달리기) */
function PixelCatSprite({ frame }: { frame: 0 | 1 }) {
  const legFrame1 = (
    <>
      <rect x="10" y="22" width="4" height="4" fill="#c2410c" />
      <rect x="18" y="22" width="4" height="4" fill="#c2410c" />
      <rect x="6" y="26" width="4" height="4" fill="#c2410c" />
      <rect x="22" y="26" width="4" height="4" fill="#c2410c" />
    </>
  );
  const legFrame2 = (
    <>
      <rect x="8" y="22" width="4" height="4" fill="#c2410c" />
      <rect x="20" y="22" width="4" height="4" fill="#c2410c" />
      <rect x="14" y="26" width="4" height="4" fill="#c2410c" />
    </>
  );

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 32 32"
      className="pixel-cat-svg drop-shadow-md"
      aria-hidden
    >
      {/* 꼬리 */}
      <rect x="2" y="12" width="4" height="4" fill="#ea580c" />
      <rect x="0" y="8" width="4" height="4" fill="#f97316" />
      {/* 몸통 */}
      <rect x="6" y="12" width="20" height="12" fill="#f97316" />
      <rect x="8" y="14" width="16" height="8" fill="#fdba74" />
      {/* 머리 */}
      <rect x="20" y="4" width="12" height="12" fill="#f97316" />
      <rect x="22" y="6" width="8" height="8" fill="#fdba74" />
      {/* 귀 */}
      <rect x="20" y="0" width="4" height="4" fill="#f97316" />
      <rect x="28" y="0" width="4" height="4" fill="#f97316" />
      <rect x="21" y="1" width="2" height="2" fill="#fda4af" />
      <rect x="29" y="1" width="2" height="2" fill="#fda4af" />
      {/* 눈 */}
      <rect x="24" y="8" width="2" height="2" fill="#1e293b" />
      <rect x="28" y="8" width="2" height="2" fill="#1e293b" />
      {/* 코 */}
      <rect x="26" y="11" width="2" height="2" fill="#fda4af" />
      {/* 다리 */}
      {frame === 0 ? legFrame1 : legFrame2}
    </svg>
  );
}
