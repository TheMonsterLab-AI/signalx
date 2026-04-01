import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalSignals,
    todaySignals,
    pendingCount,
    inProcessCount,
    distributedCount,
    riskNodes,
    annRecord,
  ] = await Promise.all([
    prisma.signal.count(),
    prisma.signal.count({ where: { submittedAt: { gte: today } } }),
    prisma.signal.count({ where: { status: 'PENDING' } }),
    prisma.signal.count({ where: { stage: { in: ['LEADER_REVIEW', 'ANN_PROCESSING'] } } }),
    prisma.signal.count({ where: { distributed: true } }),
    prisma.riskNode.findMany({ where: { riskLevel: { in: ['CRITICAL', 'HIGH'] } } }),
    // Latest ANN processing time
    prisma.annVerification.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { processingMs: true },
    }),
  ])

  // Verified rate
  const verifiedCount = await prisma.signal.count({
    where: { status: { in: ['VERIFIED', 'LIKELY_TRUE'] } },
  })
  const verifiedRate = totalSignals > 0 ? Math.round((verifiedCount / totalSignals) * 1000) / 10 : 0

  // 7-day trend (signals per day)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentSignals = await prisma.signal.findMany({
    where: { submittedAt: { gte: sevenDaysAgo } },
    select: { submittedAt: true, category: true },
  })

  // Group by day
  const trendMap: Record<string, number> = {}
  recentSignals.forEach((s: any) => {
    const day = s.submittedAt.toISOString().slice(0, 10)
    trendMap[day] = (trendMap[day] || 0) + 1
  })

  return NextResponse.json({
    totalSignals,
    todaySignals,
    verifiedRate,
    pendingCount,
    inProcessCount,
    distributedCount,
    riskHotspots: riskNodes.length,
    annEngineStatus: 'ACTIVE',
    annLatencyMs: annRecord?.processingMs ? Math.round(annRecord.processingMs / 1000) : 14,
    trend7d: trendMap,
  })
}
