/**
 * SignalX — Email Service
 *
 * 정책:
 *   수신: report@signalx.global (단일 주소)
 *   발신: 자동화 시스템 → 다수 수신자
 *   모든 발송은 EmailLog 에 HMAC 해시로 기록 (원본 이메일 주소 저장 안 함)
 */

import crypto from 'crypto'
import { prisma } from './prisma'

const HMAC_SECRET  = process.env.HMAC_SECRET!
const FROM_ADDRESS = 'SignalX <noreply@signalx.global>'
const RECEIVE_ADDRESS = 'report@signalx.global'

// ─── Hash helpers ─────────────────────────────────────────────────────────────

function hmacHash(value: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(value.toLowerCase().trim())
    .digest('hex')
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function buildSubmissionReceiptEmail(token: string, category: string, lang: 'ko' | 'en' = 'ko') {
  if (lang === 'ko') {
    return {
      subject: `[SignalX] 제보가 안전하게 접수되었습니다 — ${token}`,
      text: `
SignalX 익명 제보 확인

귀하의 제보가 정상적으로 접수되었습니다.

■ 추적 토큰 (보관 필수): ${token}
■ 카테고리: ${category}
■ 접수 시각: ${new Date().toISOString()}

이 토큰으로 언제든지 진행 상황을 확인할 수 있습니다:
https://signalx.global/track?token=${token}

■ 다음 단계
1. 국가 시그널 리더 검토 (24시간 이내)
2. ANN AI 7단계 팩트체크 검증
3. 검증 완료 시 파트너 미디어/기관 자동 배포

■ 법적 고지
SignalX는 중개자 역할만 수행합니다 (Section 230, EU DSA, 정보통신망법).
귀하의 신원은 완전히 보호됩니다 (AES-256 암호화 · IP 미기록 · EXIF 제거).

문의: ${RECEIVE_ADDRESS}
      `.trim(),
      html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Inter',system-ui,sans-serif;background:#f3fbf5;color:#161d1a">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="background:#006c4d;border-radius:16px;padding:32px;margin-bottom:24px;text-align:center">
    <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.02em">SignalX</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;text-transform:uppercase;letter-spacing:0.1em">Secure Signal Intelligence</div>
  </div>
  <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #d4ede3;margin-bottom:16px">
    <div style="display:inline-flex;align-items:center;gap:8px;background:#eef6f0;padding:8px 16px;border-radius:100px;margin-bottom:24px">
      <span style="width:8px;height:8px;border-radius:50%;background:#3eb489;display:inline-block"></span>
      <span style="font-size:11px;font-weight:700;color:#006c4d;text-transform:uppercase;letter-spacing:0.1em">접수 완료</span>
    </div>
    <h1 style="font-size:22px;font-weight:800;color:#161d1a;margin:0 0 12px;line-height:1.3">
      제보가 안전하게<br/>접수되었습니다
    </h1>
    <p style="font-size:14px;color:#3d4943;line-height:1.7;margin:0 0 28px">
      귀하의 제보가 AES-256 암호화 처리되어 내부 보안 저장소로 안전하게 이동되었습니다.
    </p>
    <div style="background:#f3fbf5;border:2px solid #006c4d;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;color:#6d7a72;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">추적 토큰 (반드시 보관)</div>
      <div style="font-family:monospace;font-size:28px;font-weight:900;color:#006c4d;letter-spacing:0.15em">${token}</div>
    </div>
    <div style="background:#eef6f0;border-radius:10px;padding:16px;margin-bottom:24px">
      <div style="font-size:12px;color:#3d4943;line-height:1.8">
        <div style="margin-bottom:4px"><strong>카테고리</strong> — ${category}</div>
        <div style="margin-bottom:4px"><strong>접수 시각</strong> — ${new Date().toLocaleString('ko-KR')} KST</div>
        <div><strong>암호화</strong> — AES-256-GCM ✓</div>
      </div>
    </div>
    <a href="https://signalx.global/track?token=${token}"
       style="display:block;background:#006c4d;color:#fff;text-align:center;padding:14px;border-radius:100px;font-weight:700;font-size:14px;text-decoration:none">
      제보 현황 확인하기 →
    </a>
  </div>
  <div style="padding:16px;text-align:center">
    <div style="font-size:10px;color:#6d7a72;line-height:1.8">
      SignalX는 중개자 역할만 수행합니다 (Section 230 · EU DSA · 정보통신망법)<br/>
      귀하의 신원은 완전히 보호됩니다 · IP 미기록 · EXIF 제거<br/>
      문의: ${RECEIVE_ADDRESS}
    </div>
  </div>
</div>
</body>
</html>
      `.trim(),
    }
  }

  // English version
  return {
    subject: `[SignalX] Your report has been securely received — ${token}`,
    text: `Your report (token: ${token}) has been securely received and encrypted.
Track status at: https://signalx.global/track?token=${token}`,
    html: `<p>Token: <strong>${token}</strong></p>`,
  }
}

export function buildAnnReportEmail(token: string, score: number, grade: string) {
  return {
    subject: `[SignalX] ANN 팩트체크 완료 — 신뢰도 ${score}/100 · ${token}`,
    text: `ANN 7단계 검증이 완료되었습니다.\n\n추적 토큰: ${token}\n신뢰도 점수: ${score}/100\n등급: ${grade}\n\n리포트 확인: https://signalx.global/report/${token}`,
    html: `<p>ANN 검증 완료: <strong>${score}/100</strong> (${grade})</p><p><a href="https://signalx.global/report/${token}">리포트 보기</a></p>`,
  }
}

// ─── Core Send Function ────────────────────────────────────────────────────────

interface SendEmailOptions {
  to:           string      // 수신자 이메일
  subject:      string
  text:         string
  html:         string
  emailType:    string
  signalToken?: string
  adminId?:     string
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; msgId?: string; error?: string }> {
  const { to, subject, text, html, emailType, signalToken, adminId } = opts

  // Hash sensitive data before logging (never store raw email addresses)
  const recipientHash = hmacHash(to)
  const subjectHash   = sha256(subject)
  const contentHash   = sha256(text)

  // Create audit log entry BEFORE sending
  const logEntry = await prisma.emailLog.create({
    data: {
      direction:    'OUTBOUND',
      recipientHash,
      senderHash:   hmacHash(FROM_ADDRESS),
      emailType:    emailType as any,
      subjectHash,
      contentHash,
      signalToken:  signalToken ?? null,
      sentByAdminId: adminId ?? null,
      status:       'SENDING',
    },
  })

  try {
    let msgId: string

    if (process.env.EMAIL_PROVIDER === 'postmark') {
      msgId = await sendViaPostmark(to, subject, text, html)
    } else if (process.env.EMAIL_PROVIDER === 'ses') {
      msgId = await sendViaSES(to, subject, text, html)
    } else {
      // Development: log only
      if (process.env.NODE_ENV !== 'production') console.log(`[EMAIL DEV] To: ${to.slice(0, 3)}*** | Type: ${emailType} | Token: ${signalToken}`)
      msgId = `dev-${Date.now()}`
    }

    // Update log with success
    await prisma.emailLog.update({
      where: { id: logEntry.id },
      data: {
        status:         'DELIVERED',
        providerMsgId:  msgId,
        deliveredAt:    new Date(),
      },
    })

    return { success: true, msgId }

  } catch (err: any) {
    // Update log with failure
    await prisma.emailLog.update({
      where: { id: logEntry.id },
      data: {
        status:        'FAILED',
        failureReason: err.message?.slice(0, 500),
      },
    })
    console.error('[EMAIL] Send failed:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── Provider Implementations ──────────────────────────────────────────────────

async function sendViaPostmark(to: string, subject: string, text: string, html: string): Promise<string> {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept':               'application/json',
      'Content-Type':         'application/json',
      'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY!,
    },
    body: JSON.stringify({
      From:     FROM_ADDRESS,
      To:       to,
      Subject:  subject,
      TextBody: text,
      HtmlBody: html,
      TrackOpens: false,  // 프라이버시 — 트래킹 비활성
      TrackLinks: 'None',
    }),
  })
  if (!res.ok) throw new Error(`Postmark error: ${res.status}`)
  const data = await res.json()
  return data.MessageID
}

async function sendViaSES(to: string, subject: string, text: string, html: string): Promise<string> {
  // Production: use AWS SDK v3 @aws-sdk/client-ses
  // const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')
  throw new Error('AWS SES not configured — set EMAIL_PROVIDER=postmark or configure SES')
}

// ─── High-level send helpers ─────────────────────────────────────────────────

export async function sendSubmissionReceipt(
  recipientEmail: string,
  token: string,
  category: string,
  lang: 'ko' | 'en' = 'ko'
): Promise<void> {
  // If no email provided (fully anonymous), skip
  if (!recipientEmail || !recipientEmail.includes('@')) return

  const { subject, text, html } = buildSubmissionReceiptEmail(token, category, lang)

  await sendEmail({
    to:          recipientEmail,
    subject,
    text,
    html,
    emailType:   'SUBMISSION_RECEIPT',
    signalToken: token,
  })
}

export async function sendAnnReportNotification(
  recipientEmail: string,
  token: string,
  score: number,
  grade: string
): Promise<void> {
  if (!recipientEmail || !recipientEmail.includes('@')) return

  const { subject, text, html } = buildAnnReportEmail(token, score, grade)

  await sendEmail({
    to:          recipientEmail,
    subject,
    text,
    html,
    emailType:   'ANN_REPORT_READY',
    signalToken: token,
  })
}
