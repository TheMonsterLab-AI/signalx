/**
 * SignalX — Distribution Engine
 *
 * 정책:
 *   자동 발송 절대 금지.
 *   1단계: prepareDistribution  — 후보 기자 추천 + PENDING 레코드 생성
 *   2단계: confirmDistribution  — 데스크 최종 승인 후에만 실제 발송
 *   모든 발송은 감사 로그 기록.
 */

import { prisma } from './prisma'

// ─── Step 1: 기자 자동 추천 + PENDING 레코드 생성 (발송 안 함) ──────────────

export async function prepareDistribution(
  signalId:    string,
  adminId:     string,
  overrideReporterIds?: string[] // 수동 선택 시
): Promise<{
  suggested:   any[]
  draftCount:  number
}> {
  const signal = await prisma.signal.findUniqueOrThrow({
    where:   { id: signalId },
    include: { annVerification: true },
  })

  if (!signal.annVerification?.finalGrade) {
    throw new Error('ANN 검증이 완료되지 않았습니다')
  }

  // 자동 추천: 분야·국가 일치 기자
  const suggested = overrideReporterIds?.length
    ? await prisma.reporter.findMany({
        where: { id: { in: overrideReporterIds }, active: true },
      })
    : await prisma.reporter.findMany({
        where: {
          active: true,
          preferredCategories: { has: signal.category as string },
          // 국가 일치 OR 글로벌 기자
          OR: [
            { country: signal.country },
            { country: '글로벌' },
          ],
        },
        orderBy: { responseRate: 'desc' },
        take: 20,
      })

  if (suggested.length === 0) return { suggested: [], draftCount: 0 }

  // PENDING 드래프트 레코드 생성 (발송 없음)
  // 기존 PENDING 레코드 정리 후 재생성
  await prisma.distribution.deleteMany({
    where: { signalId, status: 'PENDING' },
  })

  await Promise.all(
    suggested.map((r: any) =>
      prisma.distribution.create({
        data: {
          signalId,
          ...(r.mediaPartnerId ? { partnerId: r.mediaPartnerId } : {}),
          reporterId: r.id,
          status:     'PENDING',
        },
      })
    )
  )

  // 스테이지 → 배포 준비 중
  await prisma.signal.update({
    where: { id: signalId },
    data: {
      stage: 'DISTRIBUTION_IN_PROGRESS',
      stageHistory: {
        create: {
          stage:     'DISTRIBUTION_IN_PROGRESS',
          note:      `배포 준비: ${suggested.length}명 기자 추천됨. 데스크 승인 대기.`,
          actorType: 'ADMIN',
          actorId:   adminId,
        },
      },
    },
  })

  return { suggested, draftCount: suggested.length }
}

// ─── Step 2: 데스크 최종 승인 → 실제 발송 ────────────────────────────────────

