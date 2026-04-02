'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { DashboardStats, SignalFeedItem } from '@/types'
import { STAGE_LABELS, STATUS_LABELS, CATEGORY_LABELS } from '@/types'

// ── Mock data structure matching real API response ────────────────────────────
const MOCK_STATS: DashboardStats = {
  totalSignals:    2847,
  todaySignals:    24,
  verifiedRate:    98.4,
  pendingCount:    12,
  inProcessCount:  7,
  distributedCount: 2801,
  riskHotspots:    14,
  annEngineStatus: 'ACTIVE',
  annLatencyMs:    14,
}

const RISK_NODES = [
  { name: 'Seoul',     lat: 37.5,  lon: 127,   risk: 'CRITICAL',  type: '기업',  score: 91, change: '+340%' },
  { name: 'Moscow',    lat: 55.7,  lon: 37.6,  risk: 'CRITICAL',  type: '지정학', score: 89, change: '+280%' },
  { name: 'Beijing',   lat: 39.9,  lon: 116.4, risk: 'HIGH',      type: '기업',  score: 82, change: '+120%' },
  { name: 'Tokyo',     lat: 35.7,  lon: 139.7, risk: 'HIGH',      type: '금융',  score: 85, change: '+80%'  },
  { name: 'Singapore', lat: 1.3,   lon: 103.8, risk: 'HIGH',      type: '기술',  score: 67, change: '+45%'  },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [feed,  setFeed]  = useState<SignalFeedItem[]>([])
  const [time,  setTime]  = useState('')

  useEffect(() => {
    // Fetch real stats
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { if (d.totalSignals !== undefined) setStats(d) })
      .catch(() => {})

    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/api/admin/signals?limit=6')
      .then(r => r.json())
      .then(d => { if (d.signals) setFeed(d.signals) })
      .catch(() => {})
  }, [])

  const RISK_COLOR: Record<string, string> = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
    HIGH:     'text-amber-600 bg-amber-50 border-amber-200',
    ELEVATED: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    MONITOR:  'text-blue-600 bg-blue-50 border-blue-200',
    STABLE:   'text-primary bg-primary/5 border-primary/20',
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 card-shadow hover:card-shadow-md transition-shadow cursor-pointer group" onClick={() => {}}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">sensors</span>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              +{stats.todaySignals} 오늘
            </span>
          </div>
          <div className="text-3xl font-black text-on-surface tracking-tight">
            {stats.totalSignals.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">
            총 제보 수
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 card-shadow hover:card-shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-bold">실시간</span>
            </div>
          </div>
          <div className="text-3xl font-black text-primary tracking-tight">{stats.verifiedRate}%</div>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">검증률</div>
          <div className="mt-3 h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.verifiedRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 card-shadow hover:card-shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              위험
            </span>
          </div>
          <div className="text-3xl font-black text-on-surface tracking-tight">{stats.riskHotspots}</div>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">리스크 핫스팟</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 card-shadow hover:card-shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">psychology</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              stats.annEngineStatus === 'ACTIVE' ? 'text-primary bg-primary/10 border-primary/20' : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              {stats.annEngineStatus === 'ACTIVE' ? '정상' : '점검중'}
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface tracking-tight">ANN</div>
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">
            엔진 상태 · {stats.annLatencyMs}ms
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

        {/* Left: World Map Placeholder + Trend */}
        <div className="space-y-6">

          {/* Globe placeholder — Three.js will be mounted here */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow overflow-hidden">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-on-surface text-sm">글로벌 리스크 맵</h3>
                <p className="text-xs text-on-surface-variant">실시간 시그널 분포</p>
              </div>
              <Link href="/admin/map" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                전체화면
                <span className="material-symbols-outlined text-sm">open_in_full</span>
              </Link>
            </div>
            {/* Globe canvas — Three.js mounted via component */}
            <div className="relative h-72 bg-[#1a2e24] flex items-center justify-center">
              <div className="text-center text-white/40">
                <span className="material-symbols-outlined text-5xl mb-2 block">public</span>
                <p className="text-sm font-medium">리스크 맵 로딩 중...</p>
                <p className="text-xs mt-1">Three.js 지구본이 여기 마운트됩니다</p>
              </div>
              {/* Risk node indicators overlay */}
              <div className="absolute top-4 left-4">
                <div className="flex flex-col gap-2">
                  {[
                    { color: 'bg-red-500',    label: '위급 (2)' },
                    { color: 'bg-amber-500',  label: '고위험 (4)' },
                    { color: 'bg-yellow-500', label: '주의 (5)' },
                    { color: 'bg-primary',    label: '안정 (3)' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[10px] text-white/60 font-medium">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Trend */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-on-surface text-sm">7일 시그널 트렌드</h3>
                <p className="text-xs text-on-surface-variant">카테고리별 분포</p>
              </div>
              <div className="flex gap-3 text-[10px] text-on-surface-variant">
                {[{ color: 'bg-primary', label: '지정학' }, { color: 'bg-primary-container', label: '기업' }, { color: 'bg-amber-400', label: '금융' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-32">
              {[
                [40, 65, 30], [55, 50, 45], [80, 35, 60],
                [45, 75, 40], [70, 40, 85], [60, 90, 55], [95, 60, 75],
              ].map((bars, i) => (
                <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                  {bars.map((h, j) => (
                    <div
                      key={j}
                      className={`flex-1 rounded-t-sm transition-all ${j === 0 ? 'bg-primary/70' : j === 1 ? 'bg-primary-container/80' : 'bg-amber-400/70'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-on-surface-variant/60 font-mono">
              {['월', '화', '수', '목', '금', '토', '오늘'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">

          {/* Hotspot List */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="font-bold text-on-surface text-sm">리스크 핫스팟</h3>
              <Link href="/admin/map" className="text-xs font-bold text-primary">지도에서 보기</Link>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {RISK_NODES.map(node => (
                <div key={node.name} className="p-3 flex items-center gap-3 hover:bg-surface-container-low cursor-pointer transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-on-surface">{node.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${RISK_COLOR[node.risk]}`}>
                        {node.risk === 'CRITICAL' ? '위급' : node.risk === 'HIGH' ? '고위험' : '주의'}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant">{node.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-error">{node.change}</div>
                    <div className="text-[10px] text-on-surface-variant">{node.score}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Funnel */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow p-4">
            <h3 className="font-bold text-on-surface text-sm mb-4">검증 흐름</h3>
            <div className="space-y-3">
              {[
                { label: '제출됨', pct: 100 },
                { label: '1차 필터링', pct: 72 },
                { label: 'ANN 검증됨', pct: 58 },
                { label: '배포 완료', pct: 51 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <span className="font-bold text-on-surface">{row.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Signals */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 card-shadow">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <h3 className="font-bold text-on-surface text-sm">최신 시그널</h3>
              <Link href="/admin/signals" className="text-xs font-bold text-primary">전체 보기</Link>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {(feed.length > 0 ? feed : Array(4).fill(null)).map((s, i) => (
                <div key={i} className="p-3 flex items-start gap-3 hover:bg-surface-container-low cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-sm">sensors</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {s ? (
                      <>
                        <div className="text-xs font-bold text-on-surface truncate">{s.title}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                          {s.country} · {CATEGORY_LABELS[s.category as keyof typeof CATEGORY_LABELS]}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <div className="skeleton h-3 rounded w-3/4" />
                        <div className="skeleton h-2 rounded w-1/2" />
                      </div>
                    )}
                  </div>
                  {s && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${
                      s.status === 'VERIFIED' ? 'text-primary bg-primary/10 border-primary/20' :
                      s.status === 'UNDER_REVIEW' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                      'text-on-surface-variant bg-surface-container border-outline-variant/30'
                    }`}>
                      {STATUS_LABELS[s.status as keyof typeof STATUS_LABELS]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
