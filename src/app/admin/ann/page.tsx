'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const GRADE_STYLE: Record<string, string> = {
  VERIFIED:     'bg-primary/10 text-primary border-primary/20',
  LIKELY_TRUE:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  UNVERIFIED:   'bg-surface-container text-on-surface-variant border-outline-variant/40',
  LIKELY_FALSE: 'bg-red-50 text-red-700 border-red-200',
}
const GRADE_KO: Record<string, string> = {
  VERIFIED: '검증 완료', LIKELY_TRUE: '사실 가능성', UNDER_REVIEW: '검토 중', UNVERIFIED: '미검증', LIKELY_FALSE: '거짓 가능성',
}

// Stage → ANN step mapping
const STAGE_TO_STEP: Record<string, number> = {
  SUBMITTED: 1, LEADER_REVIEW: 2, ANN_PROCESSING: 4,
  VERIFICATION_COMPLETE: 7, DISTRIBUTION_IN_PROGRESS: 7, DISTRIBUTION_COMPLETE: 7,
}

export default function AdminANNList() {
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch verifications from real API
    fetch('/api/admin/ann?limit=30')
      .then(r => r.json())
      .then(d => { if (d.verifications) setItems(d.verifications) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleReprocess = async (signalId: string) => {
    await fetch(`/api/admin/ann/${signalId}`, { method: 'POST' })
    // Refresh
    fetch('/api/admin/ann?limit=30')
      .then(r => r.json())
      .then(d => { if (d.verifications) setItems(d.verifications) })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">ANN 검증 관리</h2>
          <p className="text-on-surface-variant text-sm mt-1">7단계 검증 엔진 현황 및 개별 검증 로그</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          ANN 엔진 활성 · 14ms
        </div>
      </div>

      {/* Engine Status */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">memory</span>
          <span className="font-bold text-on-surface text-sm">ANN 7단계 엔진 상태</span>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">정상 운영</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-x divide-outline-variant/20">
          {['출처 분석', 'AI 교차', '데이터 검증', '이미지 분석', '영상 분석', '패턴 감지', '점수 산출'].map((s, i) => (
            <div key={s} className="p-3 text-center">
              <div className="text-xs font-bold text-on-surface mb-1">Step {i+1}</div>
              <div className="text-[10px] text-on-surface-variant mb-2">{s}</div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 3 ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                {i === 3 ? '점검중' : '정상'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">queue</span>
            <span className="font-bold text-on-surface text-sm">검증 현황</span>
          </div>
          <span className="text-xs text-on-surface-variant">{items.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">토큰</th>
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">제목</th>
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">단계</th>
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">진행률</th>
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">점수</th>
                <th className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">등급</th>
                <th className="text-right p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/20">
                    <td colSpan={7} className="p-4"><div className="skeleton h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2">psychology</span>
                    검증 내역이 없습니다
                  </td>
                </tr>
              ) : items.map((v, i) => {
                const sig  = v.signal || {}
                const step = STAGE_TO_STEP[sig.stage] || 1
                const pct  = Math.round((step / 7) * 100)
                return (
                  <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="p-4 font-mono text-xs text-on-surface-variant">{sig.trackingToken || '—'}</td>
                    <td className="p-4 max-w-[200px]">
                      <span className="text-sm font-semibold text-on-surface truncate block">{sig.title || '—'}</span>
                    </td>
                    <td className="p-4 text-sm text-on-surface">{step}/7</td>
                    <td className="p-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-on-surface w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-4 font-black text-primary">{v.finalScore?.toFixed(0) ?? '—'}</td>
                    <td className="p-4">
                      {v.finalGrade ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${GRADE_STYLE[v.finalGrade]}`}>
                          {GRADE_KO[v.finalGrade]}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                          처리 중
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/admin/ann/${sig.id || v.signalId}`}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="상세보기">
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </Link>
                        <button
                          onClick={() => handleReprocess(sig.id || v.signalId)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="재검증">
                          <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