export async function confirmDistribution(
  signalId:       string,
  adminId:        string,
  distributionIds: string[], // 승인된 배포 대상 ID 목록
  deskNote?:      string     // 데스크 메모 (감사 기록용)
): Promise<{ sent: number; failed: number }> {
  const signal = await prisma.signal.findUniqueOrThrow({
    where: { id: signalId },
    include: {
      annVerification: true,
    },
  })

  // 승인된 배포 대상만 조회
  const distributions = await prisma.distribution.findMany({
    where: {
      id:       { in: distributionIds },
      signalId,
      status:   'PENDING',
    },
    include: {
      reporter: true,
    },
  })

  if (distributions.length === 0) {
    throw new Error('승인할 배포 대상이 없습니다')
  }

  // 감사 로그 — 데스크 승인 기록 (불변)
  await prisma.auditLog.create({
    data: {
      userId:     adminId,
      action:     'DISTRIBUTION_DESK_APPROVED',
      entityType: 'Signal',
      entityId:   signalId,
      details: {
        approvedCount: distributions.length,
        deskNote,
        approvedAt: new Date().toISOString(),
        distributionIds,
      },
    },
  })

  // 실제 발송
  const results = await Promise.allSettled(
    distributions.map((d: any) => executeDelivery(d, signal))
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  // 완료 처리
  if (sent > 0) {
    await prisma.signal.update({
      where: { id: signalId },
      data: {
        distributed:   sent > 0,
        distributedAt: new Date(),
        ...(failed === 0 ? { stage: 'DISTRIBUTION_COMPLETE' } : {}),
        stageHistory: {
          create: {
            stage:     'DISTRIBUTION_COMPLETE',
            note:      `데스크 승인 발송 완료: ${sent}건 성공, ${failed}건 실패. 담당: ${adminId}`,
            actorType: 'ADMIN',
            actorId:   adminId,
          },
        },
      },
    })
  }

  return { sent, failed }
}

// ─── 실제 발송 실행 ───────────────────────────────────────────────────────────

async function executeDelivery(distribution: any, signal: any): Promise<void> {
  const reporter = distribution.reporter

  if (!reporter?.email) {
    await prisma.distribution.update({
      where: { id: distribution.id },
      data:  { status: 'FAILED', errorMsg: '기자 이메일 미등록' },
    })
    throw new Error('이메일 미등록')
  }

  try {
    const { sendEmail } = await import('./email')

    await sendEmail({
      to:          reporter.email,
      subject:     `[SignalX] ${signal.category} 시그널 — ANN 검증 완료 리포트`,
      text:        buildEmailText(signal, reporter),
      html:        buildEmailHtml(signal, reporter),
      emailType:   'PARTNER_DELIVERY',
      signalToken: signal.trackingToken,
    })

    await prisma.distribution.update({
      where: { id: distribution.id },
      data:  { status: 'DELIVERED', sentAt: new Date(), deliveredAt: new Date() },
    })

    // 기자 통계 업데이트
    await prisma.reporter.update({
      where: { id: reporter.id },
      data: {
        totalDeliveries: { increment: 1 },
        lastDeliveredAt: new Date(),
      },
    })

  } catch (err: any) {
    await prisma.distribution.update({
      where: { id: distribution.id },
      data:  { status: 'FAILED', errorMsg: err.message?.slice(0, 255) },
    })
    throw err
  }
}

// ─── 이메일 템플릿 ────────────────────────────────────────────────────────────

function buildEmailText(signal: any, reporter: any): string {
  const score = signal.annVerification?.finalScore?.toFixed(0) ?? '—'
  const grade = signal.annVerification?.finalGrade ?? '—'
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/report/${signal.trackingToken}`

  return `
SignalX — ANN 검증 완료 시그널

${reporter.name} 기자님,

SignalX에서 귀 기자님의 담당 분야 관련 검증 완료 시그널을 공유드립니다.

■ 분류: ${signal.category} · ${signal.country}
■ ANN 신뢰도: ${score}/100 (${grade})
■ 리포트: ${reportUrl}

본 시그널은 ANN 7단계 AI 팩트체크 엔진을 통해 검증되었습니다.
추가 문의사항은 report@signalx.global 로 연락 주세요.

SignalX 운영팀
  `.trim()
}

function buildEmailHtml(signal: any, reporter: any): string {
  const score     = signal.annVerification?.finalScore?.toFixed(0) ?? '—'
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/report/${signal.trackingToken}`

  return `
<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="font-family:Inter,sans-serif;background:#f3fbf5;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="background:#006c4d;border-radius:16px;padding:28px;margin-bottom:20px;text-align:center">
    <div style="font-size:22px;font-weight:900;color:#fff">SignalX</div>
    <div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px">ANN 검증 완료 시그널</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #d4ede3">
    <p style="color:#3d4943;font-size:14px;margin:0 0 16px">
      <strong>${reporter.name}</strong> 기자님,<br>
      담당 분야 관련 ANN 검증 완료 시그널을 공유드립니다.
    </p>
    <div style="background:#f3fbf5;border-radius:10px;padding:16px;margin-bottom:20px">
      <div style="font-size:12px;color:#3d4943;line-height:1.8">
        <div><strong>분류</strong> — ${signal.category} · ${signal.country}</div>
        <div><strong>ANN 신뢰도</strong> — ${score}/100</div>
      </div>
    </div>
    <a href="${reportUrl}" style="display:block;background:#006c4d;color:#fff;text-align:center;padding:14px;border-radius:100px;font-weight:700;font-size:14px;text-decoration:none">
      ANN 리포트 전문 보기 →
    </a>
  </div>
  <div style="padding:16px;text-align:center;font-size:10px;color:#6d7a72">
    본 메일은 SignalX 데스크 승인 후 발송되었습니다 · report@signalx.global
  </div>
</div>
</body></html>
  `.trim()
}
