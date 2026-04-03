/**
 * POST /api/submit
 * 
 * Anonymous signal submission endpoint.
 * - No IP logging
 * - No personal data stored
 * - Returns tracking token only
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTrackingToken, getAnonymizedIP, encryptToString, hashSessionToken } from '@/lib/crypto'
import { handleFileUpload } from '@/lib/files'
import { validateSubmission } from '@/lib/validation'
import { queueAnnProcessing } from '@/lib/ann-queue'
import type { SubmitSignalRequest, SubmitSignalResponse } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30 // 30s for file uploads

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse multipart form data ────────────────────────────────────────
    const formData = await req.formData()
    
    const body: SubmitSignalRequest = {
      category: formData.get('category') as any,
      country:  formData.get('country') as string,
      title:    formData.get('title') as string,
      content:  formData.get('content') as string,
    }
    
    const files = formData.getAll('files') as File[]
    
    // ── 2. Validate ─────────────────────────────────────────────────────────
    const validation = validateSubmission(body)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }
    
    // ── 3. Generate tracking token ───────────────────────────────────────────
    // Ensure uniqueness (collision probability ~1 in 33^7 ≈ 42 billion)
    let trackingToken: string
    let attempts = 0
    do {
      trackingToken = generateTrackingToken()
      attempts++
      if (attempts > 10) throw new Error('Token generation failed')
    } while (await prisma.signal.findUnique({ where: { trackingToken } }))
    
    // ── 4. Encrypt sensitive content ────────────────────────────────────────
    // Content is encrypted at rest — even DB admins cannot read it
    const encryptedTitle   = encryptToString(body.title)
    const encryptedContent = encryptToString(body.content)
    
    // ── 5. Create signal record ──────────────────────────────────────────────
    // SecureDrop 원칙: DB에는 토큰 해시만 저장, 원문은 제보자에게만 표시
    const tokenHash = hashSessionToken(trackingToken)
    const signal = await prisma.signal.create({
      data: {
        trackingToken: tokenHash,
        category: body.category,
        country:  body.country.trim(),
        title:    encryptedTitle,
        content:  encryptedContent,
        stage:    'SUBMITTED',
        status:   'PENDING',
        stageHistory: {
          create: {
            stage:     'SUBMITTED',
            note:      '제보가 안전하게 접수되었습니다.',
            actorType: 'SYSTEM',
          }
        }
      }
    })
    
    // ── 6. Handle file attachments ───────────────────────────────────────────
    if (files.length > 0) {
      await handleFileUpload(signal.id, files)
    }
    
    // ── 7. ANN 먼저 → Vault (ANN이 원본 내용을 읽어야 함) ──────────────────
    setImmediate(async () => {
      try {
        // 7a. ANN 검증 큐 먼저 — 원본 암호화 내용으로 검증해야 함
        await queueAnnProcessing(signal.id)
      } catch (e) {
        console.error('[ANN_QUEUE] Error:', e)
      }
      // 참고: Vault 이동은 ann-queue.ts 내부에서 ANN 완료 후 실행됨
    })

    // ── 8. 자동 리턴 메일 발송 (이메일 제공 시) ──────────────────────────────
    // 이메일 필드는 선택 — 미입력 시 완전 익명 유지
    const notifyEmail = formData.get('notifyEmail') as string | null
    if (notifyEmail && notifyEmail.includes('@')) {
      setImmediate(async () => {
        try {
          const { sendSubmissionReceipt } = await import('@/lib/email')
          const cat = body.category.toLowerCase()
          await sendSubmissionReceipt(notifyEmail, trackingToken, cat)
        } catch (e) {
          console.error('[EMAIL] Receipt send error:', e)
        }
      })
    }

    // ── 9. Return token ──────────────────────────────────────────────────────
    const response: SubmitSignalResponse = {
      success:       true,
      trackingToken,
      submittedAt:   signal.submittedAt.toISOString(),
      message:       '제보가 안전하게 접수되었습니다. 추적 토큰을 보관하세요.',
    }
    
    // Security headers
    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Cache-Control':              'no-store',
        'X-Content-Type-Options':     'nosniff',
        'X-Frame-Options':            'DENY',
        'Strict-Transport-Security':  'max-age=31536000; includeSubDomains',
      }
    })
    
  } catch (error) {
    console.error('[SUBMIT] Error:', error)
    
    // Never expose internal errors to users
    return NextResponse.json(
      { success: false, error: '제보 처리 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.' },
      { status: 500 }
    )
  }
}

// Rate limiting is applied at the middleware level (see /middleware.ts)
// GET not allowed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
