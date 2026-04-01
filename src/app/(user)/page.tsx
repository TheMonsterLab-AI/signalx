'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="font-body text-on-surface" style={{ backgroundColor: '#f3fbf5', minHeight: '100dvh' }}>

      {/* ── TopAppBar ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-emerald-50/90 backdrop-blur-xl border-b border-emerald-900/5">
        <div className="flex justify-between items-center px-8 py-5 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-800 text-3xl">signal_cellular_alt</span>
            <span className="text-2xl font-bold tracking-tighter text-emerald-900">SignalX</span>
          </div>
          <nav className="hidden md:flex gap-10 items-center">
            <a className="text-emerald-900 font-bold hover:text-primary transition-colors" href="#">홈</a>
            <a className="text-on-surface-variant/70 hover:text-on-surface-variant transition-colors" href="#">시그널</a>
            <a className="text-on-surface-variant/70 hover:text-on-surface-variant transition-colors" href="#">글로벌 맵</a>
            <a className="text-on-surface-variant/70 hover:text-on-surface-variant transition-colors" href="#">소개</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/track" className="hidden lg:block text-on-surface-variant font-semibold px-4 py-2 hover:text-on-surface transition-colors">
              제보 확인
            </Link>
            <Link
              href="/submit"
              className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-white font-bold px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-md"
            >
              지금 제보하기
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-40">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/20 text-primary font-bold rounded-full text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                보안 암호화 채널 활성
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-on-background leading-[1]">
                전 세계 어디서나<br />
                <span className="text-primary">안전하게</span> 제보하세요.
              </h1>
              <p className="text-xl md:text-2xl text-on-surface-variant font-medium max-w-xl leading-relaxed">
                세계에서 가장 진보된 익명 제보 플랫폼. AI 검증과 제로-놀리지 프라이버시 프로토콜로 구동됩니다.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/submit"
                className="hero-gradient px-10 py-5 rounded-full text-white font-bold text-xl active:scale-95 transition-transform shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
              >
                제보 시작하기
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                href="/track"
                className="border-2 border-outline-variant text-on-surface px-10 py-5 rounded-full font-bold text-xl active:scale-95 transition-transform hover:bg-surface-container-low text-center"
              >
                제보 현황 확인
              </Link>
            </div>
            <div className="pt-4 flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-background">1.2M+</span>
                <span className="text-sm text-on-surface-variant font-semibold uppercase tracking-wider">제보 건수</span>
              </div>
              <div className="w-px h-10 bg-outline-variant/30" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-background">100%</span>
                <span className="text-sm text-on-surface-variant font-semibold uppercase tracking-wider">익명 보장</span>
              </div>
              <div className="w-px h-10 bg-outline-variant/30" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-on-background">98.4%</span>
                <span className="text-sm text-on-surface-variant font-semibold uppercase tracking-wider">검증률</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex justify-center lg:justify-end items-center relative">
            <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
              <div className="absolute inset-0 border border-primary/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />
              <div className="absolute inset-10 border border-primary/10 rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
              <div className="absolute inset-20 border border-primary/20 rounded-full animate-[pulse_8s_ease-in-out_infinite]" />
              <div className="relative z-10 w-80 h-80 bg-surface-container-highest rounded-[4rem] flex items-center justify-center shadow-2xl rotate-12 overflow-hidden border border-white/50">
                <div className="w-64 h-64 hero-gradient rounded-full flex items-center justify-center soft-glow">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '9rem', fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute top-10 right-0 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100/50 flex items-center gap-3 animate-bounce">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">암호화</p>
                  <p className="text-sm font-black">AES-256 활성</p>
                </div>
              </div>
              <div className="absolute bottom-20 left-0 bg-white p-4 rounded-2xl shadow-xl border border-emerald-100/50 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-tighter">검증</p>
                  <p className="text-sm font-black">AI 검증됨</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Bento ────────────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-8 lg:px-16 mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Feature 1 — Total Anonymity */}
            <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-10 shadow-xl border border-emerald-100/50 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_off</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-on-surface mb-4">완전한 익명성</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  IP 비기록, AES-256 암호화, EXIF 자동 제거. 신분 노출 위험 없이 안전하게 제보하세요.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <span className="px-4 py-2 bg-primary/5 text-primary font-bold text-sm rounded-full border border-primary/10">AES-256 암호화</span>
                <span className="px-4 py-2 bg-primary/5 text-primary font-bold text-sm rounded-full border border-primary/10">IP 미기록</span>
                <span className="px-4 py-2 bg-primary/5 text-primary font-bold text-sm rounded-full border border-primary/10">EXIF 제거</span>
              </div>
            </div>

            {/* Feature 2 — Legal Shield */}
            <div className="lg:col-span-7 bg-primary rounded-[2.5rem] p-10 text-white flex flex-col justify-between min-h-[360px]" style={{ background: 'linear-gradient(135deg, #006c4d 0%, #3eb489 100%)' }}>
              <div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4">법적 방패</h3>
                <p className="text-white/80 text-lg leading-relaxed max-w-lg">
                  한국 공익신고자 보호법, EU Whistleblower Directive, 미국 WPA 완전 준수.
                  GDPR · CCPA · PIPA 글로벌 개인정보 보호 규정 적용.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <span className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-full border border-white/20">EU DSA</span>
                <span className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-full border border-white/20">Section 230</span>
                <span className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-full border border-white/20">GDPR</span>
                <span className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-full border border-white/20">PIPA</span>
              </div>
            </div>

            {/* Feature 3 — ANN Verification */}
            <div className="lg:col-span-7 bg-surface-container-low rounded-[2.5rem] p-10 border border-outline-variant/20 flex flex-col min-h-[360px]">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <h3 className="text-3xl font-black tracking-tight text-on-surface mb-4">AI 시그널 검증</h3>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                GPT · Claude · Gemini · Llama 4개 AI가 7단계로 교차 검증합니다.
                텍스트 · 이미지 · 영상 딥페이크까지 분석하는 특허 출원 중 팩트체크 엔진.
              </p>
              <div className="grid grid-cols-4 gap-3 mt-auto">
                {['GPT-4o', 'Claude', 'Gemini', 'Llama'].map(ai => (
                  <div key={ai} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-emerald-100/50">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                    </div>
                    <p className="text-xs font-bold text-on-surface">{ai}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 4 — Distribution */}
            <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-10 shadow-xl border border-emerald-100/50 flex flex-col justify-between min-h-[360px]">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-on-surface mb-4">원스톱 배포</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  검증 완료 즉시 해당 국가 파트너 미디어 · 기관 · 정부에 자동 배포됩니다.
                </p>
              </div>
              <div className="mt-8 space-y-3">
                {['언론사 파트너', '정부 기관', '규제 기관'].map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-on-surface-variant">{p}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="max-w-[1440px] mx-auto px-8 lg:px-16 mt-32">
          <div className="hero-gradient rounded-[3rem] p-16 text-white text-center">
            <h2 className="text-5xl font-black tracking-tight mb-6">지금 바로 제보하세요</h2>
            <p className="text-white/80 text-xl mb-10 max-w-2xl mx-auto">
              당신의 제보가 세상을 바꿉니다. 완전한 익명성과 법적 보호 하에 안전하게 제보하세요.
            </p>
            <div className="flex gap-6 justify-center">
              <Link
                href="/submit"
                className="bg-white text-primary font-bold px-10 py-5 rounded-full text-xl hover:bg-surface-container-low transition-all active:scale-95 shadow-xl"
              >
                익명 제보 시작
              </Link>
              <Link
                href="/track"
                className="border-2 border-white/30 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-white/10 transition-all active:scale-95"
              >
                제보 현황 확인
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-on-surface text-white py-16">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary-fixed-dim text-2xl">signal_cellular_alt</span>
                <span className="text-xl font-bold tracking-tighter">SignalX</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                세계 최초 제보·검증·배포 통합 플랫폼.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">플랫폼</h4>
              <ul className="space-y-3">
                {['제보하기', '제보 확인', '작동 방식', '보안'].map(l => (
                  <li key={l}><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">법률</h4>
              <ul className="space-y-3">
                {['개인정보처리방침', '서비스 약관', '면책 조항', '내부고발자 보호'].map(l => (
                  <li key={l}><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">보안 상태</h4>
              <div className="space-y-3">
                {[
                  { label: 'AES-256 암호화', status: '활성' },
                  { label: 'IP 로깅', status: '비활성' },
                  { label: 'ANN 엔진', status: '운영중' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">{s.label}</span>
                    <span className="text-primary-fixed-dim text-xs font-bold">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs">© 2025 SignalX. All rights reserved. Danny Park (박 대니)</p>
            <p className="text-white/30 text-xs">annglobal.us · manager@ainewsnetwork.io</p>
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 pt-3 z-50 bg-emerald-50/90 backdrop-blur-xl border-t border-emerald-100 rounded-t-3xl">
        <Link href="/" className="flex flex-col items-center text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-bold">홈</span>
        </Link>
        <Link href="/submit" className="flex flex-col items-center opacity-60">
          <span className="material-symbols-outlined">sensors</span>
          <span className="text-[10px] font-bold">제보</span>
        </Link>
        <Link href="/track" className="flex flex-col items-center opacity-60">
          <span className="material-symbols-outlined">manage_search</span>
          <span className="text-[10px] font-bold">확인</span>
        </Link>
        <Link href="/about" className="flex flex-col items-center opacity-60">
          <span className="material-symbols-outlined">info</span>
          <span className="text-[10px] font-bold">소개</span>
        </Link>
      </nav>
    </div>
  )
}
