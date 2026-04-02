import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/review — 인간 검토 큐
// 필터: assignedToMe, country, minScore, riskLevel
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp           = req.nextUrl.searchParams
  const page         = parseInt(sp.get('page')  || '1')
  const limit        = Math.min(parseInt(sp.get('limit') || '20'), 100)
  const assignedToMe = sp.get('assignedToMe') === 'true'
  const country      = sp.get('country')
  const minScore     = sp.get('minScore') ? parseInt(sp.get('minScore')!) : undefined
  const riskLevel    = sp.get('riskLevel') // urgent | high | all

  // RBAC: 시그널 리더는 자기 지역 제보만
  const regionFilter = admin.role === 'SIGNAL_LEADER' && admin.country
    ? { country: admin.country }
    : {}

  // 추가 필터
  const extraFilter: any = {}
  if (assignedToMe)  extraFilter.assignedLeaderId = admin.id
  if (country)       extraFilter.country           = country

  // ANN 점수 필터 (riskLevel 우선, minScore 보조)
  let scoreFilter: any = {}
  if (riskLevel === 'urgent') {
    scoreFilter = { annScore: { lt: 60 } }
  } else if (riskLevel === 'high') {
    scoreFilter = { annScore: { gte: 60, lt: 80 } }
  } else if (minScore !== undefined) {
    scoreFilter = { annScore: { gte: minScore } }
  }

  const where = {
    ...regionFilter,
    ...extraFilter,
    status: { in: ['PENDING', 'UNDER_REVIEW'] as any },
    OR: scoreFilter.annScore
      ? undefined
      : [
          { annScore: { lt: 80 } },
          { annScore: null },
          { annGrade: { in: ['UNDER_REVIEW', 'UNVERIFIED'] as any } },
        ],
    ...(scoreFilter.annScore ? scoreFilter : {}),
  }

  // undefined OR 제거
  if (!where.OR) delete where.OR

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: {
        annVerification: {
          select: {
            finalScore:   true,
            finalGrade:   true,
            startedAt:    true,
            completedAt:  true,
          },
        },
        assignedLeader: { select: { name: true, country: true } },
        stageHistory:   { orderBy: { timestamp: 'asc' } },
        _count:         { select: { attachments: true } },
      },
      orderBy: [
        { annScore: 'asc' },
        { submittedAt: 'asc' },
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

  // 큐 통계 (필터 무관 전체 기준)
  const baseWhere = {
    ...regionFilter,
    status: { in: ['PENDING', 'UNDER_REVIEW'] as any },
    OR: [
      { annScore: { lt: 80 } },
      { annScore: null },
      { annGrade: { in: ['UNDER_REVIEW', 'UNVERIFIED'] as any } },
    ],
  }

  const [urgent, high, unassigned] = await Promise.all([
    prisma.signal.count({ where: { ...baseWhere, annScore: { lt: 60 } } }),
    prisma.signal.count({ where: { ...baseWhere, annScore: { gte: 60, lt: 80 } } }),
    prisma.signal.count({ where: { ...baseWhere, assignedLeaderId: null } }),
  ])

  const totalBase = await prisma.signal.count({ where: baseWhere })

  return NextResponse.json({
    signals: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { total: totalBase, urgent, high, unassigned },
  })
}
