'use client'

import { useState, useEffect } from 'react'

const TYPE_KO: Record<string, { label: string; cls: string; icon: string }> = {
  FACTUAL_DISPUTE:  { label: '사실 반박',    cls: 'bg-red-50 text-red-700 border-red-200',      icon: 'gavel'           },
  ADDITIONAL_INFO:  { label: '추가 정보',    cls: 'bg-blue-50 text-blue-700 border-blue-200',    icon: 'add_circle'      },
  TAKEDOWN_REQUEST: { label: '배포 철회 요청', cls: 'bg-red-100 text-red-800 border-red-300',   icon: 'block'           },
  CONFIRMATION:     { label: '사실 확인',    cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'fact_check'      },
  GENERAL:          { label: '일반 문의',    cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30', icon: 'mail' },
}
const STATUS_KO: Record<string, { label: string; cls: string }> = {
  RECEIVED:   { label: '수신됨',   cls: 'bg-blue-50 text-blue-700 border-blue-200'           },
  IN_REVIEW:  { label: '검토 중',  cls: 'bg-amber-50 text-amber-700 border-amber-200'        },
  REPLIED:    { label: '답변 완료', cls: 'bg-primary/10 text-primary border-primary/20'       },
  ESCALATED:  { label: '에스컬레이션', cls: 'bg-red-50 text-red-700 border-red-200'          },
  CLOSED:     { label: '종결',     cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' },
}
const PRIORITY_BADGE: Record<string, string> = {
  URGENT:  'bg-red-100 text-red-800 border-red-300',
  HIGH:    'bg-amber-100 text-amber-700 border-amber-200',
  NORMAL:  'bg-surface-container text-on-surface-variant border-outline-variant/30',
  LOW:     'bg-surface-container text-on-surface-variant/60 border-outline-variant/20',
}
const PRIORITY_KO: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }

export default function InquiriesPage() {
  const [inquiries, setInquiries]   = useState<any[]>([])
  const [stats,     setStats]       = useState({ received: 0, inReview: 0, replied: 0, urgent: 0 })
  const [loading,   setLoading]     = useState(true)
  const [selected,  setSelected]    = useState<any>(null)
  const [replyText, setReplyText]   = useState('')
  const [replying,  setReplying]    = useState(false)
  const [tab,       setTab]         = useState<'all'|'mine'|'urgent'>('all')
  const [showAdd,   setShowAdd]     = useState(false)
  const [addForm,   setAddForm]     = useState({ fromName: '', fromOrganization: '', subject: '', content: '', type: 'GENERAL', priority: 'NORMAL', signalToken: '' })

  const load = () => {
    const params = new URLSearchParams({
      limit: '30',
      ...(tab === 'mine'   ? { mine: 'true' } : {}),
      ...(tab === 'urgent' ? { status: 'RECEIVED' } : {}),
    })
    fetch(`/api/admin/inquiries?${params}`)
      .then(r => r.json())
      .then(d => { if (d.inquiries) setInquiries(d.inquiries); if (d.stats) setStats(d.stats) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return
    setReplying(true)
    await fetch(`/api/admin/inquiries/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REPLY', replyContent: replyText }),
    })
    setReplying(false)
    setSelected(null)
    setReplyText('')
    load()
  }

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const handleAdd = async () => {
    await fetch('/api/admin/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setShowAdd(false)
    setAddForm({ fromName: '', fromOrganization: '', subject: '', content: '', type: 'GENERAL', priority: 'NORMAL', signalToken: '' })
    load()
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mark_unread_chat_alt</span>
            문의 · 반박 인박스
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            언론사·기관의 답변 요청·사실 반박·배포 철회 등 모든 인바운드 문의 관리
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          문의 수동 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '미처리',     val: stats.received,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'       },
          { label: '검토 중',    val: stats.inReview,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200'     },
          { label: '답변 완료',  val: stats.replied,   color: 'text-primary',    bg: 'bg-primary/5 border-primary/20'   },
          { label: '긴급',       val: stats.urgent,    color: 'text-error',      bg: 'bg-red-50 border-red-200'         },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl border p-5 shadow-sm`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">{k.label}</div>
            <div className={`text-3xl font-black ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Urgent Alert */}
      {stats.urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
          <div>
            <div className="font-bold text-red-800 text-sm">긴급 문의 {stats.urgent}건 — 법적 대응 가능성</div>
            <div className="text-xs text-red-600 mt-0.5">배포 철회 요청 또는 법적 이의 제기 문의가 있습니다. 즉시 확인하세요.</div>
          </div>
          <button onClick={() => setTab('urgent')} className="ml-auto text-xs font-bold text-error hover:underline">바로 확인</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        {[
          { key: 'all',    label: '전체 문의'    },
          { key: 'mine',   label: '내 담당'      },
          { key: 'urgent', label: '⚡ 긴급·미처리' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${
              tab === t.key
                ? 'text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Inquiry List */}
      <div className="space-y-3">
        {loading ? (
          Array(4).fill(null).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/30 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-primary block mb-3">mark_email_read</span>
            <div className="font-bold text-on-surface mb-1">처리 대기 문의 없음</div>
            <div className="text-sm text-on-surface-variant">모든 문의가 처리되었습니다</div>
          </div>
        ) : inquiries.map(inq => {
          const typeInfo     = TYPE_KO[inq.type]     || TYPE_KO.GENERAL
          const statusInfo   = STATUS_KO[inq.status] || STATUS_KO.RECEIVED
          return (
            <div
              key={inq.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all ${
                inq.priority === 'URGENT' ? 'border-red-200' : 'border-outline-variant/30'
              }`}
              onClick={() => { setSelected(inq); setReplyText('') }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    inq.priority === 'URGENT' ? 'bg-red-50' : 'bg-primary/10'
                  }`}>
                    <span className={`material-symbols-outlined text-sm ${inq.priority === 'URGENT' ? 'text-error' : 'text-primary'}`}>
                      {typeInfo.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.cls}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[inq.priority]}`}>
                        {PRIORITY_KO[inq.priority]}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="font-bold text-on-surface text-sm">{inq.subject}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      <span className="font-medium">{inq.fromName || inq.reporter?.name || '(알 수 없음)'}</span>
                      {' — '}
                      <span>{inq.fromOrganization || inq.reporter?.organization || '미상'}</span>
                    </div>
                    {inq.signal && (
                      <div className="text-[10px] text-primary mt-1 font-mono">
                        관련 제보: {inq.signal.trackingToken}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-on-surface-variant">
                    {new Date(inq.receivedAt).toLocaleDateString('ko-KR')}
                  </div>
                  {inq.assignedTo && (
                    <div className="text-[10px] text-on-surface-variant/60 mt-1">담당: {inq.assignedTo.name}</div>
                  )}
                </div>
              </div>
              {/* Preview */}
              <div className="mt-3 text-xs text-on-surface-variant/70 line-clamp-2 pl-13">
                {inq.content}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">문의 상세 · 답변</h3>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Inquiry details */}
            <div className="bg-surface-container-low rounded-2xl p-5 mb-6 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_KO[selected.type]?.cls}`}>
                  {TYPE_KO[selected.type]?.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[selected.priority]}`}>
                  {PRIORITY_KO[selected.priority]}
                </span>
              </div>
              <div className="font-bold text-on-surface">{selected.subject}</div>
              <div className="text-xs text-on-surface-variant">
                <strong>{selected.fromName || selected.reporter?.name}</strong> —
                {selected.fromOrganization || selected.reporter?.organization} ·
                {new Date(selected.receivedAt).toLocaleString('ko-KR')}
              </div>
              {selected.signal && (
                <div className="text-xs font-mono text-primary bg-primary/5 rounded-lg px-3 py-1.5">
                  관련 제보 토큰: {selected.signal.trackingToken} ({selected.signal.category} · {selected.signal.country})
                </div>
              )}
              <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap bg-white rounded-xl p-4 border border-outline-variant/30">
                {selected.content}
              </div>
            </div>

            {/* Previous reply */}
            {selected.replyContent && (
              <div className="bg-primary/5 rounded-2xl p-5 mb-6 border border-primary/20">
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">reply</span>
                  기존 답변 ({selected.repliedAt ? new Date(selected.repliedAt).toLocaleDateString('ko-KR') : '—'})
                </div>
                <div className="text-sm text-on-surface whitespace-pre-wrap">{selected.replyContent}</div>
              </div>
            )}

            {/* Reply form */}
            {selected.status !== 'CLOSED' && selected.status !== 'REPLIED' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">답변 작성</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-2xl text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="답변 내용을 입력하세요. 발송 후 이메일 감사 로그에 기록됩니다."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatus(selected.id, 'ESCALATED')}
                    className="flex-1 border border-red-200 text-red-600 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">escalator_warning</span>
                    에스컬레이션
                  </button>
                  <button
                    onClick={() => handleStatus(selected.id, 'IN_REVIEW')}
                    className="flex-1 border border-outline-variant/40 text-on-surface-variant font-bold py-3 rounded-xl text-sm hover:bg-surface-container-low transition-all"
                  >
                    검토 중으로 변경
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying || !selected.reporter?.email}
                    className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {replying ? '발송 중...' : '답변 발송'}
                  </button>
                </div>
                {!selected.reporter?.email && (
                  <p className="text-xs text-amber-600 text-center">⚠️ 이메일 주소가 등록되지 않아 발송 불가. 기자 DB에서 이메일을 등록해 주세요.</p>
                )}
              </div>
            )}

            {selected.status === 'REPLIED' && (
              <button
                onClick={() => handleStatus(selected.id, 'CLOSED')}
                className="w-full border border-outline-variant/40 text-on-surface-variant font-bold py-3 rounded-xl text-sm hover:bg-surface-container-low transition-all"
              >
                종결 처리
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Inquiry Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-outline-variant/30"
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">문의 수동 등록</h3>
              <button onClick={() => setShowAdd(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '발신자 이름', key: 'fromName' },
                  { label: '소속',       key: 'fromOrganization' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{f.label}</label>
                    <input
                      value={(addForm as any)[f.key]}
                      onChange={e => setAddForm(a => ({ ...a, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">관련 제보 토큰 (선택)</label>
                <input
                  value={addForm.signalToken}
                  onChange={e => setAddForm(a => ({ ...a, signalToken: e.target.value.toUpperCase() }))}
                  placeholder="SX-XXXXXXX"
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">문의 유형</label>
                  <select
                    value={addForm.type}
                    onChange={e => setAddForm(a => ({ ...a, type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                  >
                    {Object.entries(TYPE_KO).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">우선순위</label>
                  <select
                    value={addForm.priority}
                    onChange={e => setAddForm(a => ({ ...a, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                  >
                    {Object.entries(PRIORITY_KO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">제목</label>
                <input
                  value={addForm.subject}
                  onChange={e => setAddForm(a => ({ ...a, subject: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">내용</label>
                <textarea
                  value={addForm.content}
                  onChange={e => setAddForm(a => ({ ...a, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 border border-outline-variant/40 text-on-surface-variant font-bold py-3 rounded-xl text-sm hover:bg-surface-container-low">취소</button>
              <button
                onClick={handleAdd}
                disabled={!addForm.subject || !addForm.content}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-40">
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
