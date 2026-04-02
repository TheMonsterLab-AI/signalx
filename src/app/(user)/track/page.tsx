'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TrackSignalResponse } from '@/types'
import { STAGE_LABELS, STAGE_ORDER, STATUS_LABELS, CATEGORY_LABELS } from '@/types'

function TrackPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [token,    setToken]    = useState(searchParams.get('token') || '')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<TrackSignalResponse | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    const t = searchParams.get('token')
    if (t) { setToken(t); lookupToken(t) }
  }, [])

  const lookupToken = async (t: string) => {
    const clean = t.trim().toUpperCase()
    if (!clean) { setError('토큰을 입력하세요.'); return }
    if (!/^SX-[A-Z2-9]{7}$/.test(clean)) { setError('올바른 토큰 형식이 아닙니다. (예: SX-AB3XY7K)'); return }

    setLoading(true); setError(null); setResult(null)
    try {
      const res  = await fetch(`/api/track?token=${clean}`)
      const data: TrackSignalResponse = await res.json()
      setResult(data)
      if (data.found) router.replace(`/track?token=${clean}`, { scroll: false })
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  const signal = result?.signal

  const currentStageIndex = signal
    ? STAGE_ORDER.indexOf(signal.stage)
    : -1

  return (
    <div className="font-body text-on-surface" style={{ backgroundColor: '#f3fbf5' }}>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-emerald-50/90 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-800">signal_cellular_alt</span>
            <Link href="/" className="text-xl font-bold tracking-tighter text-emerald-900">SignalX</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">홈</Link>
            <Link href="/submit" className="bg-primary text-white px-5 py-2 rounded-full font-semibold text-sm active:scale-95">
              새 제보
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-24 pb-20 max-w-4xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-full text-sm mb-6">
            <span className="material-symbols-outlined text-sm">manage_search</span>
            제보 추적 포털
          </div>
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-4">
            나의 제보 현황
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            제보 시 발급된 추적 토큰을 입력하여 처리 현황을 확인하세요.
          </p>
        </div>

        {/* Token Input */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100/50 mb-8 card-shadow-xl">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">vpn_key</span>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && lookupToken(token)}
                placeholder="SX-XXXXXXX"
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/40 rounded-2xl text-xl font-black tracking-[0.15em] text-center focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <button
              onClick={() => lookupToken(token)}
              disabled={loading}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined">search</span>
                  확인
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-error font-medium text-center">{error}</p>
          )}
          {result && !result.found && !error && (
            <p className="mt-3 text-sm text-on-surface-variant text-center">
              해당 토큰에 대한 제보를 찾을 수 없습니다.
            </p>
          )}
        </div>

        {/* Results */}
        {signal && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Status Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100/50 card-shadow-xl">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="token-display text-xs font-bold text-on-surface-variant/60 bg-surface-container px-3 py-1 rounded-full">
                      {signal.trackingToken}
                    </span>
                    <span className="text-xs text-on-surface-variant/60">
                      {new Date(signal.submittedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-on-surface">{signal.title}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="status-badge bg-surface-container text-on-surface-variant">
                      {CATEGORY_LABELS[signal.category]}
                    </span>
                    <span className="status-badge bg-surface-container text-on-surface-variant">
                      {signal.country}
                    </span>
                  </div>
                </div>

                {/* ANN Score */}
                {signal.annScore && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#eef6f0" strokeWidth="8" />
                        <circle
                          cx="40" cy="40" r="34" fill="none"
                          stroke="#006c4d" strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 34 * signal.annScore / 100} ${2 * Math.PI * 34}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-primary leading-none">{signal.annScore.toFixed(0)}</span>
                        <span className="text-[10px] text-on-surface-variant font-bold">/ 100</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary mt-2">ANN 점수</span>
                  </div>
                )}
              </div>

              {/* Stage Progress */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">처리 단계</h3>
                <div className="flex items-start gap-0 overflow-x-auto pb-2">
                  {STAGE_ORDER.map((stage, i) => {
                    const isCompleted = i <= currentStageIndex
                    const isActive    = i === currentStageIndex
                    return (
                      <div key={stage} className="flex flex-col items-center min-w-[100px] relative">
                        {/* Connector line */}
                        {i < STAGE_ORDER.length - 1 && (
                          <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentStageIndex ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                        )}
                        {/* Dot */}
                        <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all mb-2 ${
                          isCompleted && !isActive ? 'bg-primary border-primary text-white' :
                          isActive               ? 'bg-primary/10 border-primary text-primary' :
                          'bg-white border-outline-variant text-on-surface-variant'
                        }`}>
                          {isCompleted && !isActive ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold text-center leading-tight max-w-[80px] ${
                          isActive    ? 'text-primary' :
                          isCompleted ? 'text-on-surface' :
                          'text-on-surface-variant/50'
                        }`}>
                          {STAGE_LABELS[stage]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Current Status */}
              <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1">현재 상태</div>
                  <div className="font-bold text-on-surface">{STATUS_LABELS[signal.status]}</div>
                </div>
                {signal.hasReport && (
                  <Link
                    href={`/report/${signal.trackingToken}`}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">description</span>
                    ANN 리포트 보기
                  </Link>
                )}
              </div>
            </div>

            {/* Stage History */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100/50 card-shadow-xl">
              <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                처리 이력
              </h3>
              <div className="space-y-4">
                {signal.stageHistory.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      </div>
                      {i < signal.stageHistory.length - 1 && (
                        <div className="w-0.5 h-full min-h-[24px] bg-outline-variant/30 my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="font-bold text-on-surface text-sm">{STAGE_LABELS[h.stage]}</div>
                      {h.note && <p className="text-xs text-on-surface-variant mt-0.5">{h.note}</p>}
                      <p className="text-[11px] text-on-surface-variant/50 mt-1">
                        {new Date(h.timestamp).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help */}
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-2xl">help</span>
                <div>
                  <h4 className="font-bold text-on-surface mb-1">이상한 점이 있으신가요?</h4>
                  <p className="text-sm text-on-surface-variant mb-3">
                    제보 처리 상황에 문의가 있으시면 익명 채널을 통해 문의하실 수 있습니다.
                  </p>
                  <button className="text-sm font-bold text-primary hover:underline">
                    익명 문의하기 →
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 pt-3 z-50 bg-emerald-50/80 backdrop-blur-xl border-t border-emerald-100 rounded-t-3xl">
        <Link href="/"       className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">home</span><span className="text-[10px] font-bold">홈</span></Link>
        <Link href="/submit" className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">sensors</span><span className="text-[10px] font-bold">제보</span></Link>
        <Link href="/track"  className="flex flex-col items-center text-primary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>manage_search</span><span className="text-[10px] font-bold">확인</span></Link>
        <Link href="#"       className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">info</span><span className="text-[10px] font-bold">소개</span></Link>
      </nav>
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <TrackPageContent />
    </Suspense>
  )
}
