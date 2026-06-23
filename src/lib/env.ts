/**
 * 서버 전용 환경변수 (Vercel Environment Variables)
 *
 * GEMINI_API_KEY는 Vercel 대시보드에서만 설정합니다.
 * - Vercel: Project → Settings → Environment Variables
 * - 로컬 개발: `vercel env pull .env.local` 로 동기화
 *
 * ⚠️ NEXT_PUBLIC_ 접두사를 사용하지 않습니다 (클라이언트 노출 금지)
 */

const VERCEL_ENV_HINT =
  "Vercel 대시보드 → Project Settings → Environment Variables에서 GEMINI_API_KEY를 등록한 뒤 재배포하세요.";

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(`GEMINI_API_KEY가 설정되지 않았습니다. ${VERCEL_ENV_HINT}`);
  }

  return apiKey;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** 기본값: gemini-2.0-flash 종료(2026-06-01) 이후 권장 모델 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
}

export { VERCEL_ENV_HINT };
