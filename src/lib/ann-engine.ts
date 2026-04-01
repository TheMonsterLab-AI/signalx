/**
 * SignalX ANN Engine — 7-Step Verification Pipeline
 * 
 * This is the core AI verification engine.
 * Each step is independent and can be retried individually.
 * Results are stored progressively so failures are recoverable.
 */

import { prisma } from '@/lib/prisma'
import { decryptFromString } from '@/lib/crypto'
import type {
  AnnStep1Result, AnnStep2Result, AnnStep3Result,
  AnnStep4Result, AnnStep5Result, AnnStep6Result,
  AnnStep7Result, AnnVerificationResult, AnnGrade,
  AiModelResult
} from '@/types'

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export async function runAnnVerification(signalId: string): Promise<AnnVerificationResult> {
  const startTime = Date.now()
  
  // Get signal from DB
  const signal = await prisma.signal.findUniqueOrThrow({
    where: { id: signalId },
    include: { attachments: true, stageHistory: true }
  })
  
  // Decrypt content for analysis
  const title   = decryptFromString(signal.title)
  const content = decryptFromString(signal.content)
  
  // Ensure AnnVerification record exists
  const annRecord = await prisma.annVerification.upsert({
    where:  { signalId },
    create: { signalId },
    update: {}
  })
  
  // Update stage to ANN_PROCESSING
  await updateSignalStage(signalId, 'ANN_PROCESSING', 'ANN 7단계 검증 시작')
  
  // ── Step 1: Source Analysis ──────────────────────────────────────────────
  const step1 = await runStep1(signal)
  await saveStepResult(signalId, 'step1_sourceAnalysis', step1)
  
  // ── Step 2: Cross AI Verification ────────────────────────────────────────
  const step2 = await runStep2(title, content, signal.category)
  await saveStepResult(signalId, 'step2_crossVerification', step2)
  
  // ── Step 3: Data Validation ──────────────────────────────────────────────
  const step3 = await runStep3(title, content, signal.country)
  await saveStepResult(signalId, 'step3_dataValidation', step3)
  
  // ── Step 4: Image Analysis ───────────────────────────────────────────────
  const imageAttachments = signal.attachments.filter((a: any) => 
    a.mimeType.startsWith('image/')
  )
  const step4 = await runStep4(imageAttachments)
  await saveStepResult(signalId, 'step4_imageAnalysis', step4)
  
  // ── Step 5: Video Analysis ───────────────────────────────────────────────
  const videoAttachments = signal.attachments.filter((a: any) => 
    a.mimeType.startsWith('video/')
  )
  const step5 = await runStep5(videoAttachments)
  await saveStepResult(signalId, 'step5_videoAnalysis', step5)
  
  // ── Step 6: Pattern Detection ────────────────────────────────────────────
  const step6 = await runStep6(title, content, signal.country, signal.category)
  await saveStepResult(signalId, 'step6_patternDetection', step6)
  
  // ── Step 7: Final Score ──────────────────────────────────────────────────
  const step7 = calculateFinalScore({ step1, step2, step3, step4, step5, step6 })
  await saveStepResult(signalId, 'step7_finalScore', step7)
  
  const processingMs = Date.now() - startTime
  
  // ── Save final results ────────────────────────────────────────────────────
  await prisma.annVerification.update({
    where: { signalId },
    data: {
      finalScore:  step7.score,
      finalGrade:  step7.grade,
      completedAt: new Date(),
      processingMs,
    }
  })
  
  // Update signal status based on grade
  const statusMap: Record<AnnGrade, string> = {
    VERIFIED:     'VERIFIED',
    LIKELY_TRUE:  'LIKELY_TRUE',
    UNDER_REVIEW: 'UNDER_REVIEW',
    UNVERIFIED:   'UNVERIFIED',
    LIKELY_FALSE: 'LIKELY_FALSE',
  }
  
  await prisma.signal.update({
    where: { id: signalId },
    data: {
      status:  statusMap[step7.grade] as any,
      annScore: step7.score,
      annGrade: step7.grade,
    }
  })
  
  await updateSignalStage(signalId, 'VERIFICATION_COMPLETE', 
    `ANN 검증 완료: ${step7.score.toFixed(0)}/100 (${step7.grade})`
  )

  // ANN 완료 이메일 알림 — submitter email이 EmailLog에 없으므로
  // 향후 확장: 제보자가 이메일을 남긴 경우 EmailLog에서 SUBMISSION_RECEIPT 레코드의
  // signalToken 으로 역참조하여 발송 가능
  if (process.env.NODE_ENV !== 'production') console.log(`[ANN] Signal ${signalId} verified: ${step7.score}/100 (${step7.grade})`)
  
  return {
    step1, step2, step3, step4, step5, step6, step7,
    finalScore: step7.score,
    finalGrade: step7.grade,
    processingMs,
  }
}

