# Cloudflare WAF 규칙 설정 가이드
# Cloudflare Dashboard → Security → WAF → Custom Rules 에서 적용

# ─── 규칙 1: Admin 경로 IP 제한 ──────────────────────────────────────────────
# 어드민 대시보드는 허용된 IP에서만 접근 가능
#
# Expression:
#   (http.host eq "admin.signalx.global") and
#   not (ip.src in {허용_IP_목록})
#
# Action: Block
# Priority: 1 (최우선)

# ─── 규칙 2: 어드민 로그인 Rate Limit ────────────────────────────────────────
# /admin/login 경로 분당 10회 초과 시 차단
#
# Expression:
#   (http.request.uri.path eq "/admin/login") and
#   (http.request.method eq "POST")
#
# Rate: 10 requests per 1 minute per IP
# Action: Block for 1 hour

# ─── 규칙 3: 제보 API Rate Limit ─────────────────────────────────────────────
# /api/submit 분당 5회 초과 시 차단 (스팸 방지)
#
# Expression:
#   (http.request.uri.path eq "/api/submit") and
#   (http.request.method eq "POST")
#
# Rate: 5 requests per 1 minute per IP
# Action: Block for 10 minutes

# ─── 규칙 4: 봇 차단 ─────────────────────────────────────────────────────────
# Known bad bots 자동 차단 (Cloudflare 기본 제공)
#
# Bot Fight Mode: ON (Dashboard → Security → Bots)

# ─── 규칙 5: DDoS 보호 ───────────────────────────────────────────────────────
# HTTP DDoS Attack Protection: Enabled (기본)
# Sensitivity: High (민감 데이터 플랫폼이므로)

# ─── 규칙 6: SSL/TLS ─────────────────────────────────────────────────────────
# SSL/TLS Mode: Full (Strict)
# Min TLS Version: 1.2
# Opportunistic Encryption: ON
# HSTS: Max-Age 1년, includeSubdomains ON
