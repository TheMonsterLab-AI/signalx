'use client'

import Link from 'next/link'

const TEAM = [
  { name:'Danny Park', role:'Co-Founder & CEO',           initials:'D' },
  { name:'AI Ethics',  role:'Data Science',               initials:'A' },
  { name:'Legal',      role:'International Law',          initials:'L' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF6F0' }}>

      {/* ── Section 1: 히어로 ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase mb-6"
              style={{ background:'rgba(0,108,77,.1)', color:'#006c4d' }}>
              THE VERDANT SANCTUARY
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-emerald-950 mb-6 leading-tight"
              style={{ fontFamily:"'Georgia', serif" }}>
              시그널X는<br/>무엇인가?
            </h1>
            <p className="text-base text-emerald-900/60 leading-relaxed max-w-lg">
              우리는 진실이 침묵하지 않는 세상을 만듭니다. SignalX는 기술의 힘을 빌려 정보 제공자의 익명성을 성역처럼 보호하고, 데이터의 무결성을 검증하여 사회의 투명성을 회복하는 독립 플랫폼입니다.
            </p>
          </div>

          {/* 우측 비주얼 */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden aspect-[4/3]"
              style={{ background: 'linear-gradient(135deg, #0a1f15, #006c4d, #1a3d2b)' }}>
              <div className="w-full h-full flex items-center justify-center relative">
                {/* 동심원 애니메이션 */}
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="absolute rounded-full border border-emerald-400/20"
                    style={{
                      width:  `${i * 80}px`,
                      height: `${i * 80}px`,
                      animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }} />
                ))}
                <div className="w-16 h-16 rounded-full bg-emerald-400/20 backdrop-blur-sm flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-emerald-300 text-3xl"
                    style={{ fontVariationSettings:"'FILL' 1" }}>
                    security
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: 3대 원칙 ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-black text-emerald-950 tracking-tight mb-10"
          style={{ fontFamily:"'Georgia', serif" }}>
          우리의 3대 원칙
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* 1. 완전 익명 보장 */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-7">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>fingerprint</span>
            </div>
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">1.</div>
            <h3 className="text-xl font-black text-emerald-950 mb-3 tracking-tight">완전 익명 보장</h3>
            <p className="text-sm text-emerald-900/55 leading-relaxed mb-5">
              제로 날리지 증명(Zero-Knowledge Proof) 기술을 사용하며, 플랫폼조차 제보자의 신원을 알 수 없습니다. 당신의 정체는 오직 진실로만 기억됩니다.
            </p>
            <div className="space-y-2">
              {['IP 미기록 · 쿠키 없음', 'AES-256-GCM 암호화', 'SecureDrop 원칙 준수'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* 2. 철저한 팩트체크 */}
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-7">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>verified_user</span>
            </div>
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">2.</div>
            <h3 className="text-xl font-black text-emerald-950 mb-3 tracking-tight">철저한 팩트체크</h3>
            <p className="text-sm text-emerald-900/55 leading-relaxed mb-5">
              제보된 내용은 GPT, Claude, Gemini, Llama 등 최정상 AI 모델들을 통해 교차 검증됩니다. '인간의 판별성을 제거하고 순수한 팩트만 검증합니다.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['GPT-4o Verified', 'Claude 3.5', 'Gemini 1.5', 'Llama 3.1'].map(m => (
                <div key={m} className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* 3. 원스톱 배포 */}
          <div className="bg-emerald-900/8 rounded-3xl border border-emerald-200 shadow-sm p-7">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>share</span>
            </div>
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">3. 원스톰 배포</div>
            <p className="text-sm text-emerald-900/60 leading-relaxed">
              검증이 완료된 리포트는 전 세계 언론사, 법률 단체 및 공공 기관에 배포됩니다. 가장 효과적인 진실의 가장 효율적인 경로를 통해 사회에 전달되도록 지원됩니다.
            </p>
            <div className="mt-5 pt-4 border-t border-emerald-200">
              <div className="text-[11px] text-emerald-700/60 font-bold">
                ⚠️ SignalX 데스크의 최종 승인 후 배포됩니다
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: ANN 리포트 미리보기 ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">ANN Report Preview</div>
            <h2 className="text-3xl font-black text-emerald-950 tracking-tight mb-5"
              style={{ fontFamily:"'Georgia', serif" }}>
              ANN 리포트 미리보기
            </h2>
            <p className="text-sm text-emerald-900/60 leading-relaxed mb-6">
              SignalX의 'Anonymous Network Node' 리포트는 제보 시작 단계에서부터 검증 결과를 한눈에 보여줍니다. 모든 리포트는 블록체인에 기록되어 사후 조작 및 검증이 가능합니다.
            </p>
            <div className="space-y-3">
              {[
                '데이터의 무결성 100% 보증',
                '관련데이터의 완전 익명 처리',
                '다국어 자동 현지화 제공',
              ].map(t => (
                <div key={t} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>check</span>
                  </div>
                  <span className="text-sm text-emerald-900/70">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 리포트 목업 */}
          <div className="relative">
            <div className="rounded-3xl border border-emerald-200 shadow-xl overflow-hidden bg-white">
              {/* 목업 헤더 */}
              <div className="bg-emerald-900 px-5 py-3 flex items-center gap-2">
                {['#e06c75','#f4c542','#3eb489'].map(c => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
                <span className="text-white/40 text-xs ml-2 font-mono">REPORT-ID: SX-002-A29B</span>
              </div>
              {/* 목업 컨텐츠 */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-black text-emerald-950">Signal Overview</div>
                  <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">VERIFIED</div>
                </div>
                {/* 차트 시뮬레이션 */}
                <div className="flex items-end gap-1 h-20">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{ height:`${h}%`, background:`rgba(0,108,77,${0.3 + h/200})` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { l:'ANN 점수', v:'91/100' },
                    { l:'검증 단계', v:'7/7' },
                    { l:'신뢰 등급', v:'A+' },
                  ].map(s => (
                    <div key={s.l} className="bg-emerald-50 rounded-xl p-2.5 text-center">
                      <div className="text-xs font-black text-primary">{s.v}</div>
                      <div className="text-[9px] text-emerald-600/50 mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* 더미 행들 */}
                {[80, 60, 45].map((w, i) => (
                  <div key={i} className="h-2 bg-emerald-50 rounded-full" style={{ width:`${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: 법적 보호 ─────────────────────────────────────────── */}
      <section id="legal" className="px-6 mb-24">
        <div className="max-w-4xl mx-auto rounded-3xl p-12 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #0a1f15, #006c4d)' }}>
          <h2 className="text-4xl font-black tracking-tight mb-5"
            style={{ fontFamily:"'Georgia', serif" }}>
            법적 보호 및 신뢰<br/>
            <span className="text-emerald-300">(Safe Harbor)</span>
          </h2>
          <p className="text-white/65 text-sm leading-relaxed max-w-2xl mx-auto mb-8">
            SignalX는 제보자 보호를 위한 국제 표준을 준수하며, 다국적 법을 자문단과 협력하여 귀하의 제보가 법적으로 보호받을 수 있는 환경을 구축합니다. 우리는 어떤 정부나 기업의 압력에도 굴복하지 않습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['ISO/IEC 27001 Certified', 'GDPR Compliant', 'Blockchain Verified'].map(b => (
              <span key={b} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-bold text-white/90 backdrop-blur-sm">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: 팀 + FAQ ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* 팀 */}
          <div>
            <h2 className="text-2xl font-black text-emerald-950 tracking-tight mb-2"
              style={{ fontFamily:"'Georgia', serif" }}>
              The Core Team
            </h2>
            <p className="text-sm text-emerald-900/55 mb-6">
              전 세계 저널리스트, 데이터 과학자, 안전 변호사들이 SignalX를 이끌고 있습니다. 우리는 기술이 세계를 더 투명하게 수 있다고 믿습니다.
            </p>
            <div className="flex items-center gap-3">
              {TEAM.map(m => (
                <div key={m.initials}
                  className="w-12 h-12 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-primary font-black shadow-sm"
                  title={`${m.name} · ${m.role}`}>
                  {m.initials}
                </div>
              ))}
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600 text-xs font-bold shadow-sm">
                +12
              </div>
            </div>
          </div>

          {/* FAQ 바로가기 */}
          <div id="contact" className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">STILL HAVE QUESTIONS?</div>
              <h3 className="text-xl font-black text-emerald-950 tracking-tight mb-4">
                자주 묻는 질문(FAQ) 확인하기
              </h3>
              <div className="space-y-3 text-sm text-emerald-900/60">
                {[
                  '제보 내용이 노출될 수 있나요?',
                  '추적 토큰을 잃어버리면?',
                  'ANN 검증에 얼마나 걸리나요?',
                ].map(q => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="text-primary font-bold">Q.</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
            <Link href="/about/faq"
              className="mt-6 flex items-center justify-between px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors group">
              자주 묻는 질문(FAQ) 확인하기
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 푸터 ─────────────────────────────────────────────────────── */}
      <footer id="privacy" className="border-t border-emerald-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-black text-emerald-900 text-sm">SignalX</div>
          <div className="flex gap-6 text-[11px] text-emerald-900/40">
            <span className="cursor-pointer hover:text-emerald-700">Legal Disclaimers</span>
            <span className="cursor-pointer hover:text-emerald-700">Privacy Policy</span>
            <span className="cursor-pointer hover:text-emerald-700">Contact Support</span>
          </div>
          <div className="text-[11px] text-emerald-900/30">© 2024 SignalX. All rights reserved. Anonymity Guaranteed.</div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
