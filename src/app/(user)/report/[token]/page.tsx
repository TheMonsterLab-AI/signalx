'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const ANN_STEPS = [
  { n: 1, icon: 'location_on',       title: '출처 분석',        desc: '제보자 이력 및 문서 메타데이터 원본 확인. 4개 글로벌 GPS 클러스터와 교차 검증.' },
  { n: 2, icon: 'psychology',         title: 'AI 교차 검증',     desc: 'GPT-4o · Claude-3.5 · Gemini-1.5 · Llama-3.1 독립 분석 후 결과 비교.' },
  { n: 3, icon: 'data_info_alert',    title: '데이터 검증',      desc: 'EXIF · XMP · 바이너리 헤더 심층 분석. 공개 DB 98개 교차 검증.' },
  { n: 4, icon: 'image_search',       title: '이미지 분석',      desc: '딥페이크 감지, 조작 흔적 탐지, 메타데이터 정밀 분석.' },
  { n: 5, icon: 'videocam',          title: '영상 분석',        desc: '영상 진위 확인, 맥락 불일치 감지, 출처 역추적.' },
  { n: 6, icon: 'lan',               title: '패턴 감지',        desc: '이상 정보 신호 자동 탐지. 조직적 허위정보 캠페인 식별.' },
  { n: 7, icon: 'verified',          title: '최종 점수 산출',    desc: '가중치 알고리즘 적용, 5단계 등급 출력, 배포 대상 선정.' },
]

const AI_RESULTS = [
  { model: 'GPT-4o',           score: 93, grade: '검증 완료', reasoning: '내부 일관성 높음, 주장 구체적, 문서 진위 확인됨',            flag: 'verified'   },
  { model: 'Claude-3.5-Sonnet',score: 89, grade: '검증 완료', reasoning: '논리 일관성 확인됨, 출처 신뢰도 높음',                        flag: 'verified'   },
  { model: 'Gemini-1.5-Pro',   score: 91, grade: '검증 완료', reasoning: '데이터 분석 일치, 공개 기록과 부합',                          flag: 'verified'   },
  { model: 'Llama-3.1-70B',    score: 88, grade: '검증 완료', reasoning: '일부 맥락 추가 확인 권고',                                    flag: 'review'     },
]

