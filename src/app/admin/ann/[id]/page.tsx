'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

const STEPS = [
  { n: 1, icon: 'manage_search',    title: '출처 분석',       status: 'done',    score: 87, detail: '신규 제보자. 첨부 문서 메타데이터 원본 확인됨. 신뢰 기준 충족.'                 },
  { n: 2, icon: 'psychology',        title: 'AI 교차 검증',    status: 'done',    score: 90, detail: 'GPT·Claude·Gemini·Llama 4개 모델 독립 분석. 평균 90.25점. 컨센서스 달성.'     },
  { n: 3, icon: 'dataset',           title: '데이터 검증',     status: 'done',    score: 82, detail: '공개 DB 12개 대조. 주요 주장 8/12 일치 확인. 2건 불일치 주석 기록됨.'           },
  { n: 4, icon: 'image_search',      title: '이미지 분석',     status: 'done',    score: 95, detail: '첨부 이미지 2건 딥페이크 감지 실행. 조작 흔적 없음. EXIF 원본 인증.'              },
  { n: 5, icon: 'videocam',         title: '영상 분석',       status: 'skip',    score: null, detail: '첨부 영상 없음 (N/A).'                                                        },
  { n: 6, icon: 'lan',              title: '패턴 감지',       status: 'done',    score: 78, detail: '동일 국가·카테고리 3건 연관 시그널 발견. 조직적 패턴 플래그 부여.'               },
  { n: 7, icon: 'verified',         title: '최종 점수 산출',  status: 'done',    score: 91, detail: '종합 신뢰도 91/100 — 검증 완료. 5개 파트너 배포 승인 권고.'                      },
]

const AI_COMPARE = [
  { model: 'GPT-4o',            score: 93, verdict: '검증됨', notes: '문서 진위 높음, 패턴 일치',       flag: 'verified' },
  { model: 'Claude-3.5-Sonnet', score: 89, verdict: '검증됨', notes: '논리 일관성, 출처 신뢰',          flag: 'verified' },
  { model: 'Gemini-1.5-Pro',    score: 91, verdict: '검증됨', notes: '데이터 분석 일치',                flag: 'verified' },
  { model: 'Llama-3.1-70B',     score: 88, verdict: '검토 권고', notes: '일부 맥락 추가 확인 필요',     flag: 'review'  },
]

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  done: { label: '완료', cls: 'bg-primary/10 text-primary border-primary/20' },
  skip: { label: 'N/A', cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' },
  fail: { label: '실패', cls: 'bg-error-container text-on-error-container border-error/20' },
}

