import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { triggerAnnReprocessing } from '@/lib/ann-queue'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const signal = await prisma.signal.findUnique({
    where: { id: params.id },
    include: {
      attachments:     true,
      stageHistory:    { orderBy: { timestamp: 'asc' } },
      annVerification: true,
      distributions:   { include: { partner: true } },
    },
  })

  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { decryptFromString } = await import('@/lib/crypto')
  let title = signal.title
  let content = signal.content
  try { title = decryptFromString(signal.title) }    catch {}
  try { content = decryptFromString(signal.content) } catch {}

  return NextResponse.json({ ...signal, title, content })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, note } = await req.json()

  const signal = await prisma.signal.findUnique({ where: { id: params.id } })
  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  type StageKey = 'SUBMITTED'|'LEADER_REVIEW'|'ANN_PROCESSING'|'VERIFICATION_COMPLETE'|'DISTRIBUTION_IN_PROGRESS'|'DISTRIBUTION_COMPLETE'
  type StatusKey = 'PENDING'|'IN_PROGRESS'|'VERIFIED'|'LIKELY_TRUE'|'UNDER_REVIEW'|'UNVERIFIED'|'LIKELY_FALSE'|'REJECTED'

  const ACTIONS: Record<string, { stage: StageKey; status?: StatusKey }> = {
    APPROVE_FOR_ANN:   { stage: 'LEADER_REVIEW' },
    TRIGGER_ANN:       { stage: 'ANN_PROCESSING' },
    REJECT:            { stage: 'VERIFICATION_COMPLETE', status: 'REJECTED' },
    APPROVE_DIST:      { stage: 'DISTRIBUTION_IN_PROGRESS' },
    MARK_COMPLETE:     { stage: 'DISTRIBUTION_COMPLETE' },
  }

  const update = ACTIONS[action]
  if (!update) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  // TRIGGER_ANN: queue ANN processing
  if (action === 'TRIGGER_ANN') {
    await triggerAnnReprocessing(params.id, admin.id)
    return NextResponse.json({ success: true, message: 'ANN processing queued' })
  }

  await prisma.signal.update({
    where: { id: params.id },
    data: {
      stage:  update.stage,
      ...(update.status ? { status: update.status } : {}),
      stageHistory: {
        create: {
          stage:     update.stage,
          note:      note || `${action}`,
          actorType: 'ADMIN',
          actorId:   admin.id,
        },
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     `SIGNAL_${action}`,
      entityType: 'Signal',
      entityId:   params.id,
      details:    { note, previousStage: signal.stage, newStage: update.stage },
    },
  })

  return NextResponse.json({ success: true })
}
