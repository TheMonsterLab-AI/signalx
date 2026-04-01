import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/reporters — 기자 목록 (필터: country, category, org)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp       = req.nextUrl.searchParams
  const page     = parseInt(sp.get('page')  || '1')
  const limit    = Math.min(parseInt(sp.get('limit') || '30'), 100)
  const country  = sp.get('country')
  const category = sp.get('category')
  const org      = sp.get('org')
  const q        = sp.get('q')
  const activeOnly = sp.get('active') !== 'false'

  const where: any = {
    ...(activeOnly ? { active: true } : {}),
    ...(country    ? { country }      : {}),
    ...(category   ? { preferredCategories: { has: category } } : {}),
    ...(org        ? { organization: { contains: org, mode: 'insensitive' } } : {}),
    ...(q ? {
      OR: [
        { name:         { contains: q, mode: 'insensitive' } },
        { organization: { contains: q, mode: 'insensitive' } },
        { department:   { contains: q, mode: 'insensitive' } },
      ]
    } : {}),
  }

  const [reporters, total] = await Promise.all([
    prisma.reporter.findMany({
      where,
      include: {
        mediaPartner: { select: { name: true, type: true } },
        _count: { select: { distributions: true, inquiries: true } },
      },
      orderBy: [{ responseRate: 'desc' }, { totalDeliveries: 'desc' }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.reporter.count({ where }),
  ])

  // Stats
  const [totalReporters, verifiedCount, avgResponseRate] = await Promise.all([
    prisma.reporter.count({ where: { active: true } }),
    prisma.reporter.count({ where: { active: true, verified: true } }),
    prisma.reporter.aggregate({ _avg: { responseRate: true }, where: { active: true } }),
  ])

  return NextResponse.json({
    reporters,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: {
      total:           totalReporters,
      verified:        verifiedCount,
      avgResponseRate: Math.round((avgResponseRate._avg.responseRate ?? 0) * 10) / 10,
    },
  })
}

// POST /api/admin/reporters — 기자 등록
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, email, phone, organization, department, title,
          country, mediaPartnerId, preferredCategories, preferredLanguages, notes, tags } = body

  if (!name || !email || !organization || !country) {
    return NextResponse.json({ error: '이름, 이메일, 소속, 국가는 필수입니다' }, { status: 400 })
  }

  const existing = await prisma.reporter.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: '이미 등록된 이메일입니다' }, { status: 409 })

  const reporter = await prisma.reporter.create({
    data: {
      name, email, phone, organization, department, title, country,
      mediaPartnerId: mediaPartnerId || null,
      preferredCategories: preferredCategories || [],
      preferredLanguages:  preferredLanguages  || ['ko', 'en'],
      notes, tags: tags || [],
      addedById: admin.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     'REPORTER_CREATED',
      entityType: 'Reporter',
      entityId:   reporter.id,
      details:    { name, organization, country },
    },
  })

  return NextResponse.json({ success: true, reporter }, { status: 201 })
}

// PATCH /api/admin/reporters?id=xxx — 기자 정보 수정
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD', 'SIGNAL_LEADER'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const body = await req.json()
  const allowed = ['name','phone','organization','department','title','country',
                   'preferredCategories','preferredLanguages','active','verified','notes','tags']
  const data: any = {}
  for (const k of allowed) { if (k in body) data[k] = body[k] }

  const reporter = await prisma.reporter.update({ where: { id }, data })

  await prisma.auditLog.create({
    data: {
      userId: admin.id, action: 'REPORTER_UPDATED',
      entityType: 'Reporter', entityId: id, details: data,
    },
  })

  return NextResponse.json({ success: true, reporter })
}
