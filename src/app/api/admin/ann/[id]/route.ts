import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { triggerAnnReprocessing } from '@/lib/ann-queue'
import { decryptFromString } from '@/lib/crypto'

// GET /api/admin/ann/[id]  — full verification detail
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // id can be signal id or verification id
  let verification = await prisma.annVerification.findFirst({
    where: { OR: [{ id: params.id }, { signalId: params.id }] },
    include: {
      signal: {
        include: {
          attachments:   { select: { mimeType: true, sizeBytes: true, exifStripped: true } },
          distributions: { include: { partner: { select: { name: true, type: true, country: true } } } },
          stageHistory:  { orderBy: { timestamp: 'asc' } },
        },
      },
    },
  })

  if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let title = verification.signal.title
  try { title = decryptFromString(verification.signal.title) } catch {}

  return NextResponse.json({
    ...verification,
    signal: { ...verification.signal, title },
  })
}

// POST /api/admin/ann/[id]/reprocess — trigger re-verification
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // id = signalId
  const signal = await prisma.signal.findUnique({ where: { id: params.id } })
  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await triggerAnnReprocessing(params.id, admin.id)

  return NextResponse.json({ success: true, message: 'ANN 재처리가 큐에 등록되었습니다' })
}