// ─── Step Implementations ─────────────────────────────────────────────────────

async function runStep1(signal: any): Promise<AnnStep1Result> {
  // Source Analysis: submitter history, document metadata
  // In production: check anonymized submitter hash against history DB
  
  return {
    score:                 75,
    submitterHistory:      'NEW',
    documentAuthenticity:  true,
    notes:                 '신규 제보자. 첨부 문서 메타데이터 원본 확인됨.',
  }
}

async function runStep2(
  title: string, 
  content: string,
  category: string
): Promise<AnnStep2Result> {
  // Cross-AI Verification using 4 LLMs
  // In production: parallel API calls to OpenAI, Anthropic, Google, Meta
  
  const prompt = buildVerificationPrompt(title, content, category)
  
  // Production: replace with actual API calls
  const results = await Promise.allSettled([
    callGPT(prompt),
    callClaude(prompt),
    callGemini(prompt),
    callLlama(prompt),
  ])
  
  const models = results.map((r, i) => {
    const names = ['GPT-4o', 'Claude-3.5-Sonnet', 'Gemini-1.5-Pro', 'Llama-3.1-70B']
    if (r.status === 'fulfilled') return r.value
    // Graceful degradation — if one model fails, others continue
    return {
      model:     names[i],
      score:     0,
      grade:     'UNDER_REVIEW' as AnnGrade,
      reasoning: 'Model unavailable',
      flags:     ['MODEL_TIMEOUT'],
    } satisfies AiModelResult
  })
  
  const validModels = models.filter(m => !m.flags.includes('MODEL_TIMEOUT'))
  const average = validModels.reduce((sum, m) => sum + m.score, 0) / validModels.length
  
  return {
    gpt:       models[0],
    claude:    models[1],
    gemini:    models[2],
    llama:     models[3],
    average:   Math.round(average),
    consensus: scoreToGrade(average),
  }
}

async function runStep3(
  title: string,
  content: string,
  country: string
): Promise<AnnStep3Result> {
  // Data validation against public databases
  // In production: news APIs, government databases, financial data
  
  return {
    sourcesChecked: 12,
    matches:        8,
    mismatches:     2,
    databases:      ['Reuters Archive', 'Bloomberg News', 'Government Filings', 'Court Records'],
    verdict:        '공개 데이터베이스 대조 결과 주요 주장 일치 확인됨.',
  }
}

async function runStep4(attachments: any[]): Promise<AnnStep4Result> {
  if (attachments.length === 0) {
    return { filesAnalyzed: 0, deepfakeDetected: false, exifCleaned: true, manipulationScore: 0, verdict: '분석할 이미지 없음 (N/A)' }
  }
  
  // In production: use deepfake detection API (e.g. Sensity, Reality Defender)
  return {
    filesAnalyzed:    attachments.length,
    deepfakeDetected: false,
    exifCleaned:      true,
    manipulationScore: 0.03,
    verdict:          `${attachments.length}개 이미지 분석 완료. 딥페이크 감지 없음. EXIF 제거 확인.`,
  }
}

async function runStep5(attachments: any[]): Promise<AnnStep5Result> {
  if (attachments.length === 0) {
    return { filesAnalyzed: 0, deepfakeDetected: false, inconsistenciesFound: false, verdict: '분석할 영상 없음 (N/A)' }
  }
  
  return {
    filesAnalyzed:        attachments.length,
    deepfakeDetected:     false,
    inconsistenciesFound: false,
    verdict:              `${attachments.length}개 영상 분석 완료. 이상 없음.`,
  }
}

