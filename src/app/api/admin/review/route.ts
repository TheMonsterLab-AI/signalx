import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/review — 인간 검토 큐
// ANN 신뢰도 80점 미만 OR 고위험 분류된 제보만
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp    = req.nextUrl.searchParams
  const page  = parseInt(sp.get('page') || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '20'), 100)

  // RBAC: 시그널 리더는 자기 지역 제보만
  const regionFilter = admin.role === 'SIGNAL_LEADER' && admin.country
    ? { country: admin.country }
    : {}

  const where = {
    ...regionFilter,
    status: { in: ['PENDING', 'UNDER_REVIEW'] as any },
    OR: [
      // ANN 신뢰도 80점 미만
      { annScore: { lt: 80 } },
      // ANN 검증 없음 (아직 처리 중)
      { annScore: null },
      // 고위험 등급
      { annGrade: { in: ['UNDER_REVIEW', 'UNVERIFIED'] as any } },
    ],
  }

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: {
        annVerification: {
          select: { finalScore: true, finalGrade: true, startedAt: true, completedAt: true },
        },
        assignedLeader: { select: { name: true, country: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: [
        { annScore: 'asc' },      // 낮은 점수 먼저
        { submittedAt: 'asc' },   // 오래된 제보 먼저
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.signal.count({ where }),
  ])

  const { decryptFromString } = await import('@/lib/crypto')

  const items = signals.map((s: any) => {
    let title = s.title
    try { title = decryptFromString(s.title) } catch {}
    return { ...s, title }
  })

  // 큐 통계
  const [urgent, high, unassigned] = await Promise.all([
    prisma.signal.count({ where: { ...where, annScore: { lt: 60 } } }),
    prisma.signal.count({ where: { ...where, annScore: { gte: 60, lt: 80 } } }),
    prisma.signal.count({ where: { ...where, assignedLeaderId: null } }),
  ])

  return NextResponse.json({
    signals: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { total, urgent, high, unassigned },
  })
}
