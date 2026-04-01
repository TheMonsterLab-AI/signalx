/**
 * POST /api/admin/auth/login
 * Admin authentication with 2FA support
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyPassword,
  verifyTOTP,
  generateSessionToken,
  hashSessionToken,
  getAnonymizedIP,
} from '@/lib/crypto'
import type { AdminLoginRequest, AdminLoginResponse } from '@/types'

export const runtime = 'nodejs'

const SESSION_DURATION_HOURS = 8

export async function POST(req: NextRequest) {
  try {
    const body: AdminLoginRequest = await req.json()
    
    // ── Rate limit check (in middleware) ────────────────────────────────────
    // Additional check here for brute force
    const anonIP = getAnonymizedIP(req.headers)
    
    // ── Find admin user ──────────────────────────────────────────────────────
    // Admin identifiers format: SNX-XXXX maps to email
    // In production, maintain a separate lookup table
    const user = await prisma.adminUser.findFirst({
      where: {
        email:  { contains: body.identifier.replace('SNX-', '') },
        active: true,
      }
    })
    
    if (!user) {
      await delay(300) // Prevent timing enumeration
      return failResponse('인증 정보가 올바르지 않습니다.')
    }
    
    // ── Account lockout check ────────────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return failResponse('계정이 잠겼습니다. 잠시 후 다시 시도하세요.')
    }
    
    // ── Verify password ──────────────────────────────────────────────────────
    const passwordValid = await verifyPassword(body.password, user.hashedPassword)
    
    if (!passwordValid) {
      const attempts = user.loginAttempts + 1
      const locked   = attempts >= 5
      
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil:   locked ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15min
        }
      })
      
      await logAudit(user.id, 'LOGIN_FAILED', anonIP)
      return failResponse('인증 정보가 올바르지 않습니다.')
    }
    
    // ── 2FA verification ─────────────────────────────────────────────────────
    if (user.totpEnabled) {
      if (!body.totpCode) {
        return NextResponse.json<AdminLoginResponse>({
          success:      false,
          requiresTOTP: true,
        })
      }
      
      const totpValid = verifyTOTP(user.totpSecret!, body.totpCode)
      if (!totpValid) {
        await logAudit(user.id, 'TOTP_FAILED', anonIP)
        return failResponse('2FA 코드가 올바르지 않습니다.')
      }
    }
    
    // ── Create session ────────────────────────────────────────────────────────
    const rawToken    = generateSessionToken()
    const hashedToken = hashSessionToken(rawToken)
    const expiresAt   = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
    
    await prisma.adminSession.create({
      data: {
        userId:    user.id,
        token:     hashedToken,
        ipAddress: anonIP,
        // userAgent 미저장 — SecureDrop 원칙 준수
        expiresAt,
      }
    })
    
    // Reset login attempts on success
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil:   null,
        lastLoginAt:   new Date(),
      }
    })
    
    await logAudit(user.id, 'LOGIN_SUCCESS', anonIP)
    
    // ── Return session (raw token — never stored, just returned once) ─────────
    const response: AdminLoginResponse = {
      success:      true,
      sessionToken: rawToken,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        role:   user.role as any,
        region: user.region ?? undefined,
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        'Set-Cookie': [
          `sx_session=${rawToken}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=${SESSION_DURATION_HOURS * 3600}`,
        ].join(', '),
        'Cache-Control': 'no-store',
      }
    })
    
  } catch (error) {
    console.error('[AUTH/LOGIN] Error:', error)
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}

// ── POST /api/admin/auth/logout ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('sx_session')?.value
  if (token) {
    const hashed = hashSessionToken(token)
    await prisma.adminSession.updateMany({
      where: { token: hashed },
      data:  { revokedAt: new Date() }
    })
  }
  
  return NextResponse.json({ success: true }, {
    headers: {
      'Set-Cookie': 'sx_session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0',
    }
  })
}

function failResponse(message: string) {
  return NextResponse.json<AdminLoginResponse>({ success: false, error: message }, { status: 401 })
}

async function logAudit(userId: string, action: string, ipHash: string) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'AdminUser',
      entityId:   userId,
      details:    { ipHash },
    }
  }).catch(() => {}) // Don't throw on audit failures
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
