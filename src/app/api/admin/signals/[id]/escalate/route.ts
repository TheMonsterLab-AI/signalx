import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// POST /api/admin/signals/[id]/escalate — Global Director 즉시 검토 요청
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await req.json()

  const signal = await prisma.signal.findUnique({
    where: { id: params.id },
    select: { id: true, stage: true, annScore: true, annGrade: true },
  })
  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 감사 로그에 에스컬레이션 기록
  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     'ESCALATION_REQUESTED',
      entityType: 'Signal',
      entityId:   params.id,
      details: {
        reason:      reason || '수동 에스컬레이션',
        requestedBy: admin.name,
        requestedAt: new Date().toISOString(),
        annScore:    signal.annScore,
        annGrade:    signal.annGrade,
      },
    },
  })

  // 시그널 히스토리에도 기록
  await prisma.signal.update({
    where: { id: params.id },
    data: {
      stageHistory: {
        create: {
          stage:     signal.stage as any,
          note:      `에스컬레이션: ${reason || 'Global Director 즉시 검토 요청'} (요청자: ${admin.name})`,
          actorType: 'ADMIN',
          actorId:   admin.id,
        },
      },
    },
  })

  return NextResponse.json({ success: true, message: 'Global Director에게 에스컬레이션 요청이 전송되었습니다' })
}
