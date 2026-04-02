'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { SignalFeedItem } from '@/types'
import { STAGE_LABELS, STATUS_LABELS, CATEGORY_LABELS } from '@/types'

type Filter = {
  category: string
  status:   string
  country:  string
  q:        string
}

const STATUS_STYLE: Record<string, string> = {
  VERIFIED:      'text-primary bg-primary/10 border-primary/20',
  LIKELY_TRUE:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  UNDER_REVIEW:  'text-amber-600 bg-amber-50 border-amber-200',
  UNVERIFIED:    'text-on-surface-variant bg-surface-container border-outline-variant/40',
  LIKELY_FALSE:  'text-red-600 bg-red-50 border-red-200',
  PENDING:       'text-on-surface-variant bg-surface-container border-outline-variant/40',
  IN_PROGRESS:   'text-blue-600 bg-blue-50 border-blue-200',
  REJECTED:      'text-red-600 bg-red-50 border-red-200',
}

const CATEGORIES = ['ALL', 'POLITICS', 'CORPORATE', 'FINANCE', 'TECHNOLOGY', 'SOCIAL', 'CRIME']
const CAT_KO: Record<string, string> = {
  ALL: '전체', POLITICS: '정치', CORPORATE: '기업',
  FINANCE: '금융', TECHNOLOGY: '기술', SOCIAL: '사회', CRIME: '범죄'
}

export default function AdminSignalFeed() {
  const [signals,    setSignals]    = useState<SignalFeedItem[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [filter,     setFilter]     = useState<Filter>({ category: 'ALL', status: '', country: '', q: '' })
  const [selected,   setSelected]   = useState<Set<string>>(new Set())

  const fetchSignals = useCallback(async (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams({
      page:     String(page),
      limit:    '20',
      ...(filter.category !== 'ALL' ? { category: filter.category } : {}),
      ...(filter.status   ? { status:   filter.status   } : {}),
      ...(filter.country  ? { country:  filter.country  } : {}),
      ...(filter.q        ? { q:        filter.q        } : {}),
    })

    try {
      const res  = await fetch(`/api/admin/signals?${params}`)
      const data = await res.json()
      if (data.signals) {
        setSignals(data.signals)
        setPagination(data.pagination)
      }
    } catch {
      // graceful
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchSignals(1) }, [fetchSignals])

  const handleAction = async (id: string, action: string) => {
    const res  = await fetch(`/api/admin/signals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) fetchSignals(pagination.page)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 space-y-5">

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">실시간 시그널 피드</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {pagination.total.toLocaleString()}개 시그널 · 실시간 업데이트
          </p>
        </div>
        <div className="flex gap-3">
          {selected.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => selected.forEach(id => handleAction(id, 'APPROVE_FOR_ANN'))}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">psychology</span>
                ANN 검증 ({selected.size})
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="border border-outline-variant text-on-surface-variant px-3 py-2 rounded-xl text-sm font-medium"
              >
                선택 해제
              </button>
            </div>
          )}
          <button
            onClick={() => fetchSignals(pagination.page)}
            className="border border-outline-variant/60 text-on-surface-variant px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            새로고침
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 card-shadow">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              type="text"
              placeholder="시그널 검색..."
              value={filter.q}
              onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Country */}
          <input
            type="text"
            placeholder="국가 필터"
            value={filter.country}
            onChange={e => setFilter(f => ({ ...f, country: e.target.value }))}
            className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary w-32"
          />

          {/* Status */}
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
          >
            <option value="">전체 상태</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(f => ({ ...f, category: cat }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter.category === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {CAT_KO[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4"
                    onChange={e => {
                      if (e.target.checked) setSelected(new Set(signals.map(s => s.id)))
                      else setSelected(new Set())
                    }}
                    checked={selected.size === signals.length && signals.length > 0}
                  />
                </th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">시그널 ID</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">제목</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">국가</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">카테고리</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">신뢰도</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">상태</th>
                <th className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">단계</th>
                <th className="text-right p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/20">
                    <td colSpan={9} className="p-3">
                      <div className="skeleton h-4 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : signals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2">inbox</span>
                    시그널이 없습니다
                  </td>
                </tr>
              ) : signals.map(s => (
                <tr
                  key={s.id}
                  className={`border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors ${
                    selected.has(s.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td className="p-3">
                    <span className="text-[11px] font-mono text-on-surface-variant">{s.trackingToken}</span>
                  </td>
                  <td className="p-3 max-w-[240px]">
                    <div className="text-sm font-semibold text-on-surface truncate">{s.title}</div>
                    <div className="text-[10px] text-on-surface-variant/60 mt-0.5">
                      {new Date(s.submittedAt).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-on-surface">{s.country}</td>
                  <td className="p-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/40">
                      {CATEGORY_LABELS[s.category]}
                    </span>
                  </td>
                  <td className="p-3">
                    {s.annScore != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${s.annScore}%` }} />
                        </div>
                        <span className="text-xs font-bold text-on-surface">{s.annScore.toFixed(0)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant/40">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] || STATUS_STYLE.PENDING}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] text-on-surface-variant">{STAGE_LABELS[s.stage]}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Link
                        href={`/admin/ann/${s.id}`}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="ANN 검증 상세"
                      >
                        <span className="material-symbols-outlined text-sm">psychology</span>
                      </Link>
                      <button
                        onClick={() => handleAction(s.id, 'APPROVE_FOR_ANN')}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="ANN 검증 승인"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      </button>
                      <button
                        onClick={() => handleAction(s.id, 'REJECT')}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="거부"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-outline-variant/20 flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">
              {signals.length}개 표시 / 전체 {pagination.total.toLocaleString()}개
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSignals(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-surface-container-low transition-colors"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-on-surface">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => fetchSignals(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-surface-container-low transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
