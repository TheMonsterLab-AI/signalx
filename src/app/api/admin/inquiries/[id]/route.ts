import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'
import { sendEmail } from '@/lib/email'

// PATCH — 상태 변경 또는 답변 발송
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, status, assignedToId, internalNote, replyContent, priority } = await req.json()
  const inquiry = await prisma.mediaInquiry.findUnique({
    where: { id: params.id },
    include: { reporter: true, signal: { select: { trackingToken: true } } },
  })
  if (!inquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 답변 발송
  if (action === 'REPLY' && replyContent && inquiry.reporter?.email) {
    await sendEmail({
      to:          inquiry.reporter.email,
      subject:     `RE: ${inquiry.subject}`,
      text:        replyContent,
      html:        `<p>${replyContent.replace(/\n/g, '<br>')}</p>`,
      emailType:   'SYSTEM_NOTICE',
      signalToken: inquiry.signal?.trackingToken,
      adminId:     admin.id,
    })

    await prisma.mediaInquiry.update({
      where: { id: params.id },
      data: {
        status:      'REPLIED',
        replyContent,
        repliedAt:   new Date(),
        repliedById: admin.id,
        ...(internalNote ? { internalNote } : {}),
      },
    })
    return NextResponse.json({ success: true, message: '답변이 발송되었습니다' })
  }

  // 상태/담당자/우선순위 변경
  await prisma.mediaInquiry.update({
    where: { id: params.id },
    data: {
      ...(status       ? { status:       status       as any } : {}),
      ...(assignedToId ? { assignedToId               } : {}),
      ...(internalNote ? { internalNote               } : {}),
      ...(priority     ? { priority:     priority     as any } : {}),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: admin.id, action: `INQUIRY_${action || 'UPDATED'}`,
      entityType: 'MediaInquiry', entityId: params.id,
      details: { status, assignedToId, priority },
    },
  })

  return NextResponse.json({ success: true })
}
