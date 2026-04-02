'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CATEGORY_LABELS } from '@/types'

// ── 타입 ────────────────────────────────────────────────────────────────────
interface Signal {
  id: string
  trackingToken: string
  title: string
  country: string
  category: string
  annScore: number | null
  annGrade: string | null
  status: string
  stage: string
  submittedAt: string
  annVerification: { finalScore: number | null; finalGrade: string | null; completedAt: string | null } | null
  assignedLeader: { name: string; country: string } | null
  stageHistory: { stage: string; note: string; timestamp: string; actorType: string }[]
  _count: { attachments: number }
}

interface Reporter {
  id: string
  name: string
  email: string
  organization: string
  country: string
  totalDeliveries: number
  responseRate: number
  verified: boolean
  mediaPartner: { name: string; type: string } | null
}

// ── 상수 ────────────────────────────────────────────────────────────────────
const RISK_MAP = {
  VERIFIED:     { label: '검증됨',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  icon: 'verified',       risk: '일반'   },
  LIKELY_TRUE:  { label: '사실 가능', cls: 'bg-primary/10 text-primary border-primary/20',       icon: 'check_circle',   risk: '일반'   },
  UNDER_REVIEW: { label: '검토 필요', cls: 'bg-amber-50 text-amber-700 border-amber-200',        icon: 'manage_search',  risk: '주의'   },
  UNVERIFIED:   { label: '미검증',   cls: 'bg-orange-50 text-orange-700 border-orange-200',      icon: 'warning',        risk: '고위험' },
  LIKELY_FALSE: { label: '허위 가능', cls: 'bg-red-50 text-red-700 border-red-300',              icon: 'cancel',         risk: '위급'   },
} as const

