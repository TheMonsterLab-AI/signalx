'use client'

import { useState, useEffect } from 'react'

const CATEGORIES = [
  { v: 'POLITICS',   l: '정치'  },
  { v: 'CORPORATE',  l: '기업'  },
  { v: 'FINANCE',    l: '금융'  },
  { v: 'TECHNOLOGY', l: '기술'  },
  { v: 'SOCIAL',     l: '사회'  },
  { v: 'CRIME',      l: '범죄'  },
]

const COUNTRIES = ['한국','미국','일본','영국','싱가포르','중국','독일','프랑스','인도','UAE']

const BLANK_FORM = {
  name: '', email: '', phone: '', organization: '',
  department: '', title: '', country: '한국',
  preferredCategories: [] as string[],
  preferredLanguages: ['ko', 'en'],
  notes: '',
}

export default function ReportersPage() {
  const [reporters, setReporters] = useState<any[]>([])
  const [stats,     setStats]     = useState({ total: 0, verified: 0, avgResponseRate: 0 })
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(BLANK_FORM)
  const [saving,    setSaving]    = useState(false)
  const [filter,    setFilter]    = useState({ q: '', country: '', category: '' })
  const [selected,  setSelected]  = useState<any>(null)

  const load = () => {
    const p = new URLSearchParams({
      limit: '30',
      ...(filter.q        ? { q:        filter.q        } : {}),
      ...(filter.country  ? { country:  filter.country  } : {}),
      ...(filter.category ? { category: filter.category } : {}),
    })
    fetch(`/api/admin/reporters?${p}`)
      .then(r => r.json())
      .then(d => { if (d.reporters) setReporters(d.reporters); if (d.stats) setStats(d.stats) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleSave = async () => {
    if (!form.name || !form.email || !form.organization) return
    setSaving(true)
    await fetch('/api/admin/reporters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowForm(false)
    setForm(BLANK_FORM)
    load()
  }

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      preferredCategories: f.preferredCategories.includes(cat)
        ? f.preferredCategories.filter(c => c !== cat)
        : [...f.preferredCategories, cat],
    }))
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">contacts</span>
            파트너 기자 · 미디어 DB
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            배포 대상 기자 관리 — 분야·국가별 자동 매칭 기반
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          기자 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '등록 기자',   val: stats.total,                   color: 'text-on-surface' },
          { label: '이메일 검증', val: stats.verified,                color: 'text-primary'    },
          { label: '평균 응답률', val: `${stats.avgResponseRate}%`,   color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">{k.label}</div>
            <div className={`text-2xl font-black ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
          <input
            placeholder="이름·소속·부서 검색..."
            value={filter.q}
            onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
            className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter.country}
          onChange={e => setFilter(f => ({ ...f, country: e.target.value }))}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
        >
          <option value="">전체 국가</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filter.category}
          onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
        >
          <option value="">전체 분야</option>
          {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
        </select>
      </div>

      {/* Reporter List */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                {['이름', '소속·부서', '국가', '선호 분야', '배포 이력', '응답률', '상태', ''].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/20">
                    <td colSpan={8} className="p-3"><div className="skeleton h-4 rounded w-full" /></td>
                  </tr>
                ))
              ) : reporters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2">contacts</span>
                    등록된 기자가 없습니다
                  </td>
                </tr>
              ) : reporters.map(r => (
                <tr key={r.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
                    onClick={() => setSelected(r)}>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                        {r.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface">{r.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{r.email.slice(0, 20)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-on-surface">{r.organization}</div>
                    <div className="text-[10px] text-on-surface-variant">{r.department || '—'}</div>
                  </td>
                  <td className="p-3 text-sm text-on-surface">{r.country}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.preferredCategories || []).slice(0, 3).map((cat: string) => (
                        <span key={cat} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {CATEGORIES.find(c => c.v === cat)?.l || cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-sm font-bold text-on-surface">{r.totalDeliveries}건</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${r.responseRate}%` }} />
                      </div>
                      <span className="text-xs font-bold text-on-surface">{r.responseRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      r.active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                    }`}>
                      {r.active ? r.verified ? '검증됨' : '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      onClick={e => { e.stopPropagation(); setSelected(r) }}>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reporter Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">기자 등록</h3>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '이름', key: 'name', required: true },
                  { label: '이메일', key: 'email', required: true, type: 'email' },
                  { label: '전화번호', key: 'phone' },
                  { label: '직책', key: 'title' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                      {f.label} {f.required && <span className="text-error">*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={(form as any)[f.key] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                    소속 언론사 <span className="text-error">*</span>
                  </label>
                  <input
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                    placeholder="예: 연합뉴스"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">부서</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                    placeholder="예: 경제부"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  국가
                </label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  선호 분야 (배포 자동 매칭용)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.v}
                      type="button"
                      onClick={() => toggleCategory(cat.v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        form.preferredCategories.includes(cat.v)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      {cat.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">메모</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="담당 분야, 특이사항 등"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-outline-variant/40 text-on-surface-variant font-bold py-3 rounded-xl hover:bg-surface-container-low transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.email || !form.organization || saving}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-40"
              >
                {saving ? '저장 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reporter Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-outline-variant/30"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {selected.name?.[0]}
                </div>
                <div>
                  <div className="font-bold text-on-surface">{selected.name}</div>
                  <div className="text-sm text-on-surface-variant">{selected.organization} · {selected.department}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: '이메일', val: selected.email },
                { label: '전화',   val: selected.phone || '—' },
                { label: '직책',   val: selected.title || '—' },
                { label: '국가',   val: selected.country },
                { label: '등록일', val: new Date(selected.createdAt).toLocaleDateString('ko-KR') },
                { label: '총 배포', val: `${selected.totalDeliveries}건` },
                { label: '총 응답', val: `${selected.totalResponses}건 (${selected.responseRate.toFixed(0)}%)` },
                { label: '마지막 배포', val: selected.lastDeliveredAt ? new Date(selected.lastDeliveredAt).toLocaleDateString('ko-KR') : '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="text-on-surface-variant font-medium">{r.label}</span>
                  <span className="font-semibold text-on-surface">{r.val}</span>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="mt-4 p-3 bg-surface-container-low rounded-xl">
                <div className="text-xs font-bold text-on-surface-variant mb-1">메모</div>
                <div className="text-sm text-on-surface">{selected.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
