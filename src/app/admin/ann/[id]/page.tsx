'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CATEGORY_LABELS } from '@/types'

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
function scoreColor(s: number | null) {
  if (s == null) return 'text-on-surface-variant'
  if (s < 60)   return 'text-red-600'
  if (s < 80)   return 'text-amber-600'
  return 'text-primary'
}

function gradeLabel(g: string | null) {
  const m: Record<string, { label: string; letter: string; cls: string }> = {
    VERIFIED:     { label: '검증 완료',  letter: 'A+', cls: 'bg-primary/10 text-primary border-primary/20'      },
    LIKELY_TRUE:  { label: '사실 가능',  letter: 'A',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'  },
    UNDER_REVIEW: { label: '검토 필요',  letter: 'B',  cls: 'bg-amber-50 text-amber-700 border-amber-200'        },
    UNVERIFIED:   { label: '미검증',     letter: 'C',  cls: 'bg-orange-50 text-orange-700 border-orange-200'      },
    LIKELY_FALSE: { label: '허위 가능',  letter: 'D',  cls: 'bg-red-50 text-red-700 border-red-200'              },
  }
  return g ? (m[g] ?? { label: g, letter: '?', cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' }) : null
}

function msToTime(ms: number | null) {
  if (!ms) return '—'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── 7단계 스텝 정의 ──────────────────────────────────────────────────────────
const STEP_DEFS = [
  { key: 'step1_sourceAnalysis',    n: 1, icon: 'manage_search',  title: '출처 분석'      },
  { key: 'step2_crossVerification', n: 2, icon: 'psychology',     title: 'AI 교차 검증'   },
  { key: 'step3_dataValidation',    n: 3, icon: 'dataset',        title: '데이터 검증'    },
  { key: 'step4_imageAnalysis',     n: 4, icon: 'image_search',   title: '이미지 분석'    },
  { key: 'step5_videoAnalysis',     n: 5, icon: 'videocam',       title: '영상 분석'      },
  { key: 'step6_patternDetection',  n: 6, icon: 'lan',            title: '패턴 감지'      },
  { key: 'step7_finalScore',        n: 7, icon: 'verified',       title: '최종 점수 산출' },
]

function extractStepScore(key: string, data: any): number | null {
  if (!data) return null
  if (key === 'step1_sourceAnalysis')    return data.score ?? null
  if (key === 'step2_crossVerification') return data.average ?? null
  if (key === 'step3_dataValidation')    return data.sourcesChecked ? Math.round(data.matches / data.sourcesChecked * 100) : null
  if (key === 'step4_imageAnalysis')     return data.filesAnalyzed === 0 ? null : (data.deepfakeDetected ? 20 : 85)
  if (key === 'step5_videoAnalysis')     return data.filesAnalyzed === 0 ? null : (data.deepfakeDetected ? 20 : 85)
  if (key === 'step6_patternDetection')  return data.anomalyScore != null ? Math.round(100 - data.anomalyScore * 30) : null
  if (key === 'step7_finalScore')        return data.score ?? null
  return null
}

function extractStepDetail(key: string, data: any): string {
  if (!data) return '데이터 없음'
  if (key === 'step1_sourceAnalysis')    return data.notes || `제보자 이력: ${data.submitterHistory || '—'}`
  if (key === 'step2_crossVerification') return `4개 AI 모델 독립 분석. 평균 ${data.average ?? '—'}점. 컨센서스: ${data.consensus || '—'}`
  if (key === 'step3_dataValidation')    return data.verdict || `${data.sourcesChecked}개 DB 대조. ${data.matches}건 일치, ${data.mismatches}건 불일치.`
  if (key === 'step4_imageAnalysis')     return data.verdict || (data.filesAnalyzed === 0 ? '분석할 이미지 없음 (N/A)' : `${data.filesAnalyzed}개 이미지 분석. 딥페이크: ${data.deepfakeDetected ? '감지됨' : '없음'}.`)
  if (key === 'step5_videoAnalysis')     return data.verdict || (data.filesAnalyzed === 0 ? '분석할 영상 없음 (N/A)' : `${data.filesAnalyzed}개 영상 분석.`)
  if (key === 'step6_patternDetection')  return data.patterns?.length > 0 ? data.patterns.join(', ') : `관련 시그널 ${data.relatedSignals ?? 0}건. 조직 패턴: ${data.organizationalFlag ? '감지됨' : '없음'}.`
  if (key === 'step7_finalScore')        return data.recommendation || `최종 등급: ${data.grade}. 배포 권고 파트너: ${data.distributionTargets ?? 0}개.`
  return JSON.stringify(data).slice(0, 120)
}

function isSkipStep(key: string, data: any): boolean {
  if ((key === 'step4_imageAnalysis' || key === 'step5_videoAnalysis') && data?.filesAnalyzed === 0) return true
  return false
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function AdminANNDetail() {
  const params    = useParams()
  const router    = useRouter()
  const signalId  = params?.id as string

  const [data,          setData]          = useState<any>(null)
  const [loading,       setLoading]       = useState(true)
  const [approved,      setApproved]      = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [reprocessMsg,  setReprocessMsg]  = useState<{ ok: boolean; text: string } | null>(null)
  const [polling,       setPolling]       = useState(false)
  const [toast,         setToast]         = useState<{ ok: boolean; text: string } | null>(null)
  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(() => {
    if (!signalId) return
    fetch(`/api/admin/ann/${signalId}`)
      .then(r => r.json())
      .then(d => {
        setData(d.error ? null : d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [signalId])

  useEffect(() => { load() }, [load])

  // 재검증 후 결과 폴링 (최대 60초, 5초 간격)
  useEffect(() => {
    if (!polling) return
    let tries = 0
    const timer = setInterval(() => {
      tries++
      fetch(`/api/admin/ann/${signalId}`)
        .then(r => r.json())
        .then(d => {
          if (d.completedAt || tries >= 12) {
            setData(d.error ? null : d)
            setPolling(false)
            clearInterval(timer)
          }
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [polling, signalId])

  const handleReprocess = async () => {
    setActionLoading(true)
    setReprocessMsg(null)
    console.log('[ANN] reprocess triggered for signalId:', signalId)
    try {
      const res  = await fetch(`/api/admin/ann/${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprocess' }),
      })
      const json = await res.json()
      console.log('[ANN] reprocess response:', res.status, json)
      if (res.ok) {
        setReprocessMsg({ ok: true, text: `${json.message || 'ANN 재처리 시작'} — 자동으로 결과를 업데이트합니다 (최대 60초)` })
        setData(null)
        setPolling(true)
      } else {
        setReprocessMsg({ ok: false, text: json.error || `오류 ${res.status}` })
      }
    } catch (err) {
      console.error('[ANN] reprocess fetch error:', err)
      setReprocessMsg({ ok: false, text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/signals/${signalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_DIST', note: '관리자 검토 완료, 배포 승인' }),
      })
      if (res.ok) { setApproved(true); setTimeout(() => router.push('/admin/signals'), 1500) }
    } finally { setActionLoading(false) }
  }

  // ── 데이터 추출 ─────────────────────────────────────────────────────────
  const ann        = data               // AnnVerification record
  const signal     = data?.signal       // Signal record
  const finalScore = ann?.finalScore
  const finalGrade = ann?.finalGrade
  const gradeInfo  = gradeLabel(finalGrade)
  const step2      = ann?.step2_crossVerification as any
  const step6      = ann?.step6_patternDetection  as any
  const aiModels   = step2 ? [step2.gpt, step2.claude, step2.gemini, step2.llama].filter(Boolean) : []

  // ── 폴링 중 로딩 UI ─────────────────────────────────────────────────────
  const isProcessing = polling || (loading && !data)

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">

      {/* 토스트 알림 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold ${
          toast.ok ? 'bg-primary text-white' : 'bg-red-500 text-white'
        }`}>
          <span className="material-symbols-outlined text-base">{toast.ok ? 'check_circle' : 'error'}</span>
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 재검증 상태 배너 */}
      {reprocessMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          reprocessMsg.ok
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span className="material-symbols-outlined text-base">
            {reprocessMsg.ok ? (polling ? 'progress_activity' : 'check_circle') : 'error'}
          </span>
          {reprocessMsg.text}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
            <Link href="/admin/review" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-base">rate_review</span>
              검토 큐
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <Link href="/admin/signals" className="hover:text-primary transition-colors">시그널</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">ANN #{signalId?.slice(-8)}</span>
          </div>
          {gradeInfo && (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border ${gradeInfo.cls}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified</span>
              {gradeInfo.label}
            </span>
          )}
          <h1 className="text-3xl font-bold text-on-surface tracking-tight leading-none mb-2">ANN 검증 상세</h1>
          <p className="text-on-surface-variant text-sm">
            {signal?.title || (loading ? '로딩 중...' : '[VAULT_TRANSFERRED]')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-full bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            새로고침
          </button>
          <button
            onClick={handleReprocess}
            disabled={actionLoading || polling}
            className="px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-sm ${polling ? 'animate-spin' : ''}`}>
              {polling ? 'progress_activity' : 'refresh'}
            </span>
            {polling ? '검증 중...' : '재검증'}
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading || approved || !ann}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 text-sm ${
              approved
                ? 'bg-primary/10 text-primary cursor-default'
                : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 disabled:opacity-50'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{approved ? 'check_circle' : 'send'}</span>
            {approved ? '배포 완료' : '배포 승인'}
          </button>
        </div>
      </div>

      {/* 로딩 / 없음 상태 */}
      {isProcessing && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-primary block mb-4 animate-spin">progress_activity</span>
          <div className="font-bold text-on-surface mb-1">{polling ? 'ANN 검증 실행 중...' : '데이터 로딩 중...'}</div>
          <div className="text-sm text-on-surface-variant">잠시 기다려주세요. 완료 시 자동으로 업데이트됩니다.</div>
        </div>
      )}

      {!isProcessing && !data && !loading && (
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-4">psychology</span>
          <div className="font-bold text-on-surface mb-1">ANN 검증 결과 없음</div>
          <div className="text-sm text-on-surface-variant mb-4">재검증 버튼을 눌러 ANN 7단계 검증을 시작하세요.</div>
          <button onClick={handleReprocess} disabled={actionLoading}
            className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors">
            ANN 검증 시작
          </button>
        </div>
      )}

      {/* 메인 콘텐츠 (ANN 결과 있을 때만) */}
      {!isProcessing && data && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">최종 점수</div>
              <div className={`text-3xl font-black tracking-tight ${scoreColor(finalScore)}`}>
                {finalScore?.toFixed(0) ?? '—'}<span className="text-sm font-normal text-on-surface-variant">/100</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">{gradeInfo?.label || '—'}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">처리 시간</div>
              <div className="text-3xl font-black text-on-surface tracking-tight">{msToTime(ann?.processingMs)}</div>
              <div className="text-xs text-on-surface-variant mt-1">분:초</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">AI 합의</div>
              <div className="text-3xl font-black text-primary tracking-tight">
                {aiModels.filter((m: any) => m?.grade === 'VERIFIED' || m?.grade === 'LIKELY_TRUE').length}/{aiModels.length || 4}
              </div>
              <div className="text-xs text-on-surface-variant mt-1">모델 동의</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">신뢰 등급</div>
              <div className={`text-3xl font-black tracking-tight ${scoreColor(finalScore)}`}>{gradeInfo?.letter || '—'}</div>
              <div className="text-xs text-on-surface-variant mt-1">
                {ann?.completedAt ? new Date(ann.completedAt).toLocaleDateString('ko-KR') : '처리 중'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-5">

              {/* 검증 시퀀스 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">checklist</span>
                  <h2 className="font-bold text-on-surface">검증 시퀀스</h2>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {STEP_DEFS.map(step => {
                    const stepData  = ann?.[step.key]
                    const stepScore = extractStepScore(step.key, stepData)
                    const detail    = extractStepDetail(step.key, stepData)
                    const skip      = isSkipStep(step.key, stepData)
                    const done      = !!stepData && !skip
                    const pending   = !stepData

                    return (
                      <div key={step.key} className="p-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                          pending ? 'bg-surface-container text-on-surface-variant' :
                          skip    ? 'bg-surface-container text-on-surface-variant' :
                          done    ? 'bg-primary text-white' : 'bg-red-100 text-red-700'
                        }`}>
                          {pending ? step.n : skip ? '—' : '✓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="material-symbols-outlined text-primary text-sm">{step.icon}</span>
                            <span className="text-sm font-bold text-on-surface">Step {step.n}: {step.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              pending ? 'bg-surface-container text-on-surface-variant border-outline-variant/30' :
                              skip    ? 'bg-surface-container text-on-surface-variant border-outline-variant/30' :
                              'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {pending ? '대기' : skip ? 'N/A' : '완료'}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{detail}</p>
                        </div>
                        {stepScore != null && !skip && (
                          <div className="flex-shrink-0 text-right">
                            <div className={`text-lg font-black ${scoreColor(stepScore)}`}>{Math.round(stepScore)}</div>
                            <div className="text-[10px] text-on-surface-variant">/100</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI 교차 검증 테이블 */}
              {aiModels.length > 0 && (
                <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">compare</span>
                    <h2 className="font-bold text-on-surface">AI 교차 검증 상세</h2>
                    <span className="text-xs text-on-surface-variant ml-auto">평균 {step2?.average?.toFixed(1) ?? '—'}점</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/30">
                          <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI 엔진</th>
                          <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">신뢰도</th>
                          <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">주요 판단</th>
                          <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">등급</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiModels.map((ai: any) => {
                          const gi = gradeLabel(ai.grade)
                          return (
                            <tr key={ai.model} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                              <td className="p-4 font-semibold text-on-surface text-sm">{ai.model}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${ai.score}%` }} />
                                  </div>
                                  <span className={`font-black text-sm ${scoreColor(ai.score)}`}>{ai.score}</span>
                                </div>
                              </td>
                              <td className="p-4 text-xs text-on-surface-variant max-w-[200px]">{ai.reasoning}</td>
                              <td className="p-4">
                                {gi ? (
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${gi.cls}`}>{gi.label}</span>
                                ) : (
                                  <span className="text-xs text-on-surface-variant">{ai.grade}</span>
                                )}
                                {ai.flags?.length > 0 && (
                                  <div className="text-[10px] text-amber-600 mt-0.5">{ai.flags.join(', ')}</div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 리포트 미리보기 카드 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <h2 className="font-bold text-on-surface">리포트 미리보기</h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="bg-primary rounded-2xl p-6 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">SignalX ANN Fact-Check Report</div>
                    <div className="text-lg font-bold mb-1">{signal?.title || '[VAULT_TRANSFERRED]'}</div>
                    <div className="text-sm text-white/70 mb-4">
                      {signalId?.slice(-8)} · {ann?.completedAt ? new Date(ann.completedAt).toLocaleDateString('ko-KR') : '—'} · {signal?.country} · {CATEGORY_LABELS[signal?.category as keyof typeof CATEGORY_LABELS] || signal?.category}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex flex-col items-center justify-center">
                        <div className="text-xl font-black">{finalScore?.toFixed(0) ?? '—'}</div>
                        <div className="text-[9px] text-white/70">/100</div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-white">{gradeInfo?.label || '—'}</div>
                        <div className="text-xs text-white/60">
                          {aiModels.length}개 AI 교차검증 · 7단계 {ann?.completedAt ? '완료' : '처리 중'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant leading-relaxed mt-3">
                    리포트는 검토 후 파트너 미디어 및 관련 기관에 자동 배포됩니다. 배포 전 최종 확인이 필요합니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 패널 */}
            <div className="space-y-5">

              {/* 배포 동기화 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">sync</span>
                  <h2 className="font-bold text-on-surface">배포 현황</h2>
                </div>
                <div className="p-4 space-y-2">
                  {(signal?.distributions?.length > 0) ? (
                    signal.distributions.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${d.status === 'SENT' ? 'bg-primary' : 'bg-amber-400 animate-pulse'}`} />
                          <span className="text-sm font-medium text-on-surface">{d.partner?.name || d.reporterEmail || '—'}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          d.status === 'SENT'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {d.status === 'SENT' ? '전송됨' : '대기 중'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-on-surface-variant text-center py-4">
                      <span className="material-symbols-outlined text-2xl block mb-1 opacity-40">send</span>
                      배포 이력 없음
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-outline-variant/20">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading || approved || !ann?.completedAt}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {approved ? '배포 완료' : '전체 배포 승인'}
                  </button>
                </div>
              </div>

              {/* 노드 컨텍스트 */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm">
                <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">hub</span>
                  <h2 className="font-bold text-on-surface">노드 컨텍스트</h2>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {[
                    { k: '시그널 ID',    v: signalId?.slice(-10)     },
                    { k: '상태',         v: signal?.status            },
                    { k: '국가',         v: signal?.country           },
                    { k: '카테고리',     v: CATEGORY_LABELS[signal?.category as keyof typeof CATEGORY_LABELS] || signal?.category },
                    { k: '관련 시그널',  v: `${step6?.relatedSignals ?? 0}건` },
                    { k: '이상 점수',    v: step6?.anomalyScore != null ? step6.anomalyScore.toFixed(2) : '—' },
                    { k: '처리 시간',    v: msToTime(ann?.processingMs) },
                    { k: '첨부파일',     v: `${signal?._count?.attachments ?? signal?.attachments?.length ?? 0}개` },
                  ].map(r => (
                    <div key={r.k} className="flex justify-between py-1.5 border-b border-outline-variant/20 last:border-0">
                      <span className="text-on-surface-variant">{r.k}</span>
                      <span className="font-semibold text-on-surface">{r.v ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 감사 액션 */}
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-5 space-y-2">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">감사 액션</div>
                <Link href="/admin/review"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant/30 text-sm font-medium transition-colors bg-white text-primary hover:bg-primary/5">
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  검토 큐로 이동
                </Link>
                <button
                  onClick={handleReprocess}
                  disabled={actionLoading || polling}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant/30 text-sm font-medium transition-colors bg-white text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  재검증 실행
                </button>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm('Global Director에게 즉시 검토를 요청하시겠습니까?')
                    if (!confirmed) return
                    const res = await fetch(`/api/admin/signals/${signalId}/escalate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: 'ANN 상세 페이지에서 수동 에스컬레이션' }),
                    })
                    if (res.ok) showToast(true, 'Global Director에게 에스컬레이션 요청이 전송되었습니다.')
                    else showToast(false, '에스컬레이션 요청 실패.')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant/30 text-sm font-medium transition-colors bg-white text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-base">bolt</span>
                  Global Director 에스컬레이션
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
