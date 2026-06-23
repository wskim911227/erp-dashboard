# ERP 데이터 분석 대시보드

CSV 파일 4개(상품, 고객, 주문, 주문상세)를 업로드하면 Zod 스키마 검증, KPI 대시보드, Gemini AI 보고서를 자동 생성합니다.

## 기능

1. **데이터 검증** — Zod 스키마 4개 테이블 검사 + 참조 무결성 점검 + Gemini AI 품질 분석
2. **대시보드** — 매출/수익성/고객/재고 KPI 및 차트 자동 시각화 + Gemini AI 인사이트
3. **AI 보고서** — Gemini API 경영 분석 보고서 생성 + PDF/Word 다운로드

## 시작하기

```bash
npm install
cp .env.example .env.local
# .env.local에 GEMINI_API_KEY 설정
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포

1. GitHub에 푸시 후 Vercel에 연결
2. 환경변수 `GEMINI_API_KEY` 등록
3. Deploy

## CSV 파일 형식

### products.csv
| 컬럼 | 타입 | 설명 |
|------|------|------|
| product_id | string | 상품 ID (PK) |
| name | string | 상품명 |
| category | string | 카테고리 |
| price | number | 판매가 |
| cost | number | 원가 |
| stock_quantity | integer | 재고 수량 |

### customers.csv
| 컬럼 | 타입 | 설명 |
|------|------|------|
| customer_id | string | 고객 ID (PK) |
| name | string | 고객명 |
| email | string | 이메일 |
| segment | string | 세그먼트 |
| region | string | 지역 |

### orders.csv
| 컬럼 | 타입 | 설명 |
|------|------|------|
| order_id | string | 주문 ID (PK) |
| customer_id | string | 고객 ID (FK) |
| order_date | string | 주문일 (YYYY-MM-DD) |
| status | enum | completed / pending / cancelled / shipped |

### order_details.csv
| 컬럼 | 타입 | 설명 |
|------|------|------|
| detail_id | string | 상세 ID (PK) |
| order_id | string | 주문 ID (FK) |
| product_id | string | 상품 ID (FK) |
| quantity | integer | 수량 |
| unit_price | number | 단가 |

## 샘플 데이터

`sample-data/` 폴더에 테스트용 CSV 4개가 포함되어 있습니다.

## 기술 스택

- Next.js 15, TypeScript, Tailwind CSS
- Zod (스키마 검증)
- Recharts (차트)
- Google Gemini API (AI 분석/보고서)
- jsPDF, docx (PDF/Word보내기)
