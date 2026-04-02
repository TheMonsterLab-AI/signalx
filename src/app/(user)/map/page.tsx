'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-emerald-900/20 rounded-3xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-primary/60 text-sm">지구본 로딩 중...</span>
      </div>
    </div>
  ),
})

// 익명화된 공개 집계 데이터만 사용
const SIGNAL_NODES = [
  { id:'kr', country:'한국',     lat:37.5,   lng:127.0,  risk:'CRITICAL', count:14, cats:'Corporate/Finance',   summary:'Corporate/Finance signals surging'    },
  { id:'ru', country:'러시아',   lat:55.7,   lng:37.6,   risk:'CRITICAL', count:11, cats:'Geopolitical',         summary:'Geopolitical signals surging'         },
  { id:'cn', country:'중국',     lat:39.9,   lng:116.4,  risk:'HIGH',     count:8,  cats:'Corporate/Tech',       summary:'Corporate/Tech signals elevated'      },
  { id:'in', country:'인도',     lat:19.1,   lng:72.9,   risk:'HIGH',     count:7,  cats:'Finance/Corporate',    summary:'Finance signals increasing'           },
  { id:'tr', country:'터키',     lat:41.0,   lng:28.9,   risk:'HIGH',     count:6,  cats:'Political',            summary:'Political signals detected'           },
  { id:'jp', country:'일본',     lat:35.7,   lng:139.7,  risk:'HIGH',     count:6,  cats:'Finance',              summary:'Finance signals elevated'             },
  { id:'id', country:'인도네시아',lat:-6.2,  lng:106.8,  risk:'HIGH',     count:5,  cats:'Crime/Corporate',      summary:'Crime-related signals detected'       },
  { id:'ae', country:'UAE',      lat:25.2,   lng:55.3,   risk:'HIGH',     count:4,  cats:'Finance',              summary:'Finance signals detected'             },
  { id:'ng', country:'나이지리아',lat:6.5,   lng:3.4,    risk:'HIGH',     count:5,  cats:'Crime',                summary:'Crime signals increasing'             },
  { id:'br', country:'브라질',   lat:-23.5,  lng:-46.6,  risk:'CAUTION',  count:4,  cats:'Corporate',            summary:'Corporate signals moderate'           },
  { id:'fr', country:'프랑스',   lat:48.8,   lng:2.3,    risk:'CAUTION',  count:3,  cats:'Political',            summary:'Political signals moderate'           },
  { id:'gb', country:'영국',     lat:51.5,   lng:-0.1,   risk:'CAUTION',  count:3,  cats:'Finance',              summary:'Finance signals stable'               },
  { id:'eg', country:'이집트',   lat:30.0,   lng:31.2,   risk:'CAUTION',  count:3,  cats:'Political',            summary:'Political signals moderate'           },
  { id:'mx', country:'멕시코',   lat:19.4,   lng:-99.1,  risk:'CAUTION',  count:4,  cats:'Crime/Corporate',      summary:'Mixed signals detected'               },
  { id:'us', country:'미국',     lat:40.7,   lng:-74.0,  risk:'LOW',      count:2,  cats:'Corporate',            summary:'Low signal activity'                  },
  { id:'de', country:'독일',     lat:52.5,   lng:13.4,   risk:'LOW',      count:1,  cats:'Political',            summary:'Stable, low signal activity'          },
  { id:'au', country:'호주',     lat:-33.9,  lng:151.2,  risk:'LOW',      count:1,  cats:'Finance',              summary:'Stable, low signal activity'          },
]

const COLOR: Record<string, string> = {
  CRITICAL: '#E06C75',
  HIGH:     '#F4C542',
  CAUTION:  '#8ecda8',
  LOW:      '#3EB489',
}
const RISK_KO: Record<string, string> = {
  CRITICAL:'Critical', HIGH:'High Risk', CAUTION:'Caution', LOW:'Stable',
}

