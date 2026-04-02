/**
 * POST /api/ann
 *
 * ANN 7단계 검증 프록시 — annverify.ai Cloudflare Worker 호출
 *
 * Request:  { "query": "사용자 문의 텍스트" }
 * Response: { "score": 85, "grade": "A", "verdict": "VERIFIED", "summary": "..." }
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime    = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  let body: { query?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = (body.query || '').trim()
  if (!query) {
    return NextResponse.json({ error: '"query" field is required' }, { status: 400 })
  }

  const workerUrl = process.env.ANN_WORKER_URL
  if (!workerUrl) {
    return NextResponse.json({ error: 'ANN_WORKER_URL not configured' }, { status: 503 })
  }

  let res: Response
  try {
    res = await fetch(`${workerUrl}/api/signalx/check`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query }),
      signal:  AbortSignal.timeout(28_000),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'ANN worker unreachable', detail: err.message },
      { status: 502 }
    )
  }

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error || 'ANN worker error', status: res.status },
      { status: res.status }
    )
  }

  return NextResponse.json(data, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
