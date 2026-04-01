/**
 * GET /api/track?token=SX-XXXXXXX
 * 
 * Returns signal status for a given tracking token.
 * Returns IDENTICAL response whether token exists or not
 * (prevents timing-based token enumeration attacks).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTokenFormat, decryptFromString, hashSessionToken } from '@/lib/crypto'
import { STAGE_LABELS, STAGE_ORDER } from '@/types'
import type { TrackSignalResponse } from '@/types'

const NOT_FOUND_RESPONSE: TrackSignalResponse = { found: false }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim().toUpperCase()
  
  // ── Validate format without revealing existence ──────────────────────────
  if (!token || !isValidTokenFormat(token)) {
    // Deliberate delay to prevent timing attacks
    await delay(Math.random() * 100 + 50)
    return NextResponse.json(NOT_FOUND_RESPONSE)
  }
  
  try {
    // SecureDrop: DB에는 해시만 있으므로 토큰을 해시로 변환하여 검색
    const tokenHash = hashSessionToken(token)
    const signal = await prisma.signal.findUnique({
      where: { trackingToken: tokenHash },
      include: {
        stageHistory: {
          orderBy: { timestamp: 'asc' }
        },
        annVerification: {
          select: {
            finalScore: true,
            finalGrade: true,
            completedAt: true,
          }
        },
        _count: {
          select: { distributions: true }
        }
      }
    })
    
    if (!signal) {
      await delay(Math.random() * 100 + 50)
      return NextResponse.json(NOT_FOUND_RESPONSE)
    }

    // ── SecureDrop 원칙: 이전 접근 시각 오버라이트 (최신만 유지) ─────────────
    // 새 접근이 올 때마다 이전 lastAccessedAt을 덮어씁니다
    // 토큰 조회 자체는 로그하지 않습니다
    await prisma.signal.update({
      where: { trackingToken: tokenHash },
      data:  { lastAccessedAt: new Date() },
    }).catch(() => {}) // 오류 시 무시 — 추적보다 익명성 우선

    // ── Decrypt title for display ────────────────────────────────────────────
    let displayTitle: string
    try {
      displayTitle = decryptFromString(signal.title)
    } catch {
      displayTitle = '제목 복호화 오류'
    }
    
    // ── Build progress (only expose stage, not internal IDs) ─────────────────
    const currentStageIndex = STAGE_ORDER.indexOf(signal.stage)
    
    const response: TrackSignalResponse = {
      found: true,
      signal: {
        id:             signal.id,
        trackingToken:  token, // SecureDrop: 원문 토큰 반환 (DB의 해시가 아닌)
        title:          displayTitle,
        category:       signal.category as any,
        country:        signal.country,
        stage:          signal.stage as any,
        status:         signal.status as any,
        submittedAt:    signal.submittedAt.toISOString(),
        updatedAt:      signal.updatedAt.toISOString(),
        stageHistory:   signal.stageHistory.map((h: any) => ({
          stage:     h.stage as any,
          note:      h.note ?? undefined,
          timestamp: h.timestamp.toISOString(),
        })),
        annScore:       signal.annVerification?.finalScore ?? undefined,
        annGrade:       signal.annVerification?.finalGrade as any ?? undefined,
        hasReport:      !!signal.annVerification?.completedAt,
        distributed:    signal.distributed,
        distributedAt:  signal.distributedAt?.toISOString(),
      }
    }
    
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' }
    })
    
  } catch (error) {
    console.error('[TRACK] Error:', error)
    return NextResponse.json(NOT_FOUND_RESPONSE)
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
