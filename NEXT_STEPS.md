# SignalX — 배포 후 완전 가이드
# 대표님이 해야 할 모든 것

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  현재 상태 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  코드: 완성 (TypeScript 0 오류)
  보안: SecureDrop 원칙 100% 준수
  배포: Railway + Cloudflare Tunnel 설정 완료
  남은 것: 실제 서비스 계정 연결 + 배포 실행

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 1 — 즉시 (오늘, 약 40분)
  "서비스를 인터넷에 올리기"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─ STEP 1-1. 계정 3개 준비 (10분) ──────────────────┐
  │                                                    │
  │  1. github.com → 무료 계정 (이미 있으면 건너뜀)    │
  │  2. railway.app → 무료 계정                        │
  │  3. cloudflare.com → 무료 계정                     │
  │     (도메인 구매: namecheap.com 또는 가비아)        │
  │                                                    │
  └────────────────────────────────────────────────────┘

  ┌─ STEP 1-2. GitHub 업로드 (5분) ───────────────────┐
  │                                                    │
  │  터미널에서:                                        │
  │  cd signalx                                        │
  │  git init                                          │
  │  git add .                                         │
  │  git commit -m "Initial commit"                    │
  │                                                    │
  │  GitHub에서 새 저장소 생성 후:                      │
  │  git remote add origin https://github.com/...     │
  │  git push -u origin main                           │
  │                                                    │
  │  ⚠️  저장소는 반드시 Private 설정                   │
  └────────────────────────────────────────────────────┘

  ┌─ STEP 1-3. 암호화 키 생성 (2분) ─────────────────┐
  │                                                    │
  │  터미널에서 아래 명령어 실행 후 결과값 저장:        │
  │                                                    │
  │  openssl rand -hex 32   → ENCRYPTION_KEY 로 저장  │
  │  openssl rand -hex 64   → HMAC_SECRET 로 저장     │
  │                                                    │
  │  예시 결과:                                         │
  │  a3f9b2c1d4e5f6... (64자) → ENCRYPTION_KEY        │
  │  9b8a7c6d5e4f3a... (128자) → HMAC_SECRET           │
  │                                                    │
  │  ⚠️  이 값들은 절대 GitHub에 올리면 안 됩니다        │
  └────────────────────────────────────────────────────┘

  ┌─ STEP 1-4. Railway 배포 (15분) ───────────────────┐
  │                                                    │
  │  1. railway.app 접속 → New Project                 │
  │  2. Deploy from GitHub → signalx 선택              │
  │  3. Add Service → Database → PostgreSQL            │
  │  4. Variables 탭에서 아래 입력:                     │
  │                                                    │
  │     NODE_ENV             = production              │
  │     ENCRYPTION_KEY       = (1-3에서 생성한 값)     │
  │     HMAC_SECRET          = (1-3에서 생성한 값)     │
  │     NEXT_PUBLIC_APP_URL  = https://signalx.global  │
  │     WEBHOOK_SECRET       = (임의 문자열 아무거나)   │
  │     VAULT_DIR            = /tmp/signalx-vault      │
  │     ALLOWED_ORIGINS      = https://signalx.global  │
  │                                                    │
  │  5. Deploy 클릭 → 빌드 완료 대기 (5-10분)           │
  │  6. Settings → Generate Domain → URL 복사          │
  │                                                    │
  │  7. DB 초기화 (한 번만):                            │
  │     Railway → New Service → Run Command:           │
  │     npx prisma db push && npx tsx prisma/seed.ts   │
  └────────────────────────────────────────────────────┘

  ┌─ STEP 1-5. Cloudflare Tunnel 연결 (10분) ─────────┐
  │                                                    │
  │  1. brew install cloudflared  (Mac)                │
  │     또는 apt install cloudflared  (Linux)          │
  │                                                    │
  │  2. cloudflared tunnel login                       │
  │     (브라우저에서 도메인 선택)                       │
  │                                                    │
  │  3. cloudflared tunnel create signalx              │
  │     (터널 ID 메모: abc123-def456-...)               │
  │                                                    │
  │  4. deploy/cloudflare-tunnel-config.yml 수정:      │
  │     - <YOUR_TUNNEL_ID> → 터널 ID 로 교체           │
  │     - service: http://localhost:3000 →             │
  │       https://[Railway URL]                        │
  │                                                    │
  │  5. DNS 등록:                                       │
  │     cloudflared tunnel route dns signalx \         │
  │       signalx.global                              │
  │                                                    │
  │  6. 실행:                                           │
  │     cloudflared tunnel run signalx                 │
  │                                                    │
  │  7. https://signalx.global 접속 확인 ✅             │
  └────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 2 — 배포 직후 (당일, 30분)
  "보안 설정 완료"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  □ 어드민 비밀번호 즉시 변경
    → https://admin.signalx.global/admin/login
    → 기본 계정: danny@signalx.io / signalx-admin-2025!
    → 로그인 후 조직관리 → 비밀번호 변경

  □ Cloudflare WAF 규칙 적용
    → deploy/cloudflare-waf-rules.md 참고
    → 어드민 IP 제한 설정 (본인 IP만 허용)
    → Rate Limit 규칙 추가

  □ SSL 설정
    → Cloudflare → SSL/TLS → Full (strict)
    → Always Use HTTPS: ON
    → HSTS: ON

  □ 헬스체크 확인
    → https://signalx.global/api/health
    → {"status":"healthy"} 확인


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 3 — 1주일 이내
  "핵심 기능 활성화"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─ ANN AI 엔진 연결 (가장 중요) ────────────────────┐
  │                                                    │
  │  Railway Variables에 추가:                         │
  │                                                    │
  │  OPENAI_API_KEY     = sk-...                       │
  │    → platform.openai.com → API Keys                │
  │                                                    │
  │  ANTHROPIC_API_KEY  = sk-ant-...                   │
  │    → console.anthropic.com → API Keys              │
  │                                                    │
  │  GOOGLE_AI_API_KEY  = AIza...                      │
  │    → aistudio.google.com → Get API Key             │
  │                                                    │
  │  TOGETHER_API_KEY   = ...                          │
  │    → api.together.xyz → Settings → API Keys        │
  │    (Llama 모델용, 월 $25 크레딧 무료 제공)          │
  │                                                    │
  │  ✅ 4개 모두 연결하면 ANN 7단계 검증 즉시 작동      │
  └────────────────────────────────────────────────────┘

  ┌─ 이메일 발송 활성화 ───────────────────────────────┐
  │                                                    │
  │  Postmark 권장 (신뢰도 높음, 월 100통 무료)         │
  │  → postmarkapp.com → 무료 계정                     │
  │  → Server → API Tokens → 복사                     │
  │                                                    │
  │  Railway Variables에 추가:                         │
  │  EMAIL_PROVIDER   = postmark                       │
  │  POSTMARK_API_KEY = (발급받은 키)                   │
  │                                                    │
  │  ✅ 제보 접수 시 자동 확인 메일 발송 시작           │
  └────────────────────────────────────────────────────┘

  ┌─ 파일 저장소 연결 ────────────────────────────────┐
  │                                                    │
  │  Cloudflare R2 권장 (월 10GB 무료)                  │
  │  → Cloudflare Dashboard → R2 → Create bucket      │
  │  → Bucket 이름: signalx-evidence                  │
  │  → Manage R2 API Tokens → Create Token            │
  │                                                    │
  │  Railway Variables에 추가:                         │
  │  STORAGE_PROVIDER = r2                             │
  │  R2_ENDPOINT      = https://[ID].r2.cloudflarestorage.com
  │  R2_ACCESS_KEY    = (발급받은 키)                   │
  │  R2_SECRET_KEY    = (발급받은 키)                   │
  │  R2_BUCKET        = signalx-evidence               │
  └────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 4 — 1개월 이내
  "파트너 온보딩"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  □ 국가별 시그널 리더 계정 생성
    → /admin/org → 조직 관리 → 새 계정 추가
    → 역할: SIGNAL_LEADER
    → 국가별 1명씩 시작 (한국, 미국, 영국, 일본, 싱가포르)

  □ 미디어 파트너 등록
    → /admin/distribute → 파트너 목록 → 파트너 추가
    → 언론사, 기관별 수신 이메일 등록

  □ 2FA(TOTP) 활성화
    → 어드민 계정마다 Google Authenticator 연동
    → 현재 코드에 totpEnabled 필드 준비됨

  □ 도메인 이메일 설정
    → report@signalx.global 수신 설정
    → Cloudflare → Email Routing → Enable


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  월간 비용 예상
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  초기 (런칭 직후):
  Railway Hobby       $5/월
  Cloudflare          $0
  도메인              $15/년 (~$1.25/월)
  ────────────────────────────────
  합계                ~$6/월

  성장 후 (트래픽 증가 시):
  Railway Pro         $20/월
  Cloudflare Pro      $20/월 (고급 WAF)
  Postmark            $15/월 (10만 통)
  ────────────────────────────────
  합계                ~$55/월


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  막힐 때 체크리스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Railway 빌드 실패
  → Variables 탭에서 ENCRYPTION_KEY (64자) 확인
  → HMAC_SECRET (128자) 확인
  → Build Logs에서 빨간 줄 복사해서 Claude에게 질문

  Prisma 마이그레이션 오류
  → DATABASE_URL 자동 주입됐는지 확인
  → Railway → PostgreSQL → Connect 탭 확인

  Cloudflare Tunnel 연결 안 됨
  → cloudflared tunnel list 로 상태 확인
  → Railway URL이 https:// 포함됐는지 확인

  어드민 페이지 접속 안 됨
  → WAF에서 본인 IP 허용됐는지 확인
  → /admin/login 직접 접속 시도

  ANN 검증이 안 됨
  → API 키 4개 모두 입력됐는지 확인
  → /api/health 에서 각 서비스 상태 확인

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SignalX — Danny Park (박 대니)
annglobal.us · manager@ainewsnetwork.io

막히는 부분은 언제든 Claude에게 질문하세요.
"Railway에서 이런 오류 났어요" 라고 오류 메시지 붙여넣으면 즉시 해결해 드립니다.
