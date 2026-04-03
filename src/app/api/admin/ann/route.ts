import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/ann — list verifications with status
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp    = req.nextUrl.searchParams
  const page  = parseInt(sp.get('page') || '1')
  const limit = Math.min(parseInt(sp.get('limit') || '20'), 100)

  const filter: any = {}
  const grade = sp.get('grade')
  if (grade) filter.finalGrade = grade

  const [verifications, total] = await Promise.all([
    prisma.annVerification.findMany({
      where: filter,
      include: {
        signal: {
          select: {
            id: true, trackingToken: true, title: true, displayTitle: true,
            category: true, country: true, stage: true, status: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.annVerification.count({ where: filter }),
  ])

  const { decryptFromString } = await import('@/lib/crypto')

  const items = verifications.map((v: any) => {
    let title = v.signal.displayTitle || ''
    if (!title) {
      try { title = decryptFromString(v.signal.title) } catch {}
    }
    if (!title || title === '[VAULT_TRANSFERRED]') title = `#${v.signal.trackingToken.slice(-8)}`
    return {
      ...v,
      signal: { ...v.signal, title },
    }
  })

  return NextResponse.json({ verifications: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}
