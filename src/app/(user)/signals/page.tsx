'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── 상수 ────────────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'SUBMITTED',                label: '접수됨',      icon: 'cloud_upload'  },
  { key: 'LEADER_REVIEW',            label: 'ANN 검증 중',  icon: 'psychology'    },
  { key: 'ANN_PROCESSING',           label: '인간 검토 중', icon: 'rate_review'   },
  { key: 'VERIFICATION_COMPLETE',    label: '검증 완료',    icon: 'verified'      },
  { key: 'DISTRIBUTION_IN_PROGRESS', label: '배포 중',      icon: 'send'          },
  { key: 'DISTRIBUTION_COMPLETE',    label: '배포 완료',    icon: 'task_alt'      },
]
const STAGE_IDX: Record<string, number> = Object.fromEntries(STAGES.map((s, i) => [s.key, i]))
const CAT_KO: Record<string, string> = {
  POLITICS:'POLITICS', CORPORATE:'CORPORATE', FINANCE:'FINANCE',
  TECHNOLOGY:'TECHNOLOGY', SOCIAL:'SOCIAL', CRIME:'CRIME',
}
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:      { label: '심사중', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  IN_PROGRESS:  { label: '진행중', cls: 'bg-blue-100 text-blue-700 border-blue-200'   },
  VERIFIED:     { label: '완료',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  LIKELY_TRUE:  { label: '완료',   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  UNDER_REVIEW: { label: '심사중', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  REJECTED:     { label: '거부',   cls: 'bg-red-100 text-red-700 border-red-200'       },
  DISTRIBUTED:  { label: '배포됨', cls: 'bg-primary/10 text-primary border-primary/20' },
}

export default function SignalsPage() {
  const [tokenInput, setTokenInput] = useState('')
  const [activeSignal, setActiveSignal] = useState<any>(null)
  const [signalList,   setSignalList]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // sessionStorage에서 토큰 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('sx_tokens')
    if (saved) {
      const tokens: string[] = JSON.parse(saved)
      Promise.all(
        tokens.map(t =>
          fetch(`/api/track?token=${t}`)
            .then(r => r.json())
            .then(d => d.found ? d.signal : null)
            .catch(() => null)
        )
      ).then(results => {
        const valid = results.filter(Boolean)
        setSignalList(valid)
        if (valid.length > 0) setActiveSignal(valid[0])
      })
    }
  }, [])

  const saveToken = (sig: any) => {
    const saved = JSON.parse(sessionStorage.getItem('sx_tokens') || '[]') as string[]
    if (!saved.includes(sig.trackingToken)) {
      saved.unshift(sig.trackingToken)
      sessionStorage.setItem('sx_tokens', JSON.stringify(saved.slice(0, 10)))
    }
  }

  const handleSearch = useCallback(async () => {
    const t = tokenInput.trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/track?token=${t}`)
      const d   = await res.json()
      if (d.found) {
        setActiveSignal(d.signal)
        setSignalList(prev => {
          const exists = prev.find((s: any) => s.trackingToken === d.signal.trackingToken)
          if (exists) return prev
          return [d.signal, ...prev]
        })
        saveToken(d.signal)
        setTokenInput('')
      } else {
        setError('해당 토큰으로 등록된 제보가 없습니다. 토큰을 다시 확인해 주세요.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [tokenInput])

  const formatToken = (v: string) => {
    const raw = v.replace(/[^A-Z0-9]/g, '').slice(0, 14)
    const parts = [raw.slice(0,2), raw.slice(2,6), raw.slice(6,10), raw.slice(10,14)]
    return parts.filter(Boolean).join('-')
  }

  const stepIdx = activeSignal ? (STAGE_IDX[activeSignal.stage] ?? 0) : -1

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF6F0' }}>

      {/* ── 히어로 ─────────────────────────────────────────────────────── */}
      <div className="text-center pt-16 pb-12 px-6">
        <h1 className="text-5xl font-black tracking-tight text-emerald-950 mb-4"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Signal Tracking
        </h1>
        <p className="text-emerald-900/55 max-w-md mx-auto leading-relaxed">
          익명 제보의 투명한 처리 과정을 실시간으로 확인하세요. 발급받으신 토큰을 통해 보안화된 타임라인에 접근할 수 있습니다.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 space-y-8 pb-24">

        {/* ── 토큰 입력 ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-8">
          <div className="text-xs font-bold text-emerald-900/40 uppercase tracking-widest mb-4">추적 토큰 입력</div>
          <div className="flex gap-3">
            <input
              value={tokenInput}
              onChange={e => setTokenInput(formatToken(e.target.value.toUpperCase()))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="SX - 0000 - 0000 - 0000"
              className="flex-1 px-5 py-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-base font-mono text-emerald-900 placeholder-emerald-900/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!tokenInput.trim() || loading}
              className="flex items-center gap-2 px-7 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>
                  fingerprint
                </span>
              )}
              조회하기
            </button>
          </div>
          {error && (
            <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}
          {!activeSignal && (
            <div className="mt-4 text-center">
              <Link href="/submit" className="text-sm text-primary/70 hover:text-primary transition-colors">
                추적 토큰이 없으신가요? →
              </Link>
            </div>
          )}
        </div>

        {/* ── 활성 시그널 카드 ──────────────────────────────────────────── */}
        {activeSignal && (
          <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-8">
            {/* 상태 배지 + 제목 + 버튼 */}
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">ACTIVE SIGNAL</span>
                </div>
                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
                  현재 추적 리포트: #{activeSignal.trackingToken?.slice(-4) || '----'}
                </h2>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {activeSignal.hasReport && (
                  <Link href={`/report/${activeSignal.trackingToken}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span>
                    리포트 보기
                  </Link>
                )}
                <Link href="/submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-sm">add</span>
                  추가 자료 제출
                </Link>
              </div>
            </div>

            {/* 6단계 타임라인 */}
            <div className="relative">
              {/* 연결선 */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-emerald-100" style={{ zIndex: 0 }} />
              <div className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
                style={{ zIndex: 1, width: `${Math.min(100, (stepIdx / (STAGES.length - 1)) * 100)}%` }} />

              <div className="relative flex justify-between" style={{ zIndex: 2 }}>
                {STAGES.map((stage, i) => {
                  const done    = i < stepIdx
                  const current = i === stepIdx
                  const pending = i > stepIdx
                  const hist    = activeSignal.stageHistory?.find((h: any) => h.stage === stage.key)

                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        current ? 'bg-primary shadow-lg shadow-primary/40 scale-110' :
                        done    ? 'bg-primary/80' :
                                  'bg-white border-2 border-emerald-100'
                      }`}>
                        <span className={`material-symbols-outlined text-sm ${
                          done || current ? 'text-white' : 'text-emerald-300'
                        }`} style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                          {done ? 'check' : stage.icon}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className={`text-[10px] font-bold ${
                          current ? 'text-primary' : done ? 'text-emerald-700' : 'text-emerald-300'
                        }`}>
                          {stage.label}
                        </div>
                        {current && (
                          <div className="text-[9px] text-emerald-400 mt-0.5">진행 중</div>
                        )}
                        {hist && (
                          <div className="text-[9px] text-emerald-300 mt-0.5">
                            {new Date(hist.timestamp).toLocaleDateString('ko-KR', { month:'2-digit', day:'2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 나의 제보 내역 ────────────────────────────────────────────── */}
        {(signalList.length > 0 || true) && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-emerald-950 tracking-tight">나의 제보 내역</h2>
              {signalList.length > 2 && (
                <button className="text-sm text-emerald-600/60 hover:text-emerald-700 transition-colors flex items-center gap-1">
                  전체 보기 <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 시그널 카드들 */}
              {signalList.slice(0, 4).map((sig: any) => {
                const isActive  = activeSignal?.trackingToken === sig.trackingToken
                const badge     = sig.distributed ? STATUS_BADGE.DISTRIBUTED
                                : STATUS_BADGE[sig.status] || STATUS_BADGE.PENDING
                const sIdx      = STAGE_IDX[sig.stage] ?? 0

                return (
                  <div key={sig.trackingToken}
                    onClick={() => setActiveSignal(sig)}
                    className={`bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-all ${
                      isActive ? 'border-primary/30 ring-2 ring-primary/15' : 'border-emerald-100 hover:border-emerald-200'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">
                        {CAT_KO[sig.category] || sig.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-emerald-950 text-sm mb-2 line-clamp-2">
                      {sig.title && sig.title !== '[VAULT_TRANSFERRED]'
                        ? sig.title
                        : `[${CAT_KO[sig.category]} 관련 제보]`}
                    </h3>
                    <div className="text-[11px] text-emerald-600/50 mb-4">
                      {new Date(sig.submittedAt).toLocaleDateString('ko-KR')} · {sig.trackingToken}
                    </div>
                    {/* 미니 진행 바 */}
                    <div className="flex items-center gap-1 mb-3">
                      {STAGES.map((_, i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full ${
                          i <= sIdx ? 'bg-primary' : 'bg-emerald-100'
                        }`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {sig.annScore != null && (
                          <span className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center text-[9px] font-black text-primary">
                            {Math.round(sig.annScore)}
                          </span>
                        )}
                        {sig.attachments?.length > 0 && (
                          <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-[9px] text-emerald-600">
                            📎
                          </span>
                        )}
                      </div>
                      {sig.distributed && (
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          배포됨 <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* 새 제보 작성 카드 */}
              <Link href="/submit"
                className="bg-white/60 border-2 border-dashed border-emerald-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:border-primary/40 hover:bg-white transition-all group min-h-[180px]">
                <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-emerald-400 group-hover:text-primary text-xl transition-colors">add</span>
                </div>
                <div>
                  <div className="font-bold text-emerald-700 group-hover:text-primary text-sm transition-colors">새 제보 작성</div>
                  <div className="text-[11px] text-emerald-500/60 mt-1">익명성이 100% 보장됩니다</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 푸터 ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-emerald-100 bg-white/50">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-black text-emerald-900 text-sm">SignalX</div>
            <div className="text-[11px] text-emerald-900/40 mt-0.5">© 2024 SignalX. All rights reserved. Anonymity Guaranteed.</div>
          </div>
          <div className="flex gap-6 text-[11px] text-emerald-900/50">
            <Link href="/about#legal" className="hover:text-emerald-700 transition-colors">Legal Disclaimers</Link>
            <Link href="/about#privacy" className="hover:text-emerald-700 transition-colors">Privacy Policy</Link>
            <Link href="/about#contact" className="hover:text-emerald-700 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
