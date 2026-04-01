'use client'

import { useState, useEffect } from 'react'

type Tab = 'members' | 'leaders' | 'partners' | 'logs'

const ROLE_KO: Record<string, string> = {
  GLOBAL_DIRECTOR: '글로벌 디렉터', SIGNAL_LEADER: '시그널 리더',
  ANALYST: '분석가', MEDIA_PARTNER: '미디어 파트너', USER: '제보자',
}
const ROLE_COLOR: Record<string, string> = {
  GLOBAL_DIRECTOR: 'bg-[#1a2e24] text-white',
  SIGNAL_LEADER:   'bg-primary/10 text-primary border border-primary/20',
  MEDIA_PARTNER:   'bg-blue-50 text-blue-700 border border-blue-200',
  ANALYST:         'bg-purple-50 text-purple-700 border border-purple-200',
  REGIONAL_LEAD:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
}


export default function AdminOrgPage() {
  const [tab,     setTab]     = useState<Tab>('members')
  const [members, setMembers] = useState<any[]>([])
  const [logs,    setLogs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetch('/api/admin/org')
      .then(r => r.json())
      .then(d => { if (d.users) setMembers(d.users) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'logs') {
      fetch('/api/admin/audit?limit=20')
        .then(r => r.json())
        .then(d => { if (d.logs) setLogs(d.logs) })
        .catch(() => {})
    }
  }, [tab])

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'members',  label: '회원 관리',       icon: 'group'         },
    { id: 'leaders',  label: '시그널 리더',     icon: 'manage_accounts'},
    { id: 'partners', label: '미디어 파트너',   icon: 'newspaper'     },
    { id: 'logs',     label: '시스템 로그',     icon: 'history'       },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">조직 · 리더 관리</h2>
          <p className="text-on-surface-variant text-sm mt-1">내부 팀 · 시그널 리더 · 파트너 관리</p>
        </div>
        <button className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">person_add</span>
          새 멤버 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 회원',      val: members.length,                                                  color: 'text-on-surface' },
          { label: '시그널 리더',    val: members.filter((m: any) => m.role === 'SIGNAL_LEADER').length,   color: 'text-primary'    },
          { label: '미디어 파트너',  val: members.filter((m: any) => m.role === 'MEDIA_PARTNER').length,   color: 'text-blue-600'   },
          { label: '글로벌 디렉터',  val: 1,                                                 color: 'text-[#1a2e24]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{s.label}</div>
            <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-outline-variant/30 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Members */}
      {tab === 'members' && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  {['이름', '이메일', '역할', '지역', '가입일', '상태', '관리'].map(h => (
                    <th key={h} className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(4).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant/20">
                      <td colSpan={7} className="p-4"><div className="skeleton h-4 rounded w-full" /></td>
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">멤버 없음</td>
                  </tr>
                ) : members.map(m => (
                  <tr key={m.id || m.email} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {m.name?.[0] || '?'}
                        </div>
                        <span className="text-sm font-semibold text-on-surface">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">{m.email}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${ROLE_COLOR[m.role] || 'bg-surface-container text-on-surface-variant'}`}>
                        {ROLE_KO[m.role] || m.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">{m.region || '—'}</td>
                    <td className="p-4 text-xs font-mono text-on-surface-variant">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('ko-KR') : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        m.active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {m.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-sm">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaders */}
      {tab === 'leaders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.filter(m => m.role === 'SIGNAL_LEADER' || m.role === 'GLOBAL_DIRECTOR').map(l => (
            <div key={l.id || l.email} className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1a2e24] flex items-center justify-center text-[#3EB489] font-bold text-lg flex-shrink-0">
                {l.name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <div className="font-bold text-on-surface">{l.name}</div>
                <div className="text-xs text-on-surface-variant">{l.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[l.role] || ''}`}>
                    {ROLE_KO[l.role] || l.role}
                  </span>
                  <span className="text-xs text-on-surface-variant">{l.region}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-sm">person_remove</span>
                </button>
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-outline-variant/40 rounded-2xl p-5 flex items-center justify-center gap-3 text-on-surface-variant hover:border-primary hover:text-primary transition-all">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-semibold text-sm">새 시그널 리더 영입</span>
          </button>
        </div>
      )}

      {/* Partners */}
      {tab === 'partners' && (
        <div className="space-y-4">
          {members.filter(m => m.role === 'MEDIA_PARTNER').map(p => (
            <div key={p.id || p.email} className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-blue-600">newspaper</span>
              </div>
              <div className="flex-1">
                <div className="font-bold text-on-surface">{p.name}</div>
                <div className="text-xs text-on-surface-variant">{p.email} · {p.region}</div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                p.status === '활성' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20">
                {['액션', '행위자', '대상', '시간'].map(h => (
                  <th key={h} className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2">history</span>
                    감사 로그가 없습니다
                  </td>
                </tr>
              ) : logs.map((l, i) => (
                <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-on-surface">{l.user?.name || '시스템'}</td>
                  <td className="p-4 text-sm text-on-surface-variant font-mono">{l.entityId || '—'}</td>
                  <td className="p-4 text-xs text-on-surface-variant">
                    {l.timestamp ? new Date(l.timestamp).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
