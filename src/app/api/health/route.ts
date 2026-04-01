import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, string> = {}

  // DB 연결 확인
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // 암호화 키 확인
  checks.encryption = process.env.ENCRYPTION_KEY ? 'ok' : 'missing'
  checks.hmac       = process.env.HMAC_SECRET     ? 'ok' : 'missing'

  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  )
}
