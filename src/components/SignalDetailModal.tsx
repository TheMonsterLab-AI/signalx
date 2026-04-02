'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const CATEGORY_KO: Record<string,string> = {
  POLITICS:'정치', CORPORATE:'기업', FINANCE:'금융',
  TECHNOLOGY:'기술', SOCIAL:'사회', CRIME:'범죄',
}
const GRADE_CONFIG: Record<string, { label:string; cls:string; icon:string }> = {
  VERIFIED:     { label:'검증 완료',   cls:'bg-primary/10 text-primary border-primary/20',           icon:'verified'      },
  LIKELY_TRUE:  { label:'사실 가능',   cls:'bg-emerald-50 text-emerald-700 border-emerald-200',       icon:'check_circle'  },
  UNDER_REVIEW: { label:'검토 필요',   cls:'bg-amber-50 text-amber-700 border-amber-200',             icon:'manage_search' },
  UNVERIFIED:   { label:'미검증',      cls:'bg-surface-container text-on-surface-variant border-outline-variant/40', icon:'help' },
  LIKELY_FALSE: { label:'거짓 가능성', cls:'bg-red-50 text-red-700 border-red-200',                   icon:'cancel'        },
}
const STEP_META = [
  { key:'step1_sourceAnalysis',    n:1, title:'출처 분석'      },
  { key:'step2_crossVerification', n:2, title:'AI 교차 검증'  },
  { key:'step3_dataValidation',    n:3, title:'데이터 검증'   },
  { key:'step4_imageAnalysis',     n:4, title:'이미지 분석'   },
  { key:'step5_videoAnalysis',     n:5, title:'영상 분석'     },
  { key:'step6_patternDetection',  n:6, title:'패턴 감지'     },
  { key:'step7_finalScore',        n:7, title:'최종 점수 산출'},
]

function parseStep(raw: any) {
  if (!raw) return { score: null as number|null, detail: '처리 대기', status: 'pending' as const }
  try {
    const d = typeof raw === 'string' ? JSON.parse(raw) : raw
    return {
      score:  d.score ?? null,
      detail: d.detail || d.summary || d.message || '—',
      status: (d.score != null ? 'done' : d.skipped ? 'skip' : 'pending') as 'done'|'skip'|'pending'|'fail',
    }
  } catch { return { score: null as number|null, detail: '파싱 오류', status: 'fail' as const } }
}

interface Props {
  signalId: string
  onClose:  () => void
  onAction: (action: string) => void
}

