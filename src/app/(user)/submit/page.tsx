'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Category = 'POLITICS' | 'CORPORATE' | 'FINANCE' | 'TECHNOLOGY' | 'SOCIAL' | 'CRIME'
type Step = 1 | 2 | 3 | 4

const CATEGORIES: { value: Category; label: string; icon: string; labelEn: string }[] = [
  { value: 'POLITICS',    label: '정치',  icon: 'account_balance',  labelEn: 'Politics'    },
  { value: 'CORPORATE',   label: '기업',  icon: 'business_center',  labelEn: 'Corporate'   },
  { value: 'FINANCE',     label: '금융',  icon: 'payments',         labelEn: 'Finance'     },
  { value: 'TECHNOLOGY',  label: '기술',  icon: 'terminal',         labelEn: 'Technology'  },
  { value: 'SOCIAL',      label: '사회',  icon: 'groups',           labelEn: 'Social'      },
  { value: 'CRIME',       label: '범죄',  icon: 'gavel',            labelEn: 'Crime'       },
]

const STEPS = [
  { n: 1, label: '카테고리'    },
  { n: 2, label: '제보 내용'  },
  { n: 3, label: '증거 파일'  },
  { n: 4, label: '검토 및 제출' },
]

interface FormState {
  category:    Category | null
  country:     string
  title:       string
  content:     string
  files:       File[]
  agreed:      boolean
  notifyEmail: string   // 선택 — 미입력 시 완전 익명 유지
}

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep]    = useState<Step>(1)
  const [form, setForm]    = useState<FormState>({
    category: null, country: '', title: '', content: '', files: [], agreed: false, notifyEmail: '',
  })
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [token, setToken]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const canAdvance = () => {
    if (step === 1) return !!form.category
    if (step === 2) return form.country.trim().length >= 2 && form.title.trim().length >= 5 && form.content.trim().length >= 20
    if (step === 3) return true // files optional
    if (step === 4) return form.agreed
    return false
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    setForm(f => ({ ...f, files: [...f.files, ...dropped].slice(0, 5) }))
  }, [])

  const handleSubmit = async () => {
    if (!form.category || !canAdvance()) return
    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('category', form.category)
      fd.append('country',  form.country.trim())
      fd.append('title',    form.title.trim())
      fd.append('content',  form.content.trim())
      // 이메일은 선택 — 입력 시에만 자동 리턴 메일 발송
      if (form.notifyEmail.includes('@')) fd.append('notifyEmail', form.notifyEmail.trim())
      form.files.forEach(f => fd.append('files', f))

      const res = await fetch('/api/submit', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || '제출 중 오류가 발생했습니다.')
        return
      }
      setToken(data.trackingToken)
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-6 py-16">
        <div className="w-full max-w-lg text-center">
          <div className="w-24 h-24 hero-gradient rounded-full flex items-center justify-center mx-auto mb-8 soft-glow">
            <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface mb-3">제보가 접수되었습니다</h1>
          <p className="text-on-surface-variant text-lg mb-8">
            추적 토큰을 반드시 저장하세요. 이 코드로만 제보 진행 상황을 확인할 수 있습니다.
          </p>
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-100 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">
              추적 토큰 (Tracking Token)
            </p>
            <div className="token-display text-4xl font-black text-primary tracking-[0.2em] mb-6 select-all">
              {token}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(token).catch(() => {}) }}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              토큰 복사하기
            </button>
          </div>

          {/* Security pipeline confirmation */}
          <div className="bg-[#1a2e24] rounded-2xl p-5 mb-6 text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#69dbad] mb-3">
              보안 처리 진행 중
            </div>
            <div className="space-y-2">
              {[
                { icon: 'check_circle', label: 'AES-256 암호화 완료',         done: true  },
                { icon: 'sync',         label: 'Secure Vault 이동 중 (5초 내)', done: false },
                { icon: 'psychology',   label: 'ANN AI 검증 큐 등록됨',        done: true  },
                form.notifyEmail?.includes('@')
                  ? { icon: 'mail',   label: `접수 확인 메일 발송 중`,          done: false }
                  : { icon: 'person_off', label: '완전 익명 처리 중',           done: true  },
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-sm ${item.done ? 'text-[#3eb489]' : 'text-[#69dbad]'}`}
                    style={item.done ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {item.done ? 'check_circle' : item.icon}
                  </span>
                  <span className={`text-xs ${item.done ? 'text-white' : 'text-white/60'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/track?token=${token}`)}
              className="flex-1 hero-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              제보 현황 보기
            </button>
            <button
              onClick={() => { setToken(null); setForm({ category: null, country: '', title: '', content: '', files: [], agreed: false, notifyEmail: '' }); setStep(1) }}
              className="flex-1 border-2 border-outline-variant text-on-surface font-bold py-4 rounded-2xl hover:bg-surface-container-low transition-all"
            >
              새 제보하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-body text-on-surface" style={{ backgroundColor: '#f3fbf5' }}>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-emerald-50/80 backdrop-blur-xl shadow-sm shadow-emerald-900/5">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-800">signal_cellular_alt</span>
            <Link href="/" className="text-xl font-bold tracking-tighter text-emerald-900">SignalX</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">작동 방식</Link>
            <Link href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">법률</Link>
            <Link href="/submit" className="bg-primary text-white px-5 py-2 rounded-full font-semibold text-sm active:scale-95 transition-transform">
              새 제보
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 items-start">

          {/* Sidebar Progress */}
          <aside className="hidden lg:block sticky top-32 space-y-8">
            <div className="space-y-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1">
                제출 진행 현황
              </h3>
              <nav className="space-y-4">
                {STEPS.map(s => (
                  <div key={s.n} className={`flex items-center gap-4 ${s.n > step ? 'opacity-40' : ''}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                      s.n < step  ? 'bg-primary border-primary text-white' :
                      s.n === step ? 'border-primary text-primary bg-primary/5' :
                      'border-outline text-on-surface-variant'
                    }`}>
                      {s.n < step ? '✓' : s.n}
                    </div>
                    <span className={`text-sm ${s.n === step ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </nav>
            </div>
            {/* Live Security */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">실시간 보안</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-on-surface-variant">VPN 터널 활성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-on-surface-variant">AES-256 활성</span>
              </div>
            </div>
          </aside>

          {/* Main Form */}
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <section className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-on-surface">정보 제출</h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                아래 항목을 작성하여 익명 제보를 시작하세요.
              </p>
            </section>

            <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 overflow-hidden">
              <div className="p-8 md:p-14 space-y-12">

                {/* Step 1 — Category */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
                        01. 분류 카테고리
                      </label>
                      <span className="text-xs text-on-surface-variant italic">필수</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {CATEGORIES.map(cat => (
                        <label key={cat.value} className="relative cursor-pointer group">
                          <input
                            type="radio"
                            name="category"
                            value={cat.value}
                            checked={form.category === cat.value}
                            onChange={() => setForm(f => ({ ...f, category: cat.value }))}
                            className="peer sr-only"
                          />
                          <div className={`h-full px-4 py-5 border rounded-2xl text-center transition-all duration-300 hover:shadow-lg ${
                            form.category === cat.value
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-outline-variant/40 hover:shadow-primary/5'
                          }`}>
                            <span className={`material-symbols-outlined block mb-2 ${form.category === cat.value ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
                              {cat.icon}
                            </span>
                            <p className="font-bold text-sm">{cat.label}</p>
                            <p className={`text-xs mt-0.5 ${form.category === cat.value ? 'text-white/70' : 'text-on-surface-variant/60'}`}>
                              {cat.labelEn}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2 — Intel Details */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
                      02. 제보 상세 내용
                    </label>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="국가 / 지역 (예: 한국, 서울)"
                        value={form.country}
                        onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                        className="form-field"
                      />
                      <input
                        type="text"
                        placeholder="제보 제목 (예: A기업 회계 조작 내부 고발)"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="form-field"
                      />
                      <textarea
                        rows={8}
                        placeholder="제보 내용을 상세히 입력하세요. 언제, 어디서, 누가, 어떤 문제인지 구체적으로 작성할수록 검증 정확도가 높아집니다..."
                        value={form.content}
                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                        className="form-field resize-none"
                      />
                      <p className="text-xs text-on-surface-variant/60 text-right">
                        {form.content.length} / 50,000자
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3 — Evidence */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
                      03. 증거 파일 첨부 (선택)
                    </label>
                    <div
                      className={`relative group cursor-pointer transition-all duration-500 ${dragging ? 'scale-[1.01]' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                    >
                      <div className={`border-2 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center transition-all duration-500 ${
                        dragging ? 'border-primary bg-primary/5' : 'border-outline-variant/50 bg-white hover:bg-primary/5 hover:border-primary'
                      }`}>
                        <div className="bg-primary/10 p-6 rounded-full mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                          <span className="material-symbols-outlined text-primary text-4xl">upload_file</span>
                        </div>
                        <h4 className="text-2xl font-black text-on-surface mb-3">증거 파일을 여기에 드롭하세요</h4>
                        <p className="text-on-surface-variant/70 max-w-sm mb-8 leading-relaxed">
                          문서, 이미지, 영상 파일을 안전하게 업로드하세요.
                          수신 즉시 모든 메타데이터가 자동 삭제됩니다.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                            <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">메타데이터 삭제</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                            <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">종단간 암호화</span>
                          </div>
                        </div>
                      </div>
                      <input ref={fileRef} type="file" multiple className="hidden" onChange={e => {
                        const picked = Array.from(e.target.files || [])
                        setForm(f => ({ ...f, files: [...f.files, ...picked].slice(0, 5) }))
                      }} />
                    </div>
                    {form.files.length > 0 && (
                      <div className="space-y-2">
                        {form.files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-outline-variant/30">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-sm">description</span>
                              <span className="text-sm font-medium text-on-surface">{file.name}</span>
                              <span className="text-xs text-on-surface-variant/60">{(file.size / 1024).toFixed(0)}KB</span>
                            </div>
                            <button
                              onClick={() => setForm(f => ({ ...f, files: f.files.filter((_, j) => j !== i) }))}
                              className="text-outline hover:text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4 — Review */}
                {step === 4 && (
                  <div className="space-y-6 animate-fade-in-up">
                    <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
                      04. 검토 및 제출
                    </label>

                    {/* Summary */}
                    <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">카테고리</span>
                        <span className="font-bold text-on-surface">{CATEGORIES.find(c => c.value === form.category)?.label}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">국가</span>
                        <span className="font-bold text-on-surface">{form.country}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">제목</span>
                        <span className="font-bold text-on-surface max-w-xs text-right">{form.title}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">내용</span>
                        <span className="font-bold text-on-surface">{form.content.length}자</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">첨부 파일</span>
                        <span className="font-bold text-on-surface">{form.files.length}개</span>
                      </div>
                    </div>

                    {/* Security Pipeline Status */}
                    <div className="bg-[#1a2e24] rounded-2xl p-5 text-white">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#69dbad] mb-4">
                        제출 후 자동 실행 보안 프로세스
                      </div>
                      <div className="space-y-3">
                        {[
                          { icon: 'lock',           label: 'AES-256-GCM 암호화',              sub: '전송 전 클라이언트 암호화'       },
                          { icon: 'cloud_sync',     label: '내부 Secure Vault 이동',          sub: '접수 후 5초 이내 자동 격리'      },
                          { icon: 'delete_sweep',   label: '외부 DB 원본 자동 삭제',          sub: 'Vault 이동 확인 후 즉시 삭제'    },
                          { icon: 'verified',       label: 'SHA-256 무결성 검증',             sub: '이동 전후 해시 비교'             },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[#69dbad] text-sm">{item.icon}</span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{item.label}</div>
                              <div className="text-[10px] text-white/50">{item.sub}</div>
                            </div>
                            <div className="ml-auto">
                              <span className="text-[10px] text-[#3eb489] font-bold">자동 실행</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optional Email — 완전 익명 유지 강조 */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">mail_outline</span>
                        접수 확인 이메일 (선택 · 완전 익명 유지 가능)
                      </label>
                      <input
                        type="email"
                        placeholder="입력하지 않으면 완전 익명 유지됩니다"
                        value={form.notifyEmail}
                        onChange={e => setForm(f => ({ ...f, notifyEmail: e.target.value }))}
                        className="form-field"
                      />
                      <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5 flex-shrink-0">shield</span>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          이메일을 입력하면 <strong>접수 확인 + 추적 토큰</strong>을 즉시 발송합니다.
                          이메일 주소는 저장되지 않으며 <strong>HMAC-SHA256 해시로만 감사 기록</strong>됩니다.
                          입력하지 않아도 완전히 익명으로 제보가 접수됩니다.
                        </p>
                      </div>
                    </div>

                    {/* Agreement */}
                    <label className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.agreed}
                        onChange={e => setForm(f => ({ ...f, agreed: e.target.checked }))}
                        className="mt-1 accent-primary w-5 h-5 cursor-pointer"
                      />
                      <span className="text-sm text-on-surface-variant leading-relaxed">
                        이 정보가 사실임을 확인합니다. SignalX 내부고발자 보호 정책에 동의하며,
                        허위 제보에 대한 법적 책임이 제보자에게 있음을 이해합니다.
                        플랫폼은 중개자 역할만 수행합니다 (Section 230, EU DSA, 정보통신망법).
                      </span>
                    </label>

                    {error && (
                      <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-medium">
                        {error}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Action Bar */}
              <div className="px-8 md:px-14 py-8 bg-surface-container border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 text-on-surface-variant/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">verified_user</span>
                    <span className="text-[11px] font-bold uppercase tracking-tight">제로 로그 라우팅</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">history</span>
                    <span className="text-[11px] font-bold uppercase tracking-tight">임시 ID 생성됨</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(s => (s - 1) as Step)}
                      className="flex-1 md:flex-none px-8 py-4 text-on-surface-variant font-bold text-sm hover:text-on-surface transition-colors"
                      type="button"
                    >
                      이전
                    </button>
                  )}
                  <Link href="/" className="flex-1 md:flex-none px-8 py-4 text-on-surface-variant font-bold text-sm hover:text-on-surface transition-colors">
                    취소
                  </Link>
                  {step < 4 ? (
                    <button
                      onClick={() => setStep(s => (s + 1) as Step)}
                      disabled={!canAdvance()}
                      className="flex-1 md:flex-none bg-primary text-white px-10 py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      다음 단계
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canAdvance() || loading}
                      className="flex-1 md:flex-none bg-primary text-white px-10 py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          전송 중...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">lock</span>
                          보안 제보 제출
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-on-surface-variant/50 text-xs italic">
                "진실은 당신을 자유롭게 할 것입니다. 그러나 먼저 불편하게 만들 것입니다." — SignalX 윤리위원회
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 pt-3 z-50 bg-emerald-50/80 backdrop-blur-xl border-t border-emerald-100 rounded-t-3xl">
        <Link href="/"       className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">home</span><span className="text-[10px] font-bold">홈</span></Link>
        <Link href="/submit" className="flex flex-col items-center text-primary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span><span className="text-[10px] font-bold">제보</span></Link>
        <Link href="/track"  className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">manage_search</span><span className="text-[10px] font-bold">확인</span></Link>
        <Link href="#"       className="flex flex-col items-center opacity-60"><span className="material-symbols-outlined">settings</span><span className="text-[10px] font-bold">설정</span></Link>
      </nav>
    </div>
  )
}
