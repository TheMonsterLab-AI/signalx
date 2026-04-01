import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp        = req.nextUrl.searchParams
  const page      = parseInt(sp.get('page')  || '1')
  const limit     = Math.min(parseInt(sp.get('limit') || '30'), 100)
  const type      = sp.get('type')
  const status    = sp.get('status')
  const direction = sp.get('direction')

  const where: any = {
    ...(type      ? { emailType:  type      as any } : {}),
    ...(status    ? { status:     status    as any } : {}),
    ...(direction ? { direction:  direction as any } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id:             true,
        direction:      true,
        recipientHash:  true,
        emailType:      true,
        subjectHash:    true,
        contentHash:    true,
        signalToken:    true,
        status:         true,
        providerMsgId:  true,
        deliveredAt:    true,
        failureReason:  true,
        sentAt:         true,
      },
    }),
    prisma.emailLog.count({ where }),
  ])

  // KPI stats
  const [totalAll, delivered, failed, outbound] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: 'DELIVERED' } }),
    prisma.emailLog.count({ where: { status: 'FAILED'    } }),
    prisma.emailLog.count({ where: { direction: 'OUTBOUND' } }),
  ])

  const deliveryRate = totalAll > 0
    ? Math.round((delivered / totalAll) * 10000) / 100
    : 100

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { totalAll, delivered, failed, outbound, deliveryRate },
  })
}
