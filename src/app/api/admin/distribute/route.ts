import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { prepareDistribution, confirmDistribution } from '@/lib/distribution'

// GET — 배포 로그 조회
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp    = req.nextUrl.searchParams
  const page  = parseInt(sp.get('page')  || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '20'), 100)
  const signalId = sp.get('signalId')

  const where: any = {
    ...(signalId ? { signalId } : {}),
  }

  const [distributions, total] = await Promise.all([
    prisma.distribution.findMany({
      where,
      include: {
        partner:  { select: { name: true, type: true, country: true } },
        reporter: { select: { name: true, organization: true, email: true } },
        signal:   { select: { trackingToken: true, category: true, country: true } },
      },
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.distribution.count({ where }),
  ])

  return NextResponse.json({ distributions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

// POST — 두 단계:
//   action: "PREPARE"  → 기자 자동 추천 + 드래프트 생성 (발송 안 함)
//   action: "CONFIRM"  → 데스크 최종 승인 후 실제 발송
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, signalId, distributionIds, reporterIds, deskNote } = await req.json()

  if (!signalId) return NextResponse.json({ error: 'signalId 필수' }, { status: 400 })

  // ── 1단계: 기자 추천 + 드래프트 생성 ──────────────────────────────────────
  if (action === 'PREPARE') {
    const result = await prepareDistribution(signalId, admin.id, reporterIds)

    await prisma.auditLog.create({
      data: {
        userId:     admin.id,
        action:     'DISTRIBUTION_PREPARED',
        entityType: 'Signal',
        entityId:   signalId,
        details:    { suggestedCount: result.draftCount },
      },
    })

    return NextResponse.json({
      success:   true,
      suggested: result.suggested,
      draftCount: result.draftCount,
      message:  `${result.draftCount}명 기자가 추천되었습니다. 검토 후 데스크 승인이 필요합니다.`,
    })
  }

  // ── 2단계: 데스크 최종 승인 → 실제 발송 ──────────────────────────────────
  if (action === 'CONFIRM') {
    if (!distributionIds?.length) {
      return NextResponse.json({ error: '승인할 배포 대상을 선택하세요' }, { status: 400 })
    }

    const result = await confirmDistribution(
      signalId,
      admin.id,
      distributionIds,
      deskNote
    )

    return NextResponse.json({
      success: true,
      sent:    result.sent,
      failed:  result.failed,
      message: `데스크 승인 발송 완료: ${result.sent}건 성공${result.failed > 0 ? `, ${result.failed}건 실패` : ''}`,
    })
  }

  return NextResponse.json({ error: '유효하지 않은 action (PREPARE | CONFIRM)' }, { status: 400 })
}
