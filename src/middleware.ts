/**
 * Next.js Edge Middleware
 * - Admin route protection (session cookie check)
 * - Rate limiting (submit endpoint)
 * - Security headers
 * - 개발환경: NEXT_PUBLIC_DEV_BYPASS=true 시 세션 체크 생략
 */

import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX    = 10
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const response = NextResponse.next()

  // ── Security Headers ─────────────────────────────────────────────────────
  response.headers.set('X-Content-Type-Options',  'nosniff')
  response.headers.set('X-Frame-Options',          'DENY')
  response.headers.set('X-XSS-Protection',         '1; mode=block')
  response.headers.set('Referrer-Policy',          'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy',       'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // ── Admin Route Protection ────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {

    // 개발환경 bypass: .env.local 에 NEXT_PUBLIC_DEV_BYPASS=true 추가 시 세션 체크 생략
    const isDev    = process.env.NODE_ENV === 'development'
    const bypass   = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
    const isDevBypass = isDev && bypass

    if (!isDevBypass) {
      const sessionCookie = req.cookies.get('sx_session')
      if (!sessionCookie) {
        const loginUrl = new URL('/admin/login', req.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  if (pathname === '/api/submit' && req.method === 'POST') {
    const ip  = req.headers.get('cf-connecting-ip')
               || req.headers.get('x-forwarded-for')?.split(',')[0].trim()
               || 'unknown'
    const now  = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    } else {
      entry.count++
      if (entry.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { success: false, error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } }
        )
      }
    }

    if (Math.random() < 0.01) {
      for (const [key, val] of rateLimitMap.entries()) {
        if (val.resetAt < now) rateLimitMap.delete(key)
      }
    }
  }

  // ── CORS ─────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin',      origin)
      response.headers.set('Access-Control-Allow-Methods',     'GET, POST, PATCH, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers',     'Content-Type, Authorization')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
