import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const hmacHash = (v: string) =>
  crypto.createHmac('sha256', process.env.HMAC_SECRET!).update(v.toLowerCase().trim()).digest('hex')

// GET /api/admin/inquiries — 문의 목록
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp     = req.nextUrl.searchParams
  const page   = parseInt(sp.get('page')   || '1')
  const limit  = Math.min(parseInt(sp.get('limit') || '20'), 100)
  const status = sp.get('status')
  const type   = sp.get('type')
  const assignedToMe = sp.get('mine') === 'true'

  const where: any = {
    ...(status       ? { status: status as any } : {}),
    ...(type         ? { type:   type   as any } : {}),
    ...(assignedToMe ? { assignedToId: admin.id } : {}),
  }

  const [inquiries, total] = await Promise.all([
    prisma.mediaInquiry.findMany({
      where,
      include: {
        signal:     { select: { trackingToken: true, category: true, country: true } },
        reporter:   { select: { name: true, organization: true, country: true } },
        assignedTo: { select: { name: true, role: true } },
      },
      orderBy: [{ priority: 'asc' }, { receivedAt: 'desc' }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.mediaInquiry.count({ where }),
  ])

  // KPI
  const [received, inReview, replied, urgent] = await Promise.all([
    prisma.mediaInquiry.count({ where: { status: 'RECEIVED' } }),
    prisma.mediaInquiry.count({ where: { status: 'IN_REVIEW' } }),
    prisma.mediaInquiry.count({ where: { status: 'REPLIED'   } }),
    prisma.mediaInquiry.count({ where: { priority: 'URGENT'  } }),
  ])

  return NextResponse.json({
    inquiries,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: { received, inReview, replied, urgent },
  })
}

// POST /api/admin/inquiries — 문의 수동 등록 (이메일 등으로 받은 문의 입력)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { signalToken, fromEmail, fromName, fromOrganization,
          reporterId, type, subject, content, priority } = body

  // 제보 토큰으로 Signal 조회
  let signalId: string | undefined
  if (signalToken) {
    const { hashSessionToken } = await import('@/lib/crypto')
    const signal = await prisma.signal.findUnique({
      where: { trackingToken: hashSessionToken(signalToken) },
    })
    signalId = signal?.id
  }

  const inquiry = await prisma.mediaInquiry.create({
    data: {
      signalId:        signalId ?? null,
      reporterId:      reporterId ?? null,
      fromEmailHash:   fromEmail ? hmacHash(fromEmail) : null,
      fromName,
      fromOrganization,
      type:     type     || 'GENERAL',
      subject,
      content,
      priority: priority || 'NORMAL',
      status:  'RECEIVED',
      assignedToId: admin.id,
    },
  })

  return NextResponse.json({ success: true, inquiry }, { status: 201 })
}
