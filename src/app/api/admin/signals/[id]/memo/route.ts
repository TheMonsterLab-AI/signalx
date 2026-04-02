import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// POST /api/admin/signals/[id]/memo — 내부 메모 추가
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: '메모 내용을 입력해주세요' }, { status: 400 })

  const signal = await prisma.signal.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const log = await prisma.auditLog.create({
    data: {
      userId:     admin.id,
      action:     'INTERNAL_MEMO',
      entityType: 'Signal',
      entityId:   params.id,
      details:    { text: text.trim(), authorName: admin.name, authorRole: admin.role },
    },
    include: { user: { select: { name: true, role: true } } },
  })

  return NextResponse.json({ success: true, memo: log })
}

// GET /api/admin/signals/[id]/memo — 내부 메모 목록
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memos = await prisma.auditLog.findMany({
    where:   { action: 'INTERNAL_MEMO', entityType: 'Signal', entityId: params.id },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { timestamp: 'asc' },
  })

  return NextResponse.json({ memos })
}