export default function SignalDetailModal({ signalId, onClose, onAction }: Props) {
  const [tab,      setTab]      = useState<'overview'|'ann'|'timeline'>('overview')
  const [signal,   setSignal]   = useState<any>(null)
  const [ann,      setAnn]      = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [running,  setRunning]  = useState(false)
  const [runMsg,   setRunMsg]   = useState<string|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 시그널 기본 정보
      const sigRes = await fetch(`/api/admin/signals/${signalId}`)
      if (sigRes.ok) setSignal(await sigRes.json())

      // ANN 검증 결과 (없어도 괜찮음)
      const annRes = await fetch(`/api/admin/ann/${signalId}`)
      if (annRes.ok) setAnn(await annRes.json())
    } finally {
      setLoading(false)
    }
  }, [signalId])

  useEffect(() => { load() }, [load])

  // ANN 실행
  const runAnn = async () => {
    setRunning(true)
    setRunMsg(null)
    const res  = await fetch(`/api/admin/ann/${signalId}`, { method: 'POST' })
    const data = await res.json()
    setRunMsg(data.message || (res.ok ? 'ANN 큐 등록됨' : `오류: ${data.error}`))
    setRunning(false)
    if (res.ok) setTimeout(() => { load(); setRunMsg(null) }, 4000)
  }

  const isVaulted   = signal?.title === '[VAULT_TRANSFERRED]'
  const grade       = ann?.finalGrade ? GRADE_CONFIG[ann.finalGrade] : null
  const hasAnnData  = !!ann?.completedAt
  const steps       = STEP_META.map(m => ({ ...m, result: parseStep(ann?.[m.key]) }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── 모달 헤더 ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>fact_check</span>
            </span>
            <div>
              <div className="font-bold text-on-surface text-sm">제보 상세 검토</div>
              <code className="text-[10px] text-on-surface-variant font-mono">{signalId.slice(0, 16)}...</code>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction('REJECT')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-error/40 text-error hover:bg-error/5 transition-all">
              <span className="material-symbols-outlined text-sm">cancel</span>거부
            </button>
            <button
              onClick={() => onAction('APPROVE_DIST')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">send</span>배포 준비
            </button>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors ml-1">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* ── 탭 ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-outline-variant/20 px-6 gap-6 flex-shrink-0">
          {([
            { key:'overview', label:'개요'     },
            { key:'ann',      label:'ANN 검증' },
            { key:'timeline', label:'타임라인' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 text-sm font-bold transition-all border-b-2 ${
                tab === t.key ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'
              }`}>
              {t.label}
              {t.key === 'ann' && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  hasAnnData ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-700'
                }`}>
                  {hasAnnData ? `${Math.round(ann.finalScore ?? 0)}점` : '미검증'}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 탭 내용 ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center gap-3 text-on-surface-variant">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">로딩 중...</span>
            </div>
          ) : (
            <>
              {/* 개요 탭 */}
              {tab === 'overview' && signal && (
                <div className="p-6 space-y-4">
                  {/* ANN 점수 + 메타 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low rounded-2xl p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-1">ANN 점수</div>
                      <div className={`text-3xl font-black ${
                        ann?.finalScore != null
                          ? (ann.finalScore >= 80 ? 'text-primary' : ann.finalScore >= 60 ? 'text-amber-600' : 'text-error')
                          : 'text-on-surface-variant'
                      }`}>
                        {ann?.finalScore != null ? Math.round(ann.finalScore) : '—'}
                        <span className="text-sm font-normal text-on-surface-variant">/100</span>
                      </div>
                      {grade && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-2 ${grade.cls}`}>
                          <span className="material-symbols-outlined text-sm">{grade.icon}</span>
                          {grade.label}
                        </span>
                      )}
                    </div>
                    <div className="bg-surface-container-low rounded-2xl p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">메타</div>
                      <div className="space-y-1 text-xs text-on-surface-variant">
                        <div>국가 <span className="font-bold text-on-surface ml-1">{signal.country}</span></div>
                        <div>분야 <span className="font-bold text-on-surface ml-1">{CATEGORY_KO[signal.category] || signal.category}</span></div>
                        <div>첨부 <span className="font-bold text-on-surface ml-1">{signal.attachments?.length || 0}개</span></div>
                        <div>접수 <span className="font-bold text-on-surface ml-1">{new Date(signal.submittedAt).toLocaleDateString('ko-KR')}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 제목 */}
                  <div className="bg-surface-container-low rounded-2xl p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">제목</div>
                    {isVaulted ? (
                      <div className="flex items-center gap-2 text-on-surface-variant italic text-sm">
                        <span className="material-symbols-outlined text-[#3EB489] text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>encrypted</span>
                        [Vault 보안 격리됨 — {CATEGORY_KO[signal.category]} / {signal.country}]
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-on-surface">{signal.title}</div>
                    )}
                  </div>

                  {/* 원본 내용 */}
                  <div className="bg-surface-container-low rounded-2xl p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">원본 내용 (익명화)</div>
                    {isVaulted ? (
                      <div className="bg-[#1a2e24]/8 border border-[#3EB489]/20 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[#3EB489] text-sm mt-0.5" style={{ fontVariationSettings:"'FILL' 1" }}>encrypted</span>
                          <div>
                            <div className="text-xs font-bold text-[#1a2e24]">보안 Vault에 격리 완료</div>
                            <div className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                              SecureDrop 원칙에 따라 원본 내용은 외부 DB에서 삭제되고 Vault에만 AES-256 암호화 저장됩니다.
                              ANN 재검증 시 Vault에서 복호화하여 분석합니다.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-on-surface leading-relaxed max-h-32 overflow-y-auto">
                        {signal.content || '—'}
                      </div>
                    )}
                  </div>

                  {/* 내부 메모 */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">내부 메모 (0)</span>
                    </div>
                    <input
                      placeholder="내부 메모 입력 (Enter로 저장)..."
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* ANN 검증 탭 */}
              {tab === 'ann' && (
                <div className="p-6 space-y-4">
                  {runMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      runMsg.startsWith('오류') ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{runMsg.startsWith('오류') ? 'error' : 'check'}</span>
                      {runMsg}
                    </div>
                  )}

                  {!hasAnnData ? (
                    <div className="py-10 text-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">psychology</span>
                      <div className="font-bold text-on-surface mb-1">ANN 검증 결과가 없습니다</div>
                      <div className="text-sm text-on-surface-variant mb-6">재검증 버튼으로 ANN을 실행하세요</div>
                      <button onClick={runAnn} disabled={running}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto">
                        <span className={`material-symbols-outlined text-sm ${running ? 'animate-spin' : ''}`}>
                          {running ? 'progress_activity' : 'play_circle'}
                        </span>
                        {running ? 'ANN 실행 중...' : 'ANN 검증 실행'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* 점수 바 */}
                      <div className="bg-surface-container-low rounded-2xl p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold text-on-surface">종합 신뢰도</span>
                          <span className={`font-black ${
                            (ann.finalScore??0) >= 80 ? 'text-primary' : (ann.finalScore??0) >= 60 ? 'text-amber-600' : 'text-error'
                          }`}>{Math.round(ann.finalScore ?? 0)}/100</span>
                        </div>
                        <div className="h-2.5 bg-white rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${ann.finalScore ?? 0}%`,
                              background: (ann.finalScore??0) >= 80 ? '#3EB489' : (ann.finalScore??0) >= 60 ? '#F4C542' : '#E06C75',
                            }} />
                        </div>
                      </div>

                      {/* 7단계 */}
                      <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden">
                        <div className="divide-y divide-outline-variant/20">
                          {steps.map(step => {
                            const s = step.result
                            return (
                              <div key={step.key} className="p-3 flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${
                                  s.status === 'done'    ? 'bg-primary text-white' :
                                  s.status === 'skip'    ? 'bg-surface-container text-on-surface-variant' :
                                  s.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                  'bg-error/10 text-error'
                                }`}>
                                  {s.status === 'done' ? '✓' : s.status === 'skip' ? '—' : step.n}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-on-surface">Step {step.n}: {step.title}</div>
                                  <div className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{s.detail}</div>
                                </div>
                                {s.score != null && (
                                  <span className={`text-sm font-black flex-shrink-0 ${
                                    s.score >= 80 ? 'text-primary' : s.score >= 60 ? 'text-amber-600' : 'text-error'
                                  }`}>{s.score}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <button onClick={runAnn} disabled={running}
                        className="w-full border border-outline-variant/40 text-on-surface-variant text-sm font-bold py-2.5 rounded-xl hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <span className={`material-symbols-outlined text-sm ${running ? 'animate-spin' : ''}`}>refresh</span>
                        재검증 실행
                      </button>
                    </>
                  )}

                  <Link href={`/admin/ann/${signalId}`}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:underline"
                    onClick={onClose}>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    ANN 검증 상세 페이지에서 전체 보기
                  </Link>
                </div>
              )}

              {/* 타임라인 탭 */}
              {tab === 'timeline' && (
                <div className="p-6">
                  {!signal?.stageHistory?.length ? (
                    <div className="text-center py-10 text-on-surface-variant text-sm">타임라인 없음</div>
                  ) : (
                    <div className="space-y-0">
                      {[...signal.stageHistory].reverse().map((h: any, i: number) => (
                        <div key={i} className="flex gap-4 pb-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                            {i < signal.stageHistory.length - 1 && (
                              <div className="w-px flex-1 bg-outline-variant/30 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="text-sm font-bold text-on-surface">{h.stage}</div>
                            {h.note && <div className="text-xs text-on-surface-variant mt-0.5">{h.note}</div>}
                            <div className="text-[10px] font-mono text-on-surface-variant/60 mt-1">
                              {new Date(h.timestamp).toLocaleString('ko-KR')}
                              {h.actorType && ` · ${h.actorType}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
