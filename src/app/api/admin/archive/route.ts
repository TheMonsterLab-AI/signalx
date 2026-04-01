import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/archive — 아카이브 전체 검색
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp       = req.nextUrl.searchParams
  const page     = parseInt(sp.get('page')  || '1')
  const limit    = Math.min(parseInt(sp.get('limit') || '20'), 100)
  const q        = sp.get('q')         // 토큰 또는 카테고리
  const country  = sp.get('country')
  const category = sp.get('category')
  const status   = sp.get('status')
  const grade    = sp.get('grade')
  const dateFrom = sp.get('from')
  const dateTo   = sp.get('to')

  const where: any = {
    // 완료된 제보만 (DISTRIBUTION_COMPLETE 또는 REJECTED)
    stage: { in: ['VERIFICATION_COMPLETE', 'DISTRIBUTION_IN_PROGRESS', 'DISTRIBUTION_COMPLETE'] },
    ...(country  ? { country }                                                         : {}),
    ...(category ? { category: category as any }                                       : {}),
    ...(status   ? { status:   status   as any }                                       : {}),
    ...(grade    ? { annGrade: grade    as any }                                       : {}),
    ...(q        ? { trackingToken: { contains: q.toUpperCase() } }                    : {}),
    ...(dateFrom || dateTo ? {
      submittedAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo)   } : {}),
      }
    } : {}),
  }

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: {
        annVerification: {
          select: { finalScore: true, finalGrade: true, completedAt: true },
        },
        _count: { select: { distributions: true } },
      },
      orderBy: { submittedAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.signal.count({ where }),
  ])

  const { decryptFromString } = await import('@/lib/crypto')

  // 복호화 (Vault 이동된 제보는 [VAULT_TRANSFERRED])
  const items = signals.map((s: any) => {
    let title = s.title
    if (title !== '[VAULT_TRANSFERRED]') {
      try { title = decryptFromString(s.title) } catch {}
    }
    return { ...s, title }
  })

  return NextResponse.json({
    signals: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
