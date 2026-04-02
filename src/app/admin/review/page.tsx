'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types'

const GRADE_RISK: Record<string, { label: string; cls: string; icon: string }> = {
  UNDER_REVIEW: { label: '검토 필요', cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: 'manage_search' },
  UNVERIFIED:   { label: '미검증',   cls: 'bg-red-50 text-red-700 border-red-200',         icon: 'warning'       },
  LIKELY_FALSE: { label: '허위 가능', cls: 'bg-red-100 text-red-800 border-red-300',        icon: 'cancel'        },
  VERIFIED:     { label: '검증됨',   cls: 'bg-primary/10 text-primary border-primary/20',   icon: 'verified'      },
  LIKELY_TRUE:  { label: '사실 가능', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'check_circle' },
}

export default function ReviewQueuePage() {
  const [signals, setSignals]   = useState<any[]>([])
  const [stats,   setStats]     = useState({ total: 0, urgent: 0, high: 0, unassigned: 0 })
  const [loading, setLoading]   = useState(true)
  const [page,    setPage]      = useState(1)
  const [pages,   setPages]     = useState(1)

  const fetch_ = (p = 1) => {
    setLoading(true)
    fetch(`/api/admin/review?page=${p}&limit=20`)
      .then(r => r.json())
      .then(d => {
        if (d.signals) { setSignals(d.signals); setStats(d.stats) }
        if (d.pagination) setPages(d.pagination.pages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch_(page) }, [page])

  const handleAction = async (id: string, action: string) => {
    await fetch(`/api/admin/signals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    fetch_(page)
  }

  const scoreColor = (score: number | null) => {
    if (score == null) return 'text-on-surface-variant'
    if (score < 60) return 'text-error font-black'
    if (score < 80) return 'text-amber-600 font-bold'
    return 'text-primary font-bold'
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">rate_review</span>
            인간 검토 큐
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            ANN 신뢰도 80점 미만 또는 고위험으로 분류된 제보 — 사람이 직접 검토해야 합니다
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
          <span className="text-xs font-bold text-amber-700">
            80점 이상 제보는 AI가 자동 처리 중
          </span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '전체 검토 대기',  val: stats.total,      color: 'text-on-surface',   bg: 'bg-white',      icon: 'pending_actions' },
          { label: '긴급 (60점 미만)', val: stats.urgent,    color: 'text-error',         bg: 'bg-red-50',     icon: 'emergency_home'  },
          { label: '주의 (60-80점)',  val: stats.high,       color: 'text-amber-600',     bg: 'bg-amber-50',   icon: 'warning'         },
          { label: '담당자 미배정',   val: stats.unassigned, color: 'text-on-surface-variant', bg: 'bg-surface-container-low', icon: 'person_off' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl border border-outline-variant/30 p-5 shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined ${k.color} text-sm`}>{k.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">{k.label}</span>
            </div>
            <div className={`text-3xl font-black ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="font-bold text-on-surface text-sm">검토 대기 목록</h3>
          <button onClick={() => fetch_(page)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">refresh</span>새로고침
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(null).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : signals.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-primary block mb-3">task_alt</span>
            <div className="font-bold text-on-surface mb-1">검토 대기 제보 없음</div>
            <div className="text-sm text-on-surface-variant">AI가 모든 제보를 자동 처리 중입니다</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  {['토큰', '제목', '국가/분야', 'ANN 점수', '등급', '담당자', '액션'].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map(s => {
                  const score = s.annVerification?.finalScore ?? s.annScore
                  const grade = s.annVerification?.finalGrade ?? s.annGrade
                  const gradeInfo = grade ? GRADE_RISK[grade] : null
                  return (
                    <tr key={s.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                      <td className="p-3">
                        <span className="text-[11px] font-mono text-on-surface-variant">{s.trackingToken?.slice(0, 12)}...</span>
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <div className="text-sm font-semibold text-on-surface truncate">{s.title || '—'}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                          {new Date(s.submittedAt).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-on-surface">{s.country}</div>
                        <div className="text-[10px] text-on-surface-variant">
                          {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className={`text-2xl ${scoreColor(score)}`}>
                          {score != null ? score.toFixed(0) : '—'}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">/ 100</div>
                      </td>
                      <td className="p-3">
                        {gradeInfo ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${gradeInfo.cls}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{gradeInfo.icon}</span>
                            {gradeInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">처리 중...</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-on-surface-variant">
                        {s.assignedLeader?.name || <span className="text-error text-xs font-bold">미배정</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Link href={`/admin/ann/${s.id}`}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="ANN 상세">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                          </Link>
                          <button
                            onClick={() => handleAction(s.id, 'APPROVE_FOR_ANN')}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="재검증 승인">
                            <span className="material-symbols-outlined text-sm">refresh</span>
                          </button>
                          <button
                            onClick={() => handleAction(s.id, 'REJECT')}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="거부">
                            <span className="material-symbols-outlined text-sm">cancel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">{signals.length}건 표시 / 전체 {stats.total}건</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs disabled:opacity-40 hover:bg-surface-container-low">이전</button>
              <span className="px-3 py-1.5 text-xs font-bold">{page}/{pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page >= pages}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs disabled:opacity-40 hover:bg-surface-container-low">다음</button>
            </div>
          </div>
        )}
      </div>

      {/* 에스컬레이션 안내 */}
      <div className="bg-[#1a2e24] rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-400 text-xl">bolt</span>
          <div>
            <div className="font-bold text-sm mb-1">에스컬레이션 정책</div>
            <div className="text-xs text-white/60 leading-relaxed space-y-1">
              <div>• ANN <strong className="text-white">60점 미만</strong> 또는 법적 이슈 → Global Director에게 즉시 알림</div>
              <div>• 담당 리더 <strong className="text-white">24시간 미처리</strong> → 자동 상위 에스컬레이션</div>
              <div>• 배포 요청된 제보 중 <strong className="text-white">취하 요청 도착 시</strong> → 우선 순위 URGENT로 자동 격상</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
