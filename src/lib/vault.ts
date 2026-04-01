/**
 * SignalX — Secure Vault Service
 *
 * 정책:
 *   외부 제보 접수 후 5초 이내 내부 Secure Vault 로 이동
 *   이동 완료 후 외부 DB 원본 삭제
 *   무결성 검증 (이동 전후 해시 비교)
 *   모든 이동 이력 VaultTransfer 테이블에 영구 기록
 */

import crypto from 'crypto'
import { prisma } from './prisma'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

// ─── Vault Transfer Pipeline ──────────────────────────────────────────────────

export async function initiateVaultTransfer(signalId: string): Promise<void> {
  const receivedAt = new Date()

  // 1. 원본 데이터 조회
  const signal = await prisma.signal.findUniqueOrThrow({
    where: { id: signalId },
    include: { attachments: true },
  })

  // 2. 이동 전 무결성 해시 계산
  const contentHashBefore = computeSignalHash(signal)

  // 3. VaultTransfer 레코드 생성
  const transfer = await prisma.vaultTransfer.create({
    data: {
      signalId,
      receivedAt,
      status:            'TRANSFERRING',
      contentHashBefore,
    },
  })

  try {
    // 4. Vault 이동 실행
    await executeVaultTransfer(signal, transfer.id)

    const transferredAt = new Date()
    const latencyMs     = transferredAt.getTime() - receivedAt.getTime()

    // 5. 이동 후 해시 재검증
    const vaultContent      = await readFromVault(signalId)
    const contentHashAfter  = vaultContent ? computeRawHash(vaultContent) : null
    const integrityVerified = contentHashAfter === contentHashBefore

    // 6. 외부 DB 원본 삭제 (민감 필드만 — 토큰/메타데이터는 트래킹용으로 유지)
    await scrubExternalRecord(signalId)
    const externalDeletedAt = new Date()

    // 7. 완료 기록
    await prisma.vaultTransfer.update({
      where: { id: transfer.id },
      data: {
        status:             integrityVerified ? 'VERIFIED' : 'TRANSFERRED',
        transferredAt,
        externalDeletedAt,
        contentHashAfter:   contentHashAfter ?? undefined,
        integrityVerified,
        latencyMs,
      },
    })

    // 5초 초과 경보
    if (latencyMs > 5000) {
      console.warn(`[VAULT] ⚠️  Transfer exceeded 5s SLA: ${latencyMs}ms for signal ${signalId}`)
    } else {
      console.log(`[VAULT] ✅ Transfer complete in ${latencyMs}ms (signal: ${signalId})`)
    }

  } catch (err: any) {
    await prisma.vaultTransfer.update({
      where:  { id: transfer.id },
      data: {
        status:      'FAILED',
        errorMsg:    err.message?.slice(0, 500),
        retryCount:  { increment: 1 },
      },
    })
    console.error(`[VAULT] ❌ Transfer failed for signal ${signalId}:`, err.message)
    throw err
  }
}

// ─── Internal Vault Storage ─────────────────────────────────────────────────────
// Production: air-gapped DB, HSM, or separate PostgreSQL instance
// Dev: encrypted files in /tmp/signalx-vault/

async function executeVaultTransfer(signal: any, transferId: string): Promise<void> {
  const vaultPayload = {
    transferId,
    signalId:    signal.id,
    token:       signal.trackingToken,
    category:    signal.category,
    country:     signal.country,
    title:       signal.title,    // already AES-256 encrypted
    content:     signal.content,  // already AES-256 encrypted
    stage:       signal.stage,
    submittedAt: signal.submittedAt.toISOString(),
    attachments: signal.attachments.map((a: any) => ({
      storagePath:  a.storagePath,  // encrypted
      mimeType:     a.mimeType,
      exifStripped: a.exifStripped,
    })),
    vaultedAt: new Date().toISOString(),
  }

  const vaultJson = JSON.stringify(vaultPayload)

  if (process.env.NODE_ENV === 'production' && process.env.VAULT_DB_URL) {
    // Production: write to separate secure DB
    // await vaultPrisma.vaultRecord.create({ data: { ... } })
  } else {
    // Dev: write to local encrypted file
    const { writeVaultFile } = await import('./vault-storage')
    await writeVaultFile(signal.id, vaultJson)
  }
}

async function readFromVault(signalId: string): Promise<string | null> {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.VAULT_DB_URL) {
      // Production: read from vault DB
      return null // TODO
    } else {
      const { readVaultFile } = await import('./vault-storage')
      return await readVaultFile(signalId)
    }
  } catch {
    return null
  }
}

// ─── External Record Scrub ─────────────────────────────────────────────────────

async function scrubExternalRecord(signalId: string): Promise<void> {
  // 민감 필드 삭제 — 토큰과 메타데이터(날짜·카테고리·국가)는 트래킹용으로 유지
  await prisma.signal.update({
    where: { id: signalId },
    data: {
      title:   '[VAULT_TRANSFERRED]',  // 원본 암호화 내용 삭제
      content: '[VAULT_TRANSFERRED]',
    },
  })

  // 첨부 파일 스토리지 경로도 삭제
  await prisma.attachment.updateMany({
    where: { signalId },
    data: { storagePath: '[VAULT_TRANSFERRED]' },
  })
}

// ─── Hash Utilities ───────────────────────────────────────────────────────────

function computeSignalHash(signal: any): string {
  const data = `${signal.id}:${signal.title}:${signal.content}:${signal.submittedAt.toISOString()}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

function computeRawHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

// ─── Vault Stats (for monitor dashboard) ─────────────────────────────────────

export async function getVaultStats() {
  const [total, verified, failed, pending, recent] = await Promise.all([
    prisma.vaultTransfer.count(),
    prisma.vaultTransfer.count({ where: { status: 'VERIFIED' } }),
    prisma.vaultTransfer.count({ where: { status: 'FAILED' } }),
    prisma.vaultTransfer.count({ where: { status: { in: ['PENDING', 'TRANSFERRING'] } } }),
    prisma.vaultTransfer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id:               true,
        signalId:         true,
        status:           true,
        latencyMs:        true,
        integrityVerified: true,
        receivedAt:       true,
        transferredAt:    true,
      },
    }),
  ])

  const avgLatency = await prisma.vaultTransfer.aggregate({
    _avg: { latencyMs: true },
    where: { status: { in: ['TRANSFERRED', 'VERIFIED'] } },
  })

  // SLA compliance: % transfers under 5000ms
  const underSla = await prisma.vaultTransfer.count({
    where: {
      status:   { in: ['TRANSFERRED', 'VERIFIED'] },
      latencyMs: { lte: 5000 },
    },
  })

  const slaCompliance = total > 0 ? Math.round((underSla / (total - pending)) * 1000) / 10 : 100

  return {
    total,
    verified,
    failed,
    pending,
    slaCompliance,
    avgLatencyMs: Math.round(avgLatency._avg.latencyMs ?? 0),
    recent,
  }
}
