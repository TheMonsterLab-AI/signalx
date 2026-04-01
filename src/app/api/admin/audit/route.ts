import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, ['GLOBAL_DIRECTOR'])
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp    = req.nextUrl.searchParams
  const page  = parseInt(sp.get('page') || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '50'), 200)

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ])

  return NextResponse.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}