export default function AdminANNDetail() {
  const params  = useParams()
  const router  = useRouter()
  const signalId = params?.id as string
  const [signal,   setSignal]   = useState<any>(null)
  const [approved, setApproved] = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!signalId) return
    // Fetch real data in production
    // fetch(`/api/admin/signals/${signalId}`)...
  }, [signalId])

  const handleApprove = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/signals/${signalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_DIST', note: '관리자 검토 완료, 배포 승인' }),
      })
      if (res.ok) { setApproved(true); setTimeout(() => router.push('/admin/signals'), 1500) }
    } finally { setLoading(false) }
  }

  const handleReprocess = async () => {
    setLoading(true)
    try {
      await fetch(`/api/admin/ann/${signalId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reprocess' }) })
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">

      {/* Breadcrumb + Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
            <Link href="/admin/signals" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-base">folder_open</span>
              감사 로그
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface font-semibold">검증 #{signalId?.slice(-8) || 'ANN-8829-01'}</span>
          </div>
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
            검증된 뉴럴 링크
          </span>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight leading-none mb-2">ANN 검증 상세</h1>
          <p className="text-on-surface-variant">배치 시퀀스 0x992B의 AI 추론 결과 감사.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReprocess}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            재검증
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || approved}
            className={`px-5 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 text-sm ${
              approved
                ? 'bg-primary/10 text-primary cursor-default'
                : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{approved ? 'check_circle' : 'send'}</span>
            {approved ? '배포 완료' : '배포 승인'}
          </button>
        </div>
      </div>

      {/* Score Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '최종 점수', val: '91/100', sub: '검증 완료', color: 'text-primary' },
          { label: '처리 시간', val: '14:32',  sub: '분:초',     color: 'text-on-surface' },
          { label: 'AI 합의',   val: '4/4',    sub: '모델 동의', color: 'text-primary'   },
          { label: '신뢰 등급', val: 'A+',     sub: '최상위',    color: 'text-primary'   },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{k.label}</div>
            <div className={`text-3xl font-black ${k.color} tracking-tight`}>{k.val}</div>
            <div className="text-xs text-on-surface-variant mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-5">

          {/* Verification Sequence */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">checklist</span>
              <h2 className="font-bold text-on-surface">검증 시퀀스</h2>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {STEPS.map(step => (
                <div key={step.n} className="p-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors">
                  {/* Step indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${
                    step.status === 'done' ? 'bg-primary text-white' :
                    step.status === 'skip' ? 'bg-surface-container text-on-surface-variant' :
                    'bg-error-container text-on-error-container'
                  }`}>
                    {step.status === 'done' ? '✓' : step.status === 'skip' ? '—' : '✗'}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="material-symbols-outlined text-primary text-sm">{step.icon}</span>
                      <span className="text-sm font-bold text-on-surface">
                        Step {step.n}: {step.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_MAP[step.status].cls}`}>
                        {STATUS_MAP[step.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{step.detail}</p>
                  </div>
                  {/* Score */}
                  {step.score != null && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-black text-primary">{step.score}</div>
                      <div className="text-[10px] text-on-surface-variant">/100</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Compare Table */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">compare</span>
              <h2 className="font-bold text-on-surface">메타데이터 비교 원장</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30">
                    <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI 엔진</th>
                    <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">신뢰도 점수</th>
                    <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">주요 판단</th>
                    <th className="text-left p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">플래그</th>
                  </tr>
                </thead>
                <tbody>
                  {AI_COMPARE.map(ai => (
                    <tr key={ai.model} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                      <td className="p-4 font-semibold text-on-surface">{ai.model}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${ai.score}%` }} />
                          </div>
                          <span className="font-black text-primary">{ai.score}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">{ai.notes}</td>
                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          ai.flag === 'verified'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ai.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">description</span>
                <h2 className="font-bold text-on-surface">리포트 미리보기</h2>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container-highest transition-colors">
                  수정
                </button>
                <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                  배포 리포트 생성
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="bg-primary rounded-2xl p-6 text-white mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed-dim mb-2">SignalX ANN Fact-Check Report</div>
                <div className="text-xl font-bold mb-1">{signal?.title || '제보 검증 완료'}</div>
                <div className="text-sm text-white/70 mb-4">{signalId?.slice(-8) || 'SX-DEMO01'} · {new Date().toLocaleDateString('ko-KR')} · 한국 · 기업</div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex flex-col items-center justify-center">
                    <div className="text-xl font-black">91</div>
                    <div className="text-[9px] text-white/70">/100</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-primary-fixed-dim">검증 완료</div>
                    <div className="text-xs text-white/60">4개 AI 교차검증 · 7단계 통과</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-on-surface-variant leading-relaxed">
                리포트는 검토 후 파트너 미디어 및 관련 기관에 자동 배포됩니다. 배포 전 최종 확인이 필요합니다.
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-5">

          {/* Distribution Sync */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">sync</span>
              <h2 className="font-bold text-on-surface">배포 동기화</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { name: '연합뉴스',       status: '대기 중', ready: true  },
                { name: 'KBS 취재팀',     status: '대기 중', ready: true  },
                { name: '금융감독원',     status: '승인 필요', ready: false },
                { name: 'Reuters Korea', status: '대기 중', ready: true  },
                { name: '공정거래위원회', status: '승인 필요', ready: false },
              ].map(p => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.ready ? 'bg-primary animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-sm font-medium text-on-surface">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    p.ready
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-outline-variant/20">
              <button
                onClick={handleApprove}
                disabled={loading || approved}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                {approved ? '배포 완료' : '전체 배포 승인'}
              </button>
            </div>
          </div>

          {/* Node Context */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm">
            <div className="p-5 border-b border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">hub</span>
              <h2 className="font-bold text-on-surface">노드 컨텍스트</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                { k: '노드 ID',    v: 'KR-CORP-009'   },
                { k: '리스크 레벨', v: '고위험 (HIGH)' },
                { k: '국가',       v: '한국'           },
                { k: '카테고리',   v: '기업'           },
                { k: '관련 시그널',v: '3건'            },
                { k: '처리 시간',  v: '14분 32초'      },
              ].map(r => (
                <div key={r.k} className="flex justify-between py-1.5 border-b border-outline-variant/20 last:border-0">
                  <span className="text-on-surface-variant">{r.k}</span>
                  <span className="font-semibold text-on-surface">{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Actions */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-5 space-y-3">
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">감사 액션</div>
            {[
              { icon: 'flag',         label: '이상 플래그 표시',   cls: 'text-amber-600 hover:bg-amber-50' },
              { icon: 'block',        label: '제보 거부',          cls: 'text-error hover:bg-error/5'      },
              { icon: 'forward_to_inbox', label: '리더에게 전달', cls: 'text-primary hover:bg-primary/5'  },
            ].map(a => (
              <button key={a.label} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant/30 text-sm font-medium transition-colors bg-white ${a.cls}`}>
                <span className="material-symbols-outlined text-base">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
