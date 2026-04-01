'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STATUS_KO: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: '승인 대기',  cls: 'bg-amber-50 text-amber-700 border-amber-200'        },
  DELIVERED: { label: '발송 완료',  cls: 'bg-primary/10 text-primary border-primary/20'        },
  SENT:      { label: '전송됨',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'   },
  FAILED:    { label: '실패',       cls: 'bg-red-50 text-red-700 border-red-200'               },
}
const PARTNER_TYPE_KO: Record<string, string> = {
  MEDIA: '언론사', GOVERNMENT: '정부기관', NGO: 'NGO', FINANCIAL: '금융기관', LEGAL: '법률기관',
}

// ─── 배포 준비·승인 모달 ────────────────────────────────────────────────────
function DistributeModal({
  signalId, onClose, onDone,
}: { signalId: string; onClose: () => void; onDone: () => void }) {
  const [step,       setStep]       = useState<'prepare' | 'review' | 'done'>('prepare')
  const [suggested,  setSuggested]  = useState<any[]>([])
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [deskNote,   setDeskNote]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<{ sent: number; failed: number } | null>(null)

  // 1단계: 기자 추천 불러오기
  const handlePrepare = async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/distribute', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'PREPARE', signalId }),
    })
    const data = await res.json()
    setSuggested(data.suggested || [])
    setSelected(new Set((data.suggested || []).map((r: any) => r.id)))
    setStep('review')
    setLoading(false)
  }

  // 2단계: 데스크 승인 → 발송
  const handleConfirm = async () => {
    if (selected.size === 0) return
    setLoading(true)

    // 선택된 기자의 distribution ID 조회
    const distRes = await fetch(`/api/admin/distribute?signalId=${signalId}&limit=50`)
    const distData = await distRes.json()
    const pendingIds = (distData.distributions || [])
      .filter((d: any) => d.status === 'PENDING' && d.reporter && selected.has(d.reporter.id))
      .map((d: any) => d.id)

    const res  = await fetch('/api/admin/distribute', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:          'CONFIRM',
        signalId,
        distributionIds: pendingIds,
        deskNote,
      }),
    })
    const data = await res.json()
    setResult(data)
    setStep('done')
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">send</span>
              배포 실행
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              데스크 최종 승인 후 발송됩니다 — 자동 발송 없음
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">

          {/* Step 1: Prepare */}
          {step === 'prepare' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">contacts</span>
              </div>
              <h4 className="font-bold text-on-surface text-lg mb-2">
                파트너 기자 자동 추천
              </h4>
              <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto leading-relaxed">
                제보의 분야·국가를 기반으로 최적 기자를 자동으로 추천합니다.
                추천 결과를 데스크에서 검토 후 최종 발송 대상을 직접 선택합니다.
              </p>
              <button
                onClick={handlePrepare}
                disabled={loading}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>추천 불러오는 중...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">auto_awesome</span>기자 자동 추천 실행</>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Desk Review */}
          {step === 'review' && (
            <div className="space-y-5">

              {/* 중요 안내 */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
                <div>
                  <div className="font-bold text-amber-800 text-sm mb-1">데스크 검토 필수</div>
                  <div className="text-xs text-amber-700 leading-relaxed">
                    발송 전 수신자 목록을 반드시 확인하세요. 체크 해제로 특정 기자를 제외할 수 있습니다.
                    승인 버튼 클릭 시 선택된 기자에게 즉시 발송됩니다.
                  </div>
                </div>
              </div>

              {/* 추천 기자 목록 */}
              {suggested.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2">person_off</span>
                  <div className="font-medium">추천 가능한 기자가 없습니다</div>
                  <div className="text-xs mt-1">기자 DB에서 분야·국가에 맞는 기자를 먼저 등록해 주세요</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-on-surface">
                      추천 기자 {suggested.length}명
                      <span className="text-primary ml-2">(선택: {selected.size}명)</span>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(new Set(suggested.map((r: any) => r.id)))}
                        className="text-xs font-bold text-primary hover:underline">전체 선택</button>
                      <span className="text-on-surface-variant/40">|</span>
                      <button onClick={() => setSelected(new Set())}
                        className="text-xs font-bold text-on-surface-variant hover:underline">전체 해제</button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {suggested.map((r: any) => (
                      <label key={r.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selected.has(r.id)
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-surface-container-low border-outline-variant/30 opacity-60'
                        }`}>
                        <input
                          type="checkbox"
                          className="accent-primary w-4 h-4 flex-shrink-0"
                          checked={selected.has(r.id)}
                          onChange={() => {
                            setSelected(prev => {
                              const next = new Set(prev)
                              next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                              return next
                            })
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-on-surface">{r.name}</span>
                            <span className="text-[10px] text-on-surface-variant/60">·</span>
                            <span className="text-xs text-on-surface-variant">{r.organization}</span>
                            {r.department && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/30">
                                {r.department}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[10px] text-on-surface-variant">{r.country}</span>
                            <span className="text-[10px] text-primary">응답률 {r.responseRate.toFixed(0)}%</span>
                            <span className="text-[10px] text-on-surface-variant">배포 {r.totalDeliveries}건</span>
                          </div>
                        </div>
                        {r.verified && (
                          <span className="material-symbols-outlined text-primary text-sm flex-shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* 데스크 메모 */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                  데스크 메모 (감사 기록용, 선택)
                </label>
                <textarea
                  value={deskNote}
                  onChange={e => setDeskNote(e.target.value)}
                  rows={2}
                  placeholder="배포 결정 이유, 특이사항 등 (이 메모는 감사 로그에 영구 기록됩니다)"
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* 승인 버튼 */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep('prepare')}
                  className="flex-1 border border-outline-variant/40 text-on-surface-variant font-bold py-3 rounded-xl text-sm hover:bg-surface-container-low transition-all">
                  다시 추천
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0 || loading}
                  className="flex-2 bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>발송 중...</>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      데스크 승인 · {selected.size}명에게 발송
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && result && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                result.failed === 0 ? 'bg-primary/10' : 'bg-amber-50'
              }`}>
                <span className={`material-symbols-outlined text-3xl ${
                  result.failed === 0 ? 'text-primary' : 'text-amber-600'
                }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {result.failed === 0 ? 'check_circle' : 'warning'}
                </span>
              </div>
              <h4 className="font-bold text-on-surface text-lg mb-2">배포 완료</h4>
              <div className="text-sm text-on-surface-variant mb-2">
                <span className="text-primary font-bold">{result.sent}건 발송 성공</span>
                {result.failed > 0 && (
                  <span className="text-error font-bold ml-2">{result.failed}건 실패</span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant/60 mb-6">
                이메일 감사 로그에 발송 근거가 기록되었습니다
              </p>
              <button onClick={onClose}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 메인 배포 관리 페이지 ─────────────────────────────────────────────────
export default function AdminDistributePage() {
  const [distributions, setDistributions] = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState<'log' | 'partners'>('log')
  const [modal,         setModal]         = useState<string | null>(null) // signalId
  const [pendingSignals, setPendingSignals] = useState<any[]>([])

  const loadLog = () => {
    fetch('/api/admin/distribute?limit=30')
      .then(r => r.json())
      .then(d => { if (d.distributions) setDistributions(d.distributions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const loadPending = () => {
    // 배포 승인 대기 중인 제보 (DISTRIBUTION_IN_PROGRESS + PENDING distributions)
    fetch('/api/admin/signals?stage=VERIFICATION_COMPLETE&limit=20')
      .then(r => r.json())
      .then(d => { if (d.signals) setPendingSignals(d.signals) })
      .catch(() => {})
  }

  useEffect(() => { loadLog(); loadPending() }, [])

  const delivered = distributions.filter(d => d.status === 'DELIVERED').length
  const failed    = distributions.filter(d => d.status === 'FAILED').length
  const pending   = distributions.filter(d => d.status === 'PENDING').length

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">send</span>
            배포 관리
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            ANN 검증 완료 제보 → 기자 자동 추천 → <strong>데스크 검토·승인</strong> → 발송
          </p>
        </div>
      </div>

      {/* 정책 배너 */}
      <div className="bg-[#1a2e24] rounded-2xl p-4 flex items-center gap-4 text-white">
        <span className="material-symbols-outlined text-amber-400 text-2xl flex-shrink-0"
          style={{ fontVariationSettings: "'FILL' 1" }}>
          policy
        </span>
        <div>
          <div className="font-bold text-sm mb-0.5">배포 정책 — 자동 발송 없음</div>
          <div className="text-xs text-white/60 leading-relaxed">
            정보의 특성상 <strong className="text-white">모든 발송은 데스크(사람)의 최종 승인</strong>이 필수입니다.
            AI는 후보 기자 추천만 수행하며, 최종 결정은 운영팀이 직접 내립니다.
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '총 배포',     val: distributions.length, color: 'text-on-surface'       },
          { label: '발송 완료',   val: delivered,            color: 'text-primary'           },
          { label: '승인 대기',   val: pending,              color: 'text-amber-600'         },
          { label: '실패',        val: failed,               color: 'text-error'             },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1">{k.label}</div>
            <div className={`text-2xl font-black ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* 배포 대기 제보 목록 */}
      {pendingSignals.length > 0 && (
        <div className="bg-white rounded-2xl border border-primary/20 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20 flex items-center gap-2 bg-primary/5">
            <span className="material-symbols-outlined text-primary text-sm">pending_actions</span>
            <h3 className="font-bold text-on-surface text-sm">배포 대기 제보 — 데스크 승인 필요</h3>
            <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              {pendingSignals.length}건
            </span>
          </div>
          <div className="divide-y divide-outline-variant/20">
            {pendingSignals.map((s: any) => (
              <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-on-surface truncate">{s.title || '—'}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {s.country} · {s.category}
                    {s.annScore && <span className="ml-2 text-primary font-bold">ANN {s.annScore.toFixed(0)}점</span>}
                  </div>
                </div>
                <button
                  onClick={() => setModal(s.id)}
                  className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">fact_check</span>
                  데스크 검토·발송
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        {[{ key: 'log', label: '배포 로그' }, { key: 'partners', label: '파트너 목록' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${
              tab === t.key ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Log */}
      {tab === 'log' && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{Array(5).fill(null).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : distributions.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2">send</span>
              배포 내역이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20">
                    {['제보','수신 기자','소속','상태','발송 시각'].map(h => (
                      <th key={h} className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d: any, i: number) => {
                    const st = STATUS_KO[d.status] || STATUS_KO.PENDING
                    return (
                      <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                        <td className="p-3 font-mono text-xs text-on-surface-variant">
                          {d.signal?.trackingToken || '—'}
                          <div className="text-[10px] text-on-surface-variant/50 mt-0.5">
                            {d.signal?.category} · {d.signal?.country}
                          </div>
                        </td>
                        <td className="p-3 text-sm font-semibold text-on-surface">{d.reporter?.name || d.partner?.name || '—'}</td>
                        <td className="p-3 text-sm text-on-surface-variant">{d.reporter?.organization || d.partner?.type ? PARTNER_TYPE_KO[d.partner?.type] : '—'}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="p-3 text-xs font-mono text-on-surface-variant">
                          {d.sentAt ? new Date(d.sentAt).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Partners */}
      {tab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: '연합뉴스',     type: 'MEDIA',      country: '한국',    reporters: 4, active: true  },
            { name: 'Reuters',      type: 'MEDIA',      country: '글로벌',  reporters: 2, active: true  },
            { name: 'Bloomberg',    type: 'MEDIA',      country: '미국',    reporters: 3, active: true  },
            { name: '금융감독원',   type: 'GOVERNMENT', country: '한국',    reporters: 1, active: true  },
            { name: '공정거래위',   type: 'GOVERNMENT', country: '한국',    reporters: 1, active: true  },
          ].map(p => (
            <div key={p.name} className="bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-base">
                    {p.type === 'MEDIA' ? 'newspaper' : 'account_balance'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">활성</span>
              </div>
              <div className="font-bold text-on-surface mb-0.5">{p.name}</div>
              <div className="text-xs text-on-surface-variant mb-3">{PARTNER_TYPE_KO[p.type]} · {p.country}</div>
              <div className="text-xs text-on-surface-variant">
                등록 기자 <span className="font-bold text-primary">{p.reporters}명</span>
              </div>
            </div>
          ))}
          <div className="bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/40 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group min-h-[140px]">
            <span className="material-symbols-outlined text-outline group-hover:text-primary text-2xl mb-2 transition-colors">add</span>
            <div className="text-sm font-bold text-on-surface-variant group-hover:text-on-surface">파트너 추가</div>
            <Link href="/admin/reporters" className="text-xs text-primary hover:underline mt-1">기자 DB에서 관리 →</Link>
          </div>
        </div>
      )}

      {/* 배포 실행 모달 */}
      {modal && (
        <DistributeModal
          signalId={modal}
          onClose={() => setModal(null)}
          onDone={() => { loadLog(); loadPending(); }}
        />
      )}
    </div>
  )
}