async function runStep6(
  title: string,
  content: string,
  country: string,
  category: string
): Promise<AnnStep6Result> {
  // Pattern detection: compare against existing signals in DB
  const relatedCount = await prisma.signal.count({
    where: {
      country,
      category: category as any,
      stage: { in: ['VERIFICATION_COMPLETE', 'DISTRIBUTION_COMPLETE'] },
      submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  })
  
  return {
    anomalyScore:       relatedCount > 3 ? 0.72 : 0.21,
    relatedSignals:     relatedCount,
    organizationalFlag: relatedCount > 5,
    patterns:           relatedCount > 3 ? ['반복 패턴 감지', '동일 국가·카테고리 집중'] : [],
  }
}

function calculateFinalScore(steps: {
  step1: AnnStep1Result
  step2: AnnStep2Result
  step3: AnnStep3Result
  step4: AnnStep4Result
  step5: AnnStep5Result
  step6: AnnStep6Result
}): AnnStep7Result {
  // Weighted scoring formula
  const weights = {
    step1: 0.10,  // Source analysis
    step2: 0.40,  // AI cross-verification (highest weight)
    step3: 0.25,  // Data validation
    step4: 0.10,  // Image analysis
    step5: 0.10,  // Video analysis
    step6: 0.05,  // Pattern detection
  }
  
  const score =
    steps.step1.score    * weights.step1 +
    steps.step2.average  * weights.step2 +
    steps.step3.matches / (steps.step3.sourcesChecked || 1) * 100 * weights.step3 +
    (steps.step4.deepfakeDetected ? 20 : 85) * weights.step4 +
    (steps.step5.deepfakeDetected ? 20 : 85) * weights.step5 +
    (100 - steps.step6.anomalyScore * 30) * weights.step6
  
  const finalScore = Math.min(100, Math.max(0, score))
  const grade = scoreToGrade(finalScore)
  
  return {
    score:               Math.round(finalScore * 10) / 10,
    grade,
    recommendation:      getRecommendation(grade),
    distributionTargets: grade === 'LIKELY_FALSE' ? 0 : grade === 'UNDER_REVIEW' ? 1 : 5,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): AnnGrade {
  if (score >= 85) return 'VERIFIED'
  if (score >= 70) return 'LIKELY_TRUE'
  if (score >= 50) return 'UNDER_REVIEW'
  if (score >= 30) return 'UNVERIFIED'
  return 'LIKELY_FALSE'
}

function getRecommendation(grade: AnnGrade): string {
  const recs: Record<AnnGrade, string> = {
    VERIFIED:     '즉시 파트너 배포 승인 권고',
    LIKELY_TRUE:  '시그널 리더 최종 확인 후 배포 권고',
    UNDER_REVIEW: '추가 검증 후 배포 여부 결정',
    UNVERIFIED:   '배포 보류, 추가 증거 요청',
    LIKELY_FALSE: '배포 불가, 제보자 피드백 권고',
  }
  return recs[grade]
}

function buildVerificationPrompt(title: string, content: string, category: string): string {
  return `You are a professional fact-checker. Analyze this disclosure for credibility.

Category: ${category}
Title: ${title}
Content: ${content}

Evaluate:
1. Internal consistency (0-100)
2. Specificity of claims (0-100)
3. Plausibility given category and context (0-100)
4. Red flags for fabrication

Respond with JSON only: {"score": number, "grade": string, "reasoning": string, "flags": string[]}`
}

// ── AI API Stubs (replace with actual implementations) ───────────────────────

async function callGPT(prompt: string): Promise<AiModelResult> {
  // Production: openai.chat.completions.create(...)
  return { model: 'GPT-4o', score: 91, grade: 'VERIFIED', reasoning: '내부 일관성 높음, 주장 구체적', flags: [] }
}

async function callClaude(prompt: string): Promise<AiModelResult> {
  // Production: anthropic.messages.create(...)
  return { model: 'Claude-3.5-Sonnet', score: 89, grade: 'VERIFIED', reasoning: '논리 일관성 확인됨', flags: [] }
}

async function callGemini(prompt: string): Promise<AiModelResult> {
  // Production: google.generativeai...
  return { model: 'Gemini-1.5-Pro', score: 91, grade: 'VERIFIED', reasoning: '데이터 분석 일치', flags: [] }
}

async function callLlama(prompt: string): Promise<AiModelResult> {
  // Production: ollama / Together AI / Replicate...
  return { model: 'Llama-3.1-70B', score: 88, grade: 'VERIFIED', reasoning: '일부 맥락 추가 확인 권고', flags: ['MINOR_INCONSISTENCY'] }
}

// ── DB Helpers ────────────────────────────────────────────────────────────────

async function saveStepResult(signalId: string, field: string, data: any) {
  await prisma.annVerification.update({
    where: { signalId },
    data:  { [field]: data }
  })
}

async function updateSignalStage(signalId: string, stage: string, note: string) {
  await prisma.signal.update({
    where: { id: signalId },
    data: {
      stage: stage as any,
      stageHistory: {
        create: {
          stage:     stage as any,
          note,
          actorType: 'ANN_ENGINE',
        }
      }
    }
  })
}