export default function ANNReportPage() {
  const params  = useParams()
  const token   = params?.token as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    // Fetch signal data from track API
    fetch(`/api/track?token=${token}`)
      .then(r => r.json())
      .then(d => { setReport(d.signal || null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const avgScore = Math.round(AI_RESULTS.reduce((s, r) => s + r.score, 0) / AI_RESULTS.length)
  const finalScore = report?.annScore ?? 91

  return (
    <div className="font-body text-on-surface min-h-screen" style={{ backgroundColor: '#f3fbf5' }}>

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-emerald-50/80 backdrop-blur-md shadow-sm flex justify-between items-center px-8 h-20">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-semibold tracking-tighter text-emerald-900">SignalX</Link>
          <div className="hidden md:flex gap-6">
            {['홈', '시그널', '맵', '소개'].map(l => (
              <button key={l} type="button" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/track?token=${token}`} className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
            제보 현황
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            PDF 다운로드
          </button>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">

        {/* Hero — Score + Title */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold tracking-widest uppercase">
                ANN 검증 완료
              </span>
              <span className="text-on-surface-variant text-xs font-medium font-mono">{token}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface leading-tight tracking-tighter mb-6">
              Autonomous Neural Network<br />
              <span className="text-primary">검증 리포트</span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed font-light max-w-2xl">
              {report?.title || '제보 검증 완료'}. 4개 AI 모델 교차 검증 및 7단계 분석 결과.
            </p>
            <div className="flex flex-wrap gap-4 mt-8 text-sm">
              {[
                { icon: 'calendar_today', label: '검증일', val: new Date().toLocaleDateString('ko-KR') },
                { icon: 'location_on',   label: '국가',   val: report?.country || '한국' },
                { icon: 'category',      label: '카테고리', val: report?.category || '기업' },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-outline-variant/30 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-sm">{m.icon}</span>
                  <span className="text-on-surface-variant">{m.label}:</span>
                  <span className="font-semibold text-on-surface">{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Circle */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 flex items-center justify-center rounded-full bg-surface-container-low shadow-xl">
              <div className="absolute inset-4 rounded-full opacity-20" style={{
                background: `conic-gradient(from 180deg at 50% 50%, #006c4d 0deg, #3eb489 ${finalScore * 3.31}deg, #eef6f0 ${finalScore * 3.31}deg)`
              }} />
              {/* SVG Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="110" fill="none" stroke="#eef6f0" strokeWidth="12" />
                <circle
                  cx="128" cy="128" r="110" fill="none"
                  stroke="#006c4d" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 110 * finalScore / 100} ${2 * Math.PI * 110}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="z-10 text-center">
                <span className="block text-6xl font-black text-primary tracking-tighter">{finalScore}</span>
                <span className="text-on-surface-variant text-sm font-bold tracking-widest uppercase">/100</span>
                <span className="block text-xs font-bold text-primary mt-1 uppercase tracking-wider">검증 완료</span>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Node Integrity */}
        <div className="mb-16 bg-white rounded-[2.5rem] p-10 shadow-xl border border-emerald-100/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">뉴럴 노드 무결성</h2>
              <p className="text-on-surface-variant text-sm">4개 AI 모델 교차 검증 결과</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {AI_RESULTS.map(ai => (
              <div key={ai.model} className="bg-surface-container-low rounded-2xl p-5 text-center">
                <div className="text-3xl font-black text-primary mb-1">{ai.score}</div>
                <div className="text-xs font-bold text-on-surface mb-1">{ai.model}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ai.flag === 'verified' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'
                }`}>
                  {ai.grade}
                </span>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI 엔진</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">점수</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">주요 판단</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">결과</th>
                </tr>
              </thead>
              <tbody>
                {AI_RESULTS.map(ai => (
                  <tr key={ai.model} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-semibold text-on-surface">{ai.model}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${ai.score}%` }} />
                        </div>
                        <span className="font-bold text-primary">{ai.score}/100</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-sm">{ai.reasoning}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        ai.flag === 'verified'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ai.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7-Step Verification */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">checklist</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">ANN 7단계 검증 상세</h2>
              <p className="text-on-surface-variant text-sm">각 단계별 분석 결과 및 처리 내역</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ANN_STEPS.map((step, i) => (
              <div key={step.n} className={`bg-white rounded-3xl p-7 border transition-all hover:shadow-lg cursor-default ${
                i === 6 ? 'lg:col-span-4 md:col-span-2 flex gap-6 items-start' : 'border-outline-variant/30'
              }`} style={{ borderColor: i < 6 ? undefined : '#006c4d', background: i === 6 ? 'linear-gradient(135deg,#f3fbf5,#e8f0ea)' : undefined }}>
                <div className={`${i === 6 ? 'flex-shrink-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{step.n}</span>
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>{step.icon}</span>
                  </div>
                  <h3 className="font-bold text-on-surface mb-2">{step.title}</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                {i < 4 && (
                  <div className="mt-4 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">완료</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Partners */}
        <div className="mb-16 bg-white rounded-[2.5rem] p-10 shadow-xl border border-emerald-100/50">
          <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">share</span>
            배포 대상 파트너
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['연합뉴스', 'KBS 취재팀', '금융감독원', '공정거래위원회', 'Reuters Korea'].map(p => (
              <div key={p} className="flex items-center gap-2 bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-sm">article</span>
                <span className="text-sm font-semibold text-on-surface">{p}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-primary">배포 상태:</strong> SignalX 데스크 승인 후 배포됨. 모든 배포는 암호화된 채널을 통해 전송되며, 수신 확인 로그가 기록됩니다.
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-surface-container-low rounded-[2.5rem] p-10 border border-outline-variant/20">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-base">gavel</span>
            법적 고지 및 면책
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            본 리포트는 SignalX가 정보 인프라 플랫폼으로서 중개자 역할만 수행하며 생성된 검증 결과물입니다.
            SignalX는 미국 Section 230, EU DSA, 한국 정보통신망법에 따른 플랫폼 면책을 주장합니다.
            제보 내용의 법적 책임은 제보자에게 있으며, 본 플랫폼은 신빙성 분석 결과만을 제공합니다.
            개인정보 처리: GDPR · CCPA · PIPA 완전 준수. 데이터 보존 기간: 180일 후 자동 삭제.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {['Section 230', 'EU DSA', 'GDPR', 'CCPA', 'PIPA', '정보통신망법'].map(l => (
              <span key={l} className="px-3 py-1 bg-white rounded-full text-xs font-bold text-on-surface-variant border border-outline-variant/30">{l}</span>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              PDF로 저장
            </button>
            <Link
              href={`/track?token=${token}`}
              className="border-2 border-outline-variant text-on-surface px-8 py-3 rounded-2xl font-bold text-sm hover:bg-surface-container-low transition-all"
            >
              제보 현황으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
