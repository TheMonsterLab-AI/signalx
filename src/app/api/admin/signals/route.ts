/**
 * Admin Signal Management API
 * GET  /api/admin/signals        — list with filters
 * PATCH /api/admin/signals/[id]  — update stage/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { decryptFromString } from '@/lib/crypto'
import { STAGE_LABELS } from '@/types'

export async function GET(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER', 'ANALYST'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const sp = req.nextUrl.searchParams
  
  // ── Build filters ─────────────────────────────────────────────────────────
  const where: any = {}
  
  const category = sp.get('category')
  if (category && category !== 'ALL') where.category = category
  
  const country = sp.get('country')
  if (country) where.country = { contains: country, mode: 'insensitive' }
  
  const stage = sp.get('stage')
  if (stage && stage !== 'ALL') where.stage = stage
  
  const status = sp.get('status')
  if (status && status !== 'ALL') where.status = status
  
  const search = sp.get('q')
  // NOTE: encrypted fields can't be searched directly
  // In production: maintain a search-friendly index of non-sensitive fields
  
  // Region/country-based access control
  if (admin.role === 'SIGNAL_LEADER' && admin.region) {
    // Signal leaders only see their assigned region
    where.assignedLeaderId = admin.id
  }
  
  // ── Pagination ────────────────────────────────────────────────────────────
  const page  = parseInt(sp.get('page')  || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '20'), 100)
  const skip  = (page - 1) * limit
  
  // ── Query ─────────────────────────────────────────────────────────────────
  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: {
        annVerification: {
          select: { finalScore: true, finalGrade: true, completedAt: true }
        },
        _count: {
          select: { attachments: true, distributions: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.signal.count({ where })
  ])
  
  // ── Decrypt titles for display ────────────────────────────────────────────
  const decrypted = signals.map((s: any) => {
    let title = s.title
    try { title = decryptFromString(s.title) } catch {}
    
    return {
      id:           s.id,
      trackingToken: s.trackingToken,
      title,
      category:     s.category,
      country:      s.country,
      stage:        s.stage,
      status:       s.status,
      stageLabel:   STAGE_LABELS[s.stage as keyof typeof STAGE_LABELS],
      submittedAt:  s.submittedAt.toISOString(),
      updatedAt:    s.updatedAt.toISOString(),
      annScore:     s.annVerification?.finalScore,
      annGrade:     s.annVerification?.finalGrade,
      hasReport:    !!s.annVerification?.completedAt,
      attachments:  s._count.attachments,
      distributions: s._count.distributions,
    }
  })
  
  return NextResponse.json({
    signals: decrypted,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  })
}

// ── PATCH: Update signal stage (approve/reject/distribute) ───────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { action, note } = await req.json()
  
  const signal = await prisma.signal.findUnique({ where: { id: params.id } })
  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  const validActions: Record<string, { stage: string; status?: string }> = {
    APPROVE_FOR_ANN:  { stage: 'LEADER_REVIEW' },
    REJECT:           { stage: 'VERIFICATION_COMPLETE', status: 'REJECTED' },
    APPROVE_DIST:     { stage: 'DISTRIBUTION_IN_PROGRESS' },
    MARK_COMPLETE:    { stage: 'DISTRIBUTION_COMPLETE' },
  }
  
  const update = validActions[action]
  if (!update) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  
  const updated = await prisma.signal.update({
    where: { id: params.id },
    data: {
      stage:  update.stage as any,
      status: update.status as any ?? undefined,
      stageHistory: {
        create: {
          stage:     update.stage as any,
          note:      note ?? `${action} by admin`,
          actorType: 'ADMIN',
          actorId:   admin.id,
        }
      }
    }
  })
  
  // Audit log
  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     `SIGNAL_${action}`,
      entityType: 'Signal',
      entityId:   params.id,
      details:    { note, previousStage: signal.stage, newStage: update.stage },
    }
  })
  
  return NextResponse.json({ success: true, stage: updated.stage })
}
