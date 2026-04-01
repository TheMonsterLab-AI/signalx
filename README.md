# SignalX — Global Signal Intelligence Platform

세계 최초 제보·검증·배포 통합 플랫폼

## Quick Start

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 편집 후 DB URL, 암호화 키 입력

# 3. DB 마이그레이션 + 시드
npx prisma db push
npx tsx prisma/seed.ts

# 4. 개발 서버 실행
npm run dev
```

## 접속 주소

| 서비스 | URL |
|--------|-----|
| 유저 포털 (홈) | http://localhost:3000 |
| 익명 제보 | http://localhost:3000/submit |
| 제보 추적 | http://localhost:3000/track |
| ANN 리포트 | http://localhost:3000/report/:token |
| 어드민 로그인 | http://localhost:3000/admin/login |
| 어드민 대시보드 | http://localhost:3000/admin/dashboard |

## 시드 계정

```
글로벌 디렉터: danny@signalx.io  /  signalx-admin-2025!
시그널 리더:   ji@signalx.io      /  leader-korea-2025!
```

## 환경 변수 핵심 항목

```env
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=<openssl rand -hex 32>
HMAC_SECRET=<openssl rand -hex 64>
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
TOGETHER_API_KEY=...
```

## 플랫폼 구조

```
유저 포털 (외부)          어드민 대시보드 (내부)
──────────────────        ──────────────────────────
/ (홈 랜딩)               /admin/login (2FA)
/submit (4단계 폼)        /admin/dashboard (KPI + 지구본)
/track (토큰 추적)        /admin/signals (시그널 피드)
/report/:token           /admin/ann (7단계 검증)
                          /admin/ann/:id (검증 상세)
                          /admin/map (3D 리스크맵)
                          /admin/org (조직 관리)
                          /admin/patterns (패턴 분석)
                          /admin/distribute (배포 관리)
```

## 핵심 기능

- **AES-256-GCM 암호화** — 제보 내용 at-rest 암호화
- **IP 비기록** — 단방향 HMAC 해시만 저장
- **EXIF 자동 제거** — 업로드 파일 메타데이터 삭제
- **7단계 ANN 엔진** — GPT·Claude·Gemini·Llama 교차 검증
- **RBAC** — 역할 기반 접근 제어
- **감사 로그** — 모든 어드민 액션 불변 기록

## 배포 (Vercel + Supabase)

```bash
# Vercel 배포
vercel --prod

# DB는 Supabase/Neon PostgreSQL 권장
# 파일 스토리지는 Cloudflare R2 권장
```

---

© 2025 SignalX · Danny Park (박 대니) · annglobal.us