const RISK_BADGE: Record<string, { cls: string; icon: string }> = {
  '위급':   { cls: 'bg-red-100 text-red-700 border-red-300',       icon: 'emergency_home'  },
  '고위험': { cls: 'bg-orange-50 text-orange-600 border-orange-200', icon: 'warning'        },
  '주의':   { cls: 'bg-amber-50 text-amber-600 border-amber-200',   icon: 'report_problem'  },
  '일반':   { cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30', icon: 'info' },
}

const REJECT_REASONS = ['ANN 오탐지', '신뢰도 부족', '법적 리스크', '중복 제보', '증거 불충분', '기타']

function scoreColor(score: number | null) {
  if (score == null) return 'text-on-surface-variant'
  if (score < 60)    return 'text-red-600 font-black'
  if (score < 80)    return 'text-amber-600 font-bold'
  return 'text-primary font-bold'
}

function getRisk(grade: string | null, score: number | null): string {
  if (grade && RISK_MAP[grade as keyof typeof RISK_MAP]) return RISK_MAP[grade as keyof typeof RISK_MAP].risk
  if (score != null) {
    if (score < 60) return '위급'
    if (score < 70) return '고위험'
    if (score < 80) return '주의'
  }
  return '일반'
}

function stageLabel(stage: string) {
  const m: Record<string, string> = {
    SUBMITTED:               '접수됨',
    LEADER_REVIEW:           '리더 검토 중',
    ANN_PROCESSING:          'ANN 처리 중',
    VERIFICATION_COMPLETE:   'ANN 검증 완료',
    DISTRIBUTION_IN_PROGRESS:'배포 중',
    DISTRIBUTION_COMPLETE:   '배포 완료',
  }
  return m[stage] || stage
}

// ── 보기 모달 ─────────────────────────────────────────────────────────────
function ViewModal({ signal, onClose, onApprove, onReject }: {
  signal: Signal
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const [tab, setTab]       = useState<'overview' | 'ann' | 'timeline'>('overview')
  const [memos, setMemos]   = useState<any[]>([])
  const [memoText, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/admin/signals/${signal.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {})
    fetch(`/api/admin/signals/${signal.id}/memo`)
      .then(r => r.json())
      .then(d => setMemos(d.memos || []))
      .catch(() => {})
  }, [signal.id])

  const addMemo = async () => {
    if (!memoText.trim()) return
    setSaving(true)
    const res = await fetch(`/api/admin/signals/${signal.id}/memo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: memoText }),
    })
    if (res.ok) {
      const data = await res.json()
      setMemos(prev => [...prev, data.memo])
      setMemo('')
    }
    setSaving(false)
  }

  const score = signal.annVerification?.finalScore ?? signal.annScore
  const grade = signal.annVerification?.finalGrade ?? signal.annGrade
  const gradeInfo = grade ? RISK_MAP[grade as keyof typeof RISK_MAP] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">find_in_page</span>
            <div>
              <div className="font-black text-on-surface text-sm">제보 상세 검토</div>
              <div className="text-[10px] text-on-surface-variant font-mono">{signal.trackingToken?.slice(0, 16)}...</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="px-4 py-1.5 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>거부
            </button>
            <button
              onClick={onApprove}
              className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>배포 준비
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-outline-variant/20 px-6">
          {([['overview','개요'], ['ann','ANN 검증'], ['timeline','타임라인']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* 개요 탭 */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-xl p-4 space-y-1">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ANN 점수</div>
                  <div className={`text-3xl ${scoreColor(score)}`}>{score?.toFixed(0) ?? '—'}<span className="text-sm text-on-surface-variant font-normal">/100</span></div>
                  {gradeInfo && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${gradeInfo.cls}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{gradeInfo.icon}</span>
                      {gradeInfo.label}
                    </span>
                  )}
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">메타</div>
                  <div className="text-xs text-on-surface space-y-1">
                    <div><span className="text-on-surface-variant">국가</span> {signal.country}</div>
                    <div><span className="text-on-surface-variant">분야</span> {CATEGORY_LABELS[signal.category as keyof typeof CATEGORY_LABELS] || signal.category}</div>
                    <div><span className="text-on-surface-variant">첨부</span> {signal._count.attachments}개</div>
                    <div><span className="text-on-surface-variant">접수</span> {new Date(signal.submittedAt).toLocaleDateString('ko-KR')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">제목</div>
                <div className="text-sm font-semibold text-on-surface">{signal.title || '[VAULT_TRANSFERRED]'}</div>
              </div>

              {detail?.content && (
                <div className="bg-surface-container-low rounded-xl p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">원본 내용 (익명화)</div>
                  <div className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {detail.content}
                  </div>
                </div>
              )}

              {/* 내부 메모 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                  내부 메모 ({memos.length})
                </div>
                {memos.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {memos.map((m: any) => (
                      <div key={m.id} className="text-xs bg-white rounded-lg p-2 border border-amber-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-amber-800">{(m.details as any)?.authorName || m.user?.name}</span>
                          <span className="text-amber-600/60">{new Date(m.timestamp).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="text-amber-900">{(m.details as any)?.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={memoText}
                    onChange={e => setMemo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addMemo()}
                    placeholder="내부 메모 입력 (Enter로 저장)..."
                    className="flex-1 text-xs px-3 py-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={addMemo}
                    disabled={saving || !memoText.trim()}
                    className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40"
                  >
                    저장
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ANN 검증 탭 */}
          {tab === 'ann' && (
            <div className="space-y-3">
              {detail?.annVerification ? (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-surface-container-low rounded-xl p-3 text-center">
                      <div className={`text-2xl font-black ${scoreColor(detail.annVerification.finalScore)}`}>
                        {detail.annVerification.finalScore?.toFixed(0) ?? '—'}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">최종 점수</div>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-3 text-center">
                      <div className="text-xs font-bold text-on-surface">{detail.annVerification.finalGrade ?? '—'}</div>
                      <div className="text-[10px] text-on-surface-variant">등급</div>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-3 text-center">
                      <div className="text-xs font-bold text-on-surface">
                        {detail.annVerification.completedAt
                          ? new Date(detail.annVerification.completedAt).toLocaleDateString('ko-KR')
                          : '처리 중'}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">완료일</div>
                    </div>
                  </div>

                  {[
                    { key: 'step1_sourceAnalysis',    n: 1, icon: 'manage_search',  label: '출처 분석'      },
                    { key: 'step2_crossVerification', n: 2, icon: 'psychology',     label: 'AI 교차 검증'   },
                    { key: 'step3_dataValidation',    n: 3, icon: 'dataset',        label: '데이터 검증'    },
                    { key: 'step4_imageAnalysis',     n: 4, icon: 'image_search',   label: '이미지 분석'    },
                    { key: 'step5_videoAnalysis',     n: 5, icon: 'videocam',       label: '영상 분석'      },
                    { key: 'step6_patternDetection',  n: 6, icon: 'lan',            label: '패턴 감지'      },
                    { key: 'step7_finalScore',        n: 7, icon: 'verified',       label: '최종 점수 산출' },
                  ].map(step => {
                    const data = (detail.annVerification as any)[step.key]
                    if (!data) return null
                    const stepScore = data.score ?? data.average ?? null
                    return (
                      <div key={step.key} className="bg-surface-container-low rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">{step.n}</span>
                            <span className="material-symbols-outlined text-primary text-sm">{step.icon}</span>
                            <span className="text-xs font-bold text-on-surface">{step.label}</span>
                          </div>
                          {stepScore != null && (
                            <span className={`text-sm font-black ${scoreColor(stepScore)}`}>{stepScore.toFixed(0)}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          {data.notes || data.verdict || data.recommendation || JSON.stringify(data).slice(0, 120)}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-on-surface-variant/40">psychology</span>
                  <div className="text-sm">ANN 검증 결과가 없습니다</div>
                  <div className="text-xs mt-1">재검증 버튼으로 ANN을 실행하세요</div>
                </div>
              )}
            </div>
          )}

          {/* 타임라인 탭 */}
          {tab === 'timeline' && (
            <div className="space-y-1">
              {(detail?.stageHistory || signal.stageHistory || []).map((h: any, i: number) => (
                <div key={i} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0" />
                    <div className="w-px flex-1 bg-outline-variant/30 mt-1" />
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">{stageLabel(h.stage)}</span>
                      <span className="text-[10px] text-on-surface-variant">{new Date(h.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {h.note && <div className="text-[11px] text-on-surface-variant mt-0.5">{h.note}</div>}
                    <div className="text-[10px] text-on-surface-variant/50 mt-0.5">{h.actorType}</div>
                  </div>
                </div>
              ))}
              {!(detail?.stageHistory || signal.stageHistory)?.length && (
                <div className="text-center text-sm text-on-surface-variant py-8">히스토리 없음</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 거부 모달 ─────────────────────────────────────────────────────────────
function RejectModal({ signal, onClose, onConfirm }: {
  signal: Signal
  onClose: () => void
  onConfirm: (reason: string, memo: string) => void
}) {
  const [reason, setReason] = useState('')
  const [memo,   setMemo]   = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">cancel</span>
          <h3 className="font-black text-on-surface">거부 / 아카이브</h3>
        </div>
        <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3">
          <span className="font-bold">{signal.title || '[VAULT_TRANSFERRED]'}</span>
        </div>
        <div>
          <div className="text-xs font-bold text-on-surface-variant mb-2">거부 사유 선택</div>
          <div className="grid grid-cols-2 gap-2">
            {REJECT_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors text-left ${
                  reason === r
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-on-surface-variant mb-2">추가 메모 (선택)</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={3}
            placeholder="상세 사유를 입력하세요..."
            className="w-full text-xs px-3 py-2 border border-outline-variant/40 rounded-xl focus:outline-none focus:border-red-300 resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors">취소</button>
          <button
            onClick={() => reason && onConfirm(reason, memo)}
            disabled={!reason}
            className="px-4 py-2 text-xs font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            아카이브로 이동
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 배포 사이드 패널 ────────────────────────────────────────────────────────
function DeployPanel({ signal, onClose, onDeployed }: {
  signal: Signal
  onClose: () => void
  onDeployed: () => void
}) {
  const [reporters, setReporters]   = useState<Reporter[]>([])
  const [selected,  setSelected]    = useState<Set<string>>(new Set())
  const [loading,   setLoading]     = useState(true)
  const [deploying, setDeploying]   = useState(false)
  const [message,   setMessage]     = useState('')

  useEffect(() => {
    fetch(`/api/admin/reporters?country=${signal.country}&category=${signal.category}&limit=20`)
      .then(r => r.json())
      .then(d => { setReporters(d.reporters || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [signal.country, signal.category])

  const toggleAll = () => {
    if (selected.size === reporters.length) setSelected(new Set())
    else setSelected(new Set(reporters.map(r => r.id)))
  }

  const deploy = async () => {
    if (selected.size === 0) return
    setDeploying(true)
    try {
      const res = await fetch('/api/admin/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalId:    signal.id,
          reporterIds: Array.from(selected),
          coverNote:   message || undefined,
        }),
      })
      if (res.ok) { onDeployed() }
    } finally {
      setDeploying(false)
    }
  }

  const score = signal.annVerification?.finalScore ?? signal.annScore

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">send</span>
            <div>
              <div className="font-black text-on-surface text-sm">배포 준비</div>
              <div className="text-[10px] text-on-surface-variant">{signal.country} · {CATEGORY_LABELS[signal.category as keyof typeof CATEGORY_LABELS] || signal.category}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-xl text-on-surface-variant">close</span>
          </button>
        </div>

        {/* ANN 리포트 미리보기 */}
        <div className="mx-4 mt-4 bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-on-surface">ANN 검증 리포트</div>
            <div className="text-[10px] text-on-surface-variant mt-0.5">
              점수 {score?.toFixed(0) ?? '—'}/100 · {signal.annVerification?.finalGrade ?? '—'}
            </div>
          </div>
          <Link
            href={`/admin/ann/${signal.id}`}
            className="px-3 py-1.5 border border-primary/30 text-primary text-xs font-semibold rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            미리보기
          </Link>
        </div>

        {/* 파트너 추천 목록 */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-on-surface">
              추천 기자/파트너 <span className="text-primary ml-1">{reporters.length}명</span>
            </div>
            <button onClick={toggleAll} className="text-[10px] text-primary hover:underline">
              {selected.size === reporters.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(null).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : reporters.length === 0 ? (
            <div className="text-center py-8 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-2 opacity-40">person_off</span>
              해당 국가/분야 파트너 없음
            </div>
          ) : (
            reporters.map(r => (
              <label key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected.has(r.id)
                  ? 'bg-primary/5 border-primary/30'
                  : 'border-outline-variant/30 hover:bg-surface-container-low'
              }`}>
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => {
                    const next = new Set(selected)
                    next.has(r.id) ? next.delete(r.id) : next.add(r.id)
                    setSelected(next)
                  }}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface truncate">{r.name}</span>
                    {r.verified && (
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>verified</span>
                    )}
                  </div>
                  <div className="text-[10px] text-on-surface-variant truncate">{r.organization} {r.mediaPartner ? `· ${r.mediaPartner.name}` : ''}</div>
                  <div className="text-[10px] text-on-surface-variant/60 mt-0.5">
                    응답률 {r.responseRate}% · 배포 {r.totalDeliveries}건
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* 커버 메모 + 배포 실행 */}
        <div className="px-4 pb-4 pt-3 border-t border-outline-variant/20 space-y-3 bg-surface-container-low/40">
          <div>
            <div className="text-[10px] font-bold text-on-surface-variant mb-1">커버 메시지 (선택)</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              placeholder="기자에게 전달할 메모..."
              className="w-full text-xs px-3 py-2 border border-outline-variant/40 rounded-xl focus:outline-none focus:border-primary/40 resize-none bg-white"
            />
          </div>
          <button
            onClick={deploy}
            disabled={deploying || selected.size === 0}
            className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">{deploying ? 'progress_activity' : 'send'}</span>
            {deploying ? '배포 중...' : `${selected.size}명에게 배포 실행`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function ReviewQueuePage() {
  const [signals,      setSignals]      = useState<Signal[]>([])
  const [stats,        setStats]        = useState({ total: 0, urgent: 0, high: 0, unassigned: 0 })
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [pages,        setPages]        = useState(1)

  // 필터
  const [filterMe,     setFilterMe]     = useState(false)
  const [filterRisk,   setFilterRisk]   = useState<string>('')    // urgent | high | ''
  const [filterScore,  setFilterScore]  = useState<string>('')    // '80' | ''

  // 선택
  const [checked,      setChecked]      = useState<Set<string>>(new Set())

  // 모달
  const [viewSignal,   setViewSignal]   = useState<Signal | null>(null)
  const [rejectSignal, setRejectSignal] = useState<Signal | null>(null)
  const [deploySignal, setDeploySignal] = useState<Signal | null>(null)

  const buildUrl = useCallback((p = 1) => {
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (filterMe)            params.set('assignedToMe', 'true')
    if (filterRisk)          params.set('riskLevel', filterRisk)
    if (filterScore === '80') params.set('minScore', '80')
    return `/api/admin/review?${params}`
  }, [filterMe, filterRisk, filterScore])

  const load = useCallback((p = 1) => {
    setLoading(true)
    setChecked(new Set())
    fetch(buildUrl(p))
      .then(r => r.json())
      .then(d => {
        if (d.signals)    setSignals(d.signals)
        if (d.stats)      setStats(d.stats)
        if (d.pagination) setPages(d.pagination.pages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [buildUrl])

  useEffect(() => { load(page) }, [page, filterMe, filterRisk, filterScore])

  // 필터 변경 시 페이지 리셋
  const applyFilter = (fn: () => void) => { fn(); setPage(1) }

  // ── 액션 핸들러 ──────────────────────────────────────────────────────────
  const handleAction = async (id: string, action: string, extra?: Record<string, any>) => {
    await fetch(`/api/admin/signals/${id}`, {
      method: 'POST' in { POST: 1 } ? 'PATCH' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    load(page)
  }

  const handleReject = async (id: string, reason: string, note: string) => {
    await fetch(`/api/admin/signals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REJECT', note: `[${reason}] ${note}` }),
    })
    setRejectSignal(null)
    load(page)
  }

  const handleEscalate = async (id: string) => {
    await fetch(`/api/admin/signals/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '수동 에스컬레이션 — 관리자 즉시 검토 필요' }),
    })
    alert('Global Director에게 에스컬레이션 요청이 전송되었습니다.')
  }

  const handleBulkApprove = async () => {
    if (checked.size === 0) return
    for (const id of checked) {
      await fetch(`/api/admin/signals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_FOR_ANN' }),
      })
    }
    setChecked(new Set())
    load(page)
  }

  const toggleCheck = (id: string) => {
    const next = new Set(checked)
    next.has(id) ? next.delete(id) : next.add(id)
    setChecked(next)
  }

  const toggleAll = () => {
    if (checked.size === signals.length) setChecked(new Set())
    else setChecked(new Set(signals.map(s => s.id)))
  }

  const scoreColor2 = (score: number | null) => {
    if (score == null) return 'text-on-surface-variant'
    if (score < 60)    return 'text-red-600 font-black'
    if (score < 80)    return 'text-amber-600 font-bold'
    return 'text-primary font-bold'
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">rate_review</span>
            인간 검토 큐
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            ANN 신뢰도 80점 미만 또는 고위험 분류 제보 — 사람이 직접 검토해야 합니다
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
          <span className="text-xs font-bold text-amber-700">80점 이상 제보는 AI가 자동 처리 중</span>
        </div>
      </div>

      {/* ── KPI 카드 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '전체 검토 대기',   val: stats.total,      color: 'text-on-surface',           bg: 'bg-white',                          icon: 'pending_actions' },
          { label: '긴급 (60점 미만)', val: stats.urgent,     color: 'text-red-600',               bg: 'bg-red-50',                         icon: 'emergency_home'  },
          { label: '주의 (60-80점)',   val: stats.high,       color: 'text-amber-600',             bg: 'bg-amber-50',                       icon: 'warning'         },
          { label: '담당자 미배정',    val: stats.unassigned, color: 'text-on-surface-variant',    bg: 'bg-surface-container-low',          icon: 'person_off'      },
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

      {/* ── 필터 바 ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">필터</span>
        {[
          { label: '내 담당',        active: filterMe,          onClick: () => applyFilter(() => setFilterMe(v => !v)) },
          { label: '긴급 (60점 미만)', active: filterRisk === 'urgent', onClick: () => applyFilter(() => setFilterRisk(v => v === 'urgent' ? '' : 'urgent')) },
          { label: '고위험 (60-80점)', active: filterRisk === 'high',   onClick: () => applyFilter(() => setFilterRisk(v => v === 'high' ? '' : 'high'))   },
          { label: 'ANN 80점 이상',  active: filterScore === '80',     onClick: () => applyFilter(() => setFilterScore(v => v === '80' ? '' : '80'))       },
        ].map(f => (
          <button
            key={f.label}
            onClick={f.onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              f.active
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
        {(filterMe || filterRisk || filterScore) && (
          <button
            onClick={() => { setFilterMe(false); setFilterRisk(''); setFilterScore(''); setPage(1) }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            필터 초기화
          </button>
        )}
        <button onClick={() => load(page)} className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">refresh</span>새로고침
        </button>
      </div>

      {/* ── 일괄 처리 바 ── */}
      {checked.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="material-symbols-outlined text-primary text-sm">check_box</span>
          <span className="text-sm font-bold text-primary">{checked.size}건 선택됨</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              선택 항목 배포 준비
            </button>
            <button
              onClick={() => setChecked(new Set())}
              className="px-4 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 테이블 ── */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
          <h3 className="font-bold text-on-surface text-sm">검토 대기 목록</h3>
          <span className="text-xs text-on-surface-variant">{signals.length}건 표시 / 전체 {stats.total}건</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(null).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
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
                  <th className="p-3 w-8">
                    <input type="checkbox" checked={checked.size === signals.length && signals.length > 0} onChange={toggleAll} className="accent-primary" />
                  </th>
                  {['토큰', '제목', '국가/분야', 'ANN 점수', '위험도', '담당자', '액션'].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map(s => {
                  const score     = s.annVerification?.finalScore ?? s.annScore
                  const grade     = s.annVerification?.finalGrade ?? s.annGrade
                  const gradeInfo = grade ? RISK_MAP[grade as keyof typeof RISK_MAP] : null
                  const risk      = getRisk(grade, score)
                  const riskBadge = RISK_BADGE[risk]
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-outline-variant/20 transition-colors ${
                        checked.has(s.id) ? 'bg-primary/3' : 'hover:bg-surface-container-low'
                      }`}
                    >
                      {/* 체크박스 */}
                      <td className="p-3">
                        <input type="checkbox" checked={checked.has(s.id)} onChange={() => toggleCheck(s.id)} className="accent-primary" />
                      </td>

                      {/* 토큰 */}
                      <td className="p-3">
                        <span className="text-[11px] font-mono text-on-surface-variant">{s.trackingToken?.slice(0, 10)}…</span>
                      </td>

                      {/* 제목 */}
                      <td className="p-3 max-w-[180px]">
                        <div className="text-sm font-semibold text-on-surface truncate">
                          {s.title || <span className="text-on-surface-variant/60 italic text-xs">[VAULT_TRANSFERRED]</span>}
                        </div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                          {new Date(s.submittedAt).toLocaleDateString('ko-KR')}
                        </div>
                      </td>

                      {/* 국가/분야 */}
                      <td className="p-3">
                        <div className="text-sm text-on-surface">{s.country}</div>
                        <div className="text-[10px] text-on-surface-variant">
                          {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS] || s.category}
                        </div>
                      </td>

                      {/* ANN 점수 */}
                      <td className="p-3">
                        <div className={`text-2xl ${scoreColor2(score)}`}>
                          {score != null ? score.toFixed(0) : '—'}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">/ 100</div>
                      </td>

                      {/* 위험도 */}
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 w-fit ${riskBadge.cls}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>{riskBadge.icon}</span>
                          {risk}
                        </span>
                        {gradeInfo && (
                          <span className="text-[10px] text-on-surface-variant/60 mt-0.5 block">{gradeInfo.label}</span>
                        )}
                      </td>

                      {/* 담당자 */}
                      <td className="p-3 text-sm text-on-surface-variant">
                        {s.assignedLeader?.name || <span className="text-red-500 text-xs font-bold">미배정</span>}
                      </td>

                      {/* 액션 */}
                      <td className="p-3">
                        <div className="flex gap-1">
                          {/* 보기 */}
                          <button
                            onClick={() => setViewSignal(s)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="상세 보기"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>

                          {/* 배포 준비 */}
                          <button
                            onClick={() => setDeploySignal(s)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="배포 준비"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          </button>

                          {/* 에스컬레이션 */}
                          <button
                            onClick={() => handleEscalate(s.id)}
                            className="p-1.5 text-on-surface-variant hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Global Director 에스컬레이션"
                          >
                            <span className="material-symbols-outlined text-sm">bolt</span>
                          </button>

                          {/* 거부 */}
                          <button
                            onClick={() => setRejectSignal(s)}
                            className="p-1.5 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="거부/아카이브"
                          >
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

        {/* 페이지네이션 */}
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

      {/* ── 에스컬레이션 정책 ── */}
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

      {/* ── 모달 / 패널 ── */}
      {viewSignal   && (
        <ViewModal
          signal={viewSignal}
          onClose={() => setViewSignal(null)}
          onApprove={() => { setViewSignal(null); setDeploySignal(viewSignal) }}
          onReject={() => { setRejectSignal(viewSignal); setViewSignal(null) }}
        />
      )}

      {rejectSignal && (
        <RejectModal
          signal={rejectSignal}
          onClose={() => setRejectSignal(null)}
          onConfirm={(reason, memo) => handleReject(rejectSignal.id, reason, memo)}
        />
      )}

      {deploySignal && (
        <DeployPanel
          signal={deploySignal}
          onClose={() => setDeploySignal(null)}
          onDeployed={() => { setDeploySignal(null); load(page) }}
        />
      )}
    </div>
  )
}