export default function PublicMapPage() {
  const globeRef   = useRef<any>(null)
  const [hovered,  setHovered]  = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [tick,     setTick]     = useState(0)
  const [liveIdx,  setLiveIdx]  = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80)
    return () => clearInterval(id)
  }, [])

  // 라이브 인사이트 순환
  const criticalNodes = SIGNAL_NODES.filter(n => n.risk === 'CRITICAL' || n.risk === 'HIGH')
  useEffect(() => {
    const id = setInterval(() => setLiveIdx(i => (i + 1) % criticalNodes.length), 4000)
    return () => clearInterval(id)
  }, [])

  const liveNode = criticalNodes[liveIdx]

  const alt    = (n: any) => Math.max(0.04, (n.count / 15) * 0.3)
  const radius = (n: any) => {
    const base = 0.3 + (n.count / 15) * 0.55
    if (n.risk === 'CRITICAL') return base + Math.sin(tick * 0.18) * 0.1
    return base
  }

  const counts = {
    critical: SIGNAL_NODES.filter(n => n.risk === 'CRITICAL').length,
    high:     SIGNAL_NODES.filter(n => n.risk === 'HIGH').length,
    caution:  SIGNAL_NODES.filter(n => n.risk === 'CAUTION').length,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF6F0' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

          {/* ── 왼쪽 사이드바 ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* 제목 */}
            <div>
              <h1 className="text-3xl font-black text-emerald-950 tracking-tight leading-tight mb-3"
                style={{ fontFamily:"'Georgia', serif" }}>
                Global Signal<br/>Landscape
              </h1>
              <p className="text-sm text-emerald-900/55 leading-relaxed">
                Real-time visualization of anonymous corporate and financial integrity signals detected across the globe.
              </p>
            </div>

            {/* 리스크 레벨 */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-emerald-50">
                <div className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">RISK LEVELS</div>
              </div>
              {[
                { risk:'CRITICAL', label:'Critical',  range:'9+ Signals',  count: counts.critical },
                { risk:'HIGH',     label:'High Risk', range:'4-8 Signals', count: counts.high     },
                { risk:'CAUTION',  label:'Caution',   range:'1-3 Signals', count: counts.caution  },
              ].map(r => (
                <div key={r.risk}
                  className={`flex items-center justify-between px-5 py-4 border-b border-emerald-50 last:border-0 cursor-pointer hover:bg-emerald-50/50 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: COLOR[r.risk], boxShadow: r.risk === 'CRITICAL' ? `0 0 8px ${COLOR[r.risk]}80` : 'none' }} />
                    <span className="font-semibold text-emerald-900 text-sm">{r.label}</span>
                  </div>
                  <span className="text-xs text-emerald-600/50 font-medium">{r.range}</span>
                </div>
              ))}
            </div>

            {/* 라이브 인사이트 */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">LIVE INSIGHT</span>
              </div>
              <p className="text-sm font-semibold text-emerald-900 leading-relaxed transition-all">
                {liveNode ? `${liveNode.country} - ${liveNode.summary}` : 'Monitoring global signals...'}
              </p>
            </div>

            {/* 선택된 국가 상세 */}
            {selected && (
              <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR[selected.risk] }} />
                    <span className="font-bold text-emerald-950">{selected.country}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-emerald-400 hover:text-emerald-600">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-700/60 mb-3">{selected.summary}</p>
                <div className="text-[11px] text-emerald-600/50">{selected.cats}</div>
              </div>
            )}

            {/* CTA 카드 */}
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1a3d2b, #006c4d)' }}>
              <p className="font-black text-xl leading-tight mb-4">
                Protect your community through anonymity.
              </p>
              <Link href="/submit"
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-emerald-900 font-bold text-sm rounded-xl hover:bg-emerald-50 active:scale-95 transition-all">
                이 지역에 제보하기 →
              </Link>
            </div>
          </div>

          {/* ── 오른쪽 지구본 ─────────────────────────────────────────── */}
          <div className="relative rounded-3xl overflow-hidden bg-emerald-900/10 border border-emerald-200/60 shadow-xl"
            style={{ height: '600px' }}>
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(238,246,240,0.05)"
              atmosphereColor="#3EB489"
              atmosphereAltitude={0.12}
              animateIn

              pointsData={SIGNAL_NODES}
              pointLat="lat"
              pointLng="lng"
              pointColor={(n: any) => COLOR[n.risk]}
              pointAltitude={(n: any) => alt(n)}
              pointRadius={(n: any) => radius(n)}
              pointResolution={12}

              ringsData={SIGNAL_NODES.filter((n: any) => n.risk === 'CRITICAL')}
              ringLat="lat"
              ringLng="lng"
              ringColor={(_: any) => (t: number) => `rgba(224,108,117,${(1-t)*0.6})`}
              ringMaxRadius={4}
              ringPropagationSpeed={2}
              ringRepeatPeriod={800}

              onPointHover={(pt: any) => setHovered(pt)}
              onPointClick={(pt: any) => setSelected(selected?.id === pt?.id ? null : pt)}

              rotationSpeed={0.5}
              enablePointerInteraction
            />

            {/* 호버 툴팁 */}
            {hovered && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl border border-emerald-100 text-sm font-semibold text-emerald-900">
                  {hovered.country} — {hovered.summary}
                </div>
              </div>
            )}

            {/* 익명화 안내 */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="bg-white/80 backdrop-blur-md rounded-xl px-4 py-2.5 text-xs text-emerald-900/60 italic">
                &ldquo;This map is based on real-time anonymous data. Actual content is strictly anonymized.&rdquo;
              </div>
            </div>

            {/* 줌 컨트롤 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
              {[
                { icon:'add',            action: () => {} },
                { icon:'remove',         action: () => {} },
                { icon:'my_location',    action: () => globeRef.current?.pointOfView({ lat:20, lng:30, altitude:2.5 }, 800) },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="w-10 h-10 bg-white/90 backdrop-blur-md border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-sm">{btn.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-emerald-100 bg-white/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-black text-emerald-900 text-sm">SignalX</div>
          <div className="flex gap-6 text-[11px] text-emerald-900/40">
            <Link href="/about#legal" className="hover:text-emerald-700">Legal Disclaimers</Link>
            <Link href="/about#privacy" className="hover:text-emerald-700">Privacy Policy</Link>
            <Link href="/about#contact" className="hover:text-emerald-700">Contact Support</Link>
          </div>
          <div className="text-[11px] text-emerald-900/30">© 2024 SignalX. All rights reserved. Anonymity Guaranteed.</div>
        </div>
      </footer>
    </div>
  )
}
