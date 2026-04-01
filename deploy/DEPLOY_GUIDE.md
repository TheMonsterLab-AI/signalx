# SignalX 배포 가이드
# Railway + Cloudflare Tunnel

총 소요 시간: 약 40분  
난이도: ★★☆☆☆ (복붙 위주)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  최종 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  인터넷
    │
    ▼
  Cloudflare (DDoS 차단, WAF, SSL)
    │  ← 터널 (Railway 실제 IP 완전 숨김)
    ▼
  Railway (Next.js 앱 실행)
    │
    ├── PostgreSQL (Railway 내장)
    └── /tmp/signalx-vault (파일 격리)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  준비물 (계정 3개)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. GitHub 계정    → github.com
  2. Railway 계정   → railway.app
  3. Cloudflare 계정 → cloudflare.com (도메인 보유 필요)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1 — 코드를 GitHub에 올리기 (5분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

터미널에서 순서대로 실행하세요:

  cd signalx

  git init
  git add .
  git commit -m "Initial SignalX platform"

  # GitHub에서 새 저장소 생성 후 (비공개 설정 권장):
  git remote add origin https://github.com/<YOUR_USERNAME>/signalx.git
  git push -u origin main


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 2 — Railway 프로젝트 생성 (10분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. railway.app 접속 → New Project

  2. "Deploy from GitHub repo" 선택
     → signalx 저장소 선택

  3. PostgreSQL 추가:
     New → Database → PostgreSQL 클릭
     (DATABASE_URL 자동 생성됨)

  4. Variables 탭 클릭 → 아래 값들 입력:

     ┌─────────────────────────────────────────────────────┐
     │ 암호화 키 생성 (터미널에서 실행):                    │
     │                                                     │
     │   openssl rand -hex 32  → ENCRYPTION_KEY 값         │
     │   openssl rand -hex 64  → HMAC_SECRET 값            │
     └─────────────────────────────────────────────────────┘

     변수명                값
     ──────────────────── ─────────────────────────────────
     NODE_ENV             production
     ENCRYPTION_KEY       (openssl rand -hex 32 결과)
     HMAC_SECRET          (openssl rand -hex 64 결과)
     DATABASE_PROVIDER    postgresql
     NEXT_PUBLIC_APP_URL  https://signalx.global (나중에 수정)
     OPENAI_API_KEY       sk-...
     ANTHROPIC_API_KEY    sk-ant-...
     WEBHOOK_SECRET       (아무 랜덤 문자열)
     VAULT_DIR            /tmp/signalx-vault
     ALLOWED_ORIGINS      https://signalx.global

  5. Settings → Domain → Generate Domain 클릭
     (예: signalx-production.up.railway.app)
     → 이 주소를 복사해 둡니다

  6. Deploy 버튼 클릭
     → 빌드 로그에서 오류 없이 "✅ Deployed" 확인

  7. 빌드 완료 후 DB 마이그레이션 실행:
     Railway → Project → New Service → Run Command:

       npx prisma db push && npx tsx prisma/seed.ts

     → "✅ Seed complete" 메시지 확인


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 3 — Cloudflare Tunnel 설치 (15분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ▶ 로컬 PC 또는 서버에서 실행합니다.

  [ Mac ]
    brew install cloudflared

  [ Linux (Ubuntu/Debian) ]
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
    sudo dpkg -i cloudflared.deb

  [ Windows ]
    winget install Cloudflare.cloudflared


  ── 터널 생성 ──────────────────────────────────────────────

  1. Cloudflare 로그인:
       cloudflared tunnel login
       (브라우저 창에서 도메인 선택)

  2. 터널 생성:
       cloudflared tunnel create signalx
       → 터널 ID 메모 (예: abc123-def456-...)

  3. config.yml 파일 편집:
       deploy/cloudflare-tunnel-config.yml 파일에서
       <YOUR_TUNNEL_ID> 를 실제 터널 ID로 교체

  4. DNS 레코드 등록:
       cloudflared tunnel route dns signalx signalx.global
       cloudflared tunnel route dns signalx admin.signalx.global

  5. Railway URL을 Tunnel 목적지로 설정:
       deploy/cloudflare-tunnel-config.yml 열어서
       service: 를 Railway URL로 수정:

         service: https://signalx-production.up.railway.app

  6. 터널 실행 테스트:
       cloudflared tunnel --config deploy/cloudflare-tunnel-config.yml run signalx

  7. 서비스로 등록 (항상 실행):
       cloudflared service install


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 4 — Cloudflare 보안 설정 (5분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Cloudflare Dashboard 에서:

  1. SSL/TLS → Overview
     → "Full (strict)" 선택

  2. SSL/TLS → Edge Certificates
     → Always Use HTTPS: ON
     → HSTS: ON (Max-Age: 1년)
     → Min TLS Version: 1.2

  3. Security → Bots
     → Bot Fight Mode: ON

  4. Security → WAF → Custom Rules
     → deploy/cloudflare-waf-rules.md 파일 참고해서 규칙 추가

  5. Speed → Optimization
     → Auto Minify: 모두 체크


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 5 — 최종 확인 (5분)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  아래 URL에서 각 기능 확인:

  ✅ https://signalx.global
     → 유저 포털 홈 화면

  ✅ https://signalx.global/submit
     → 제보 폼 (보안 배지 표시 확인)

  ✅ https://signalx.global/api/health
     → {"status":"healthy"} 확인

  ✅ https://admin.signalx.global/admin/login
     → 로그인 화면
     → 계정: danny@signalx.io / signalx-admin-2025!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  비용 정리 (월간)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Railway Starter      $5/월 (앱 + PostgreSQL)
  Cloudflare           $0 (터널 무료, WAF 무료 티어)
  도메인               $10~20/년
  ──────────────────────────────
  합계                 약 $5~8/월

  트래픽 증가 시:
  Railway Pro          $20/월
  Cloudflare Pro       $20/월 (고급 WAF)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  자주 묻는 문제
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Q. Railway 빌드 실패
  → Variables 에 모든 환경변수 입력했는지 확인
  → 특히 ENCRYPTION_KEY (64자 hex) 형식 확인

  Q. Prisma 마이그레이션 오류
  → DATABASE_URL 이 자동으로 들어갔는지 확인
  → Railway → PostgreSQL 서비스 → Connect 탭에서 URL 확인

  Q. Cloudflare Tunnel 연결 안 됨
  → cloudflared tunnel list 로 터널 상태 확인
  → Railway URL이 정확한지 확인 (https:// 포함)

  Q. 어드민 페이지 접근 불가
  → WAF 규칙에서 본인 IP가 허용됐는지 확인
  → /admin/login 직접 접속 시도

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  배포 후 할 일
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  □ 시드 계정 비밀번호 즉시 변경
  □ 실제 도메인으로 NEXT_PUBLIC_APP_URL 업데이트
  □ Postmark API 키 입력 (이메일 발송)
  □ OpenAI / Anthropic API 키 입력 (ANN 검증)
  □ 어드민 2FA(TOTP) 활성화
  □ Railway 자동 백업 설정

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SignalX, Danny Park (박 대니)
annglobal.us · manager@ainewsnetwork.io
