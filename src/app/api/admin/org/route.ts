import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/crypto'

// GET /api/admin/org — list admin users
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR', 'REGIONAL_LEAD'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp   = req.nextUrl.searchParams
  const role = sp.get('role')

  const users = await prisma.adminUser.findMany({
    where: {
      ...(role ? { role: role as any } : {}),
      ...(admin.role === 'REGIONAL_LEAD' ? { region: admin.region ?? undefined } : {}),
    },
    select: {
      id:          true,
      name:        true,
      email:       true,
      role:        true,
      region:      true,
      country:     true,
      active:      true,
      lastLoginAt: true,
      createdAt:   true,
      _count:      { select: { assignedSignals: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ users })
}

// POST /api/admin/org — create new admin user (GLOBAL_DIRECTOR only)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, role, region, country, password } = await req.json()

  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: '이미 존재하는 이메일입니다' }, { status: 409 })

  const hashedPassword = await hashPassword(password)

  const user = await prisma.adminUser.create({
    data: { name, email, role, region, country, hashedPassword, active: true },
    select: { id: true, name: true, email: true, role: true, region: true, createdAt: true },
  })

  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     'ADMIN_USER_CREATED',
      entityType: 'AdminUser',
      entityId:   user.id,
      details:    { name, email, role },
    },
  })

  return NextResponse.json({ success: true, user }, { status: 201 })
}

// PATCH /api/admin/org/[id] — update or deactivate user
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const id = sp.get('id')
  if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const body = await req.json()
  const allowed = ['name', 'region', 'country', 'active', 'role']
  const data: any = {}
  for (const k of allowed) {
    if (k in body) data[k] = body[k]
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true },
  })

  await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     'ADMIN_USER_UPDATED',
      entityType: 'AdminUser',
      entityId:   id,
      details:    data,
    },
  })

  return NextResponse.json({ success: true, user: updated })
}
