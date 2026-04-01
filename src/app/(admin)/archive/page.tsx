'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATEGORY_LABELS } from '@/types'

const GRADE_KO: Record<string, string> = {
  VERIFIED: '검증됨', LIKELY_TRUE: '사실 가능', UNDER_REVIEW: '검토됨',
  UNVERIFIED: '미검증', LIKELY_FALSE: '거짓 가능',
}
const GRADE_CLS: Record<string, string> = {
  VERIFIED:    'bg-primary/10 text-primary border-primary/20',
  LIKELY_TRUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNDER_REVIEW:'bg-amber-50 text-amber-700 border-amber-200',
  UNVERIFIED:  'bg-surface-container text-on-surface-variant border-outline-variant/40',
  LIKELY_FALSE:'bg-red-50 text-red-700 border-red-200',
}

export default function ArchivePage() {
  const [results,  setResults]  = useState<any[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [page,     setPage]     = useState(1)
  const [pages,    setPages]    = useState(1)
  const [filter, setFilter] = useState({
    q: '', country: '', category: '', grade: '', from: '', to: '',
  })

  const search = async (p = 1) => {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams({
      page:  String(p),
      limit: '20',
      ...(filter.q        ? { q:        filter.q        } : {}),
      ...(filter.country  ? { country:  filter.country  } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.grade    ? { grade:    filter.grade    } : {}),
      ...(filter.from     ? { from:     filter.from     } : {}),
      ...(filter.to       ? { to:       filter.to       } : {}),
    })
    fetch(`/api/admin/archive?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.signals) setResults(d.signals)
        if (d.pagination) { setTotal(d.pagination.total); setPages(d.pagination.pages) }
        setPage(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">inventory_2</span>
          아카이브 검색
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          처리 완료된 제보 전체 검색 — 토큰·국가·분야·날짜·등급별 필터
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
            <input
              placeholder="제보 토큰 검색 (예: SX-AB3...)"
              value={filter.q}
              onChange={e => setFilter(f => ({ ...f, q: e.target.value.toUpperCase() }))}
              onKeyDown={e => e.key === 'Enter' && search(1)}
              className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => search(1)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            검색
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1 block">국가</label>
            <input
              placeholder="예: 한국"
              value={filter.country}
              onChange={e => setFilter(f => ({ ...f, country: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1 block">분야</label>
            <select
              value={filter.category}
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              <option value="">전체</option>
              {Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1 block">ANN 등급</label>
            <select
              value={filter.grade}
              onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))}
              className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              <option value="">전체</option>
              {Object.entries(GRADE_KO).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1 block">날짜 범위</label>
            <div className="flex gap-1">
              <input type="date" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))}
                className="flex-1 px-2 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary" />
              <span className="text-on-surface-variant self-center text-xs">~</span>
              <input type="date" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))}
                className="flex-1 px-2 py-2 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="font-bold text-on-surface text-sm">
              {loading ? '검색 중...' : `검색 결과: ${total.toLocaleString()}건`}
            </h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(null).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20">
                    {['토큰', '제목', '국가', '분야', 'ANN 점수', '등급', '배포', '접수일', ''].map(h => (
                      <th key={h} className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(s => {
                    const grade = s.annVerification?.finalGrade
                    return (
                      <tr key={s.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                        <td className="p-3 font-mono text-xs text-on-surface-variant">{s.trackingToken}</td>
                        <td className="p-3 max-w-[180px]">
                          <div className="text-sm font-semibold text-on-surface truncate">
                            {s.title === '[VAULT_TRANSFERRED]'
                              ? <span className="text-on-surface-variant/50 italic text-xs">Vault 이동됨</span>
                              : s.title}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-on-surface">{s.country}</td>
                        <td className="p-3 text-sm text-on-surface">
                          {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-bold text-primary">
                            {s.annVerification?.finalScore?.toFixed(0) ?? '—'}
                          </span>
                        </td>
                        <td className="p-3">
                          {grade ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${GRADE_CLS[grade]}`}>
                              {GRADE_KO[grade]}
                            </span>
                          ) : <span className="text-on-surface-variant/40 text-xs">—</span>}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold ${s.distributed ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                            {s.distributed ? `${s._count?.distributions ?? 0}건` : '미배포'}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-mono text-on-surface-variant">
                          {new Date(s.submittedAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="p-3">
                          <Link href={`/admin/ann/${s.id}`}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="p-4 border-t border-outline-variant/20 flex justify-center gap-2">
              <button onClick={() => search(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs disabled:opacity-40 hover:bg-surface-container-low">이전</button>
              <span className="px-3 py-1.5 text-xs font-bold">{page} / {pages}</span>
              <button onClick={() => search(page + 1)} disabled={page >= pages}
                className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs disabled:opacity-40 hover:bg-surface-container-low">다음</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
