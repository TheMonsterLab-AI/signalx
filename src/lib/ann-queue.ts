/**
 * ANN Processing Queue
 * 
 * Production: use a proper job queue (BullMQ + Redis, or Trigger.dev)
 * Development: fire-and-forget async function
 */

import { runAnnVerification } from './ann-engine'
import { prepareDistribution } from './distribution'

export async function queueAnnProcessing(signalId: string): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.QUEUE_URL) {
    // Production: POST to job queue (BullMQ, Trigger.dev, etc.)
    await fetch(process.env.QUEUE_URL + '/ann', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.QUEUE_SECRET}` 
      },
      body: JSON.stringify({ signalId, priority: 'normal' })
    })
    return
  }
  
  // Development / serverless: run after response (fire-and-forget)
  setImmediate(async () => {
    // ANN 먼저 — 원본 내용으로 검증해야 함
    // Vault는 검증 완료 후 이동 (title 덮어쓰기 전에 ANN이 읽어야 함)
    try {
      const result = await runAnnVerification(signalId)
      if (['VERIFIED', 'LIKELY_TRUE'].includes(result.finalGrade)) {
        // 배포 준비만 수행 — 실제 발송은 데스크 승인 필요
        await prepareDistribution(signalId, 'system')
      }
    } catch (err) {
      console.error(`[ANN_QUEUE] Failed for signal ${signalId}:`, err)
    }
    try {
      // ANN 완료 후 Vault 격리
      const { initiateVaultTransfer } = await import('./vault')
      await initiateVaultTransfer(signalId)
    } catch (err) {
      console.error(`[VAULT] Failed for signal ${signalId}:`, err)
    }
  })
}

// ── ANN API Trigger (for manual/admin trigger) ────────────────────────────────
export async function triggerAnnReprocessing(signalId: string, adminId: string): Promise<void> {
  const { prisma } = await import('./prisma')
  
  // Reset verification record
  await prisma.annVerification.deleteMany({ where: { signalId } })
  
  await prisma.auditLog.create({
    data: {
      userId:     adminId,
      action:     'ANN_REPROCESS_TRIGGERED',
      entityType: 'Signal',
      entityId:   signalId,
    }
  })
  
  await queueAnnProcessing(signalId)
}
