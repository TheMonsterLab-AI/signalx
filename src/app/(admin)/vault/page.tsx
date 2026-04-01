'use client'

import { useState, useEffect, useRef } from 'react'

const STATUS_STYLE: Record<string, string> = {
  VERIFIED:         'text-primary bg-primary/10 border-primary/20',
  TRANSFERRED:      'text-emerald-600 bg-emerald-50 border-emerald-200',
  TRANSFERRING:     'text-blue-600 bg-blue-50 border-blue-200',
  PENDING:          'text-amber-600 bg-amber-50 border-amber-200',
  DELETED_EXTERNAL: 'text-purple-600 bg-purple-50 border-purple-200',
  FAILED:           'text-red-600 bg-red-50 border-red-200',
}
const STATUS_KO: Record<string, string> = {
  VERIFIED:         '무결성 검증됨',
  TRANSFERRED:      '이동 완료',
  TRANSFERRING:     '이동 중',
  PENDING:          '대기 중',
  DELETED_EXTERNAL: '외부 삭제 완료',
  FAILED:           '실패',
}

function PipelineNode({
  icon, label, sublabel, active = false, dark = false,
}: {
  icon: string; label: string; sublabel?: string; active?: boolean; dark?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-3 z-10">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl ${
        active ? 'bg-primary shadow-primary/25'
               : dark ? 'bg-inverse-surface' : 'bg-surface-container-lowest'
      }`}>
        <span
          className={`material-symbols-outlined text-3xl ${
            active ? 'text-white' : dark ? 'text-primary-fixed-dim' : 'text-outline'
          }`}
          style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {icon}
        </span>
      </div>
      <div className="text-center">
        <span className={`text-xs font-bold uppercase tracking-widest block ${
          active ? 'text-primary' : 'text-on-surface-variant'
        }`}>
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-on-surface-variant/60">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

function FlowLine({ active = true }: { active?: boolean }) {
  return (
    <div className="flex-1 px-4 relative -mt-10">
      <div className="h-1 bg-surface-container-highest w-full rounded-full overflow-hidden">
        {active && (
          <div
            className="h-full w-1/3 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #006c4d, #3eb489)',
              animation:  'flowAnim 1.8s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function AdminVaultPage() {
  const [stats,       setStats]       = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStats = () => {
    fetch('/api/admin/vault')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
    if (autoRefresh) {
      timerRef.current = setInterval(fetchStats, 5000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh])

  const slaCompliance = stats?.slaCompliance ?? 100
  const avgLatencyMs  = stats?.avgLatencyMs  ?? 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      {/* Keyframe styles */}
      <style>{`
        @keyframes flowAnim {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">보안 볼트 모니터</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            실시간 데이터 파이프라인 · 암호화 격리 · 무결성 검증
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${autoRefresh ? 'bg-primary' : 'bg-outline'}`}
              style={autoRefresh ? { animation: 'pulseGlow 1.5s infinite' } : {}}
            />
            {autoRefresh ? '실시간 자동 갱신' : '갱신 일시정지'}
          </button>
          <button
            onClick={fetchStats}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            새로고침
          </button>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-2xl font-bold text-on-surface tracking-tight">실시간 데이터 파이프라인</h3>
            <p className="text-on-surface-variant text-sm mt-1">라이브 트래픽 암호화 및 격리 처리</p>
          </div>
          <div className="bg-surface-container-lowest px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
            <span className="text-primary font-bold text-sm">&lt; {avgLatencyMs || 1.2}ms</span>
            <span className="text-on-surface-variant text-[10px] font-medium uppercase tracking-wider">현재 지연시간</span>
          </div>
        </div>

        <div className="flex items-center justify-between relative px-8 py-12">
          <PipelineNode icon="cloud_sync" label="External Ingress"  sublabel="외부 제보 접수" />
          <FlowLine active />
          <PipelineNode icon="security"   label="Isolation Shield" sublabel="AES-256 암호화" active />
          <FlowLine active={false} />
          <PipelineNode icon="database"   label="Secure Vault"     sublabel="격리 저장소"    dark />
        </div>

        <div className="grid grid-cols-3 gap-6 mt-4">
          {[
            { step: '01', label: '제보 접수',          desc: 'HTTPS 종단간 암호화',         highlight: false },
            { step: '02', label: '즉시 암호화 격리',   desc: 'AES-256-GCM + 5초 SLA',       highlight: true  },
            { step: '03', label: 'Vault 저장 완료',    desc: '외부 DB 원본 자동 삭제',       highlight: false },
          ].map(s => (
            <div
              key={s.step}
              className={`p-4 rounded-2xl ${
                s.highlight
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-surface-container-lowest/50'
              }`}
            >
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${s.highlight ? 'text-primary' : 'text-on-surface-variant'}`}>
                {s.step}.
              </div>
              <div className="text-sm font-bold text-on-surface">{s.label}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: '총 이동 건수', val: stats?.total    ?? 0,       color: 'text-on-surface',                                               sub: '전체'         },
          { label: '무결성 검증', val: stats?.verified ?? 0,        color: 'text-primary',                                                  sub: 'VERIFIED'     },
          { label: 'SLA 준수율',  val: `${slaCompliance}%`,         color: slaCompliance >= 99 ? 'text-primary' : 'text-amber-600',         sub: '5초 이내'     },
          { label: '평균 지연',   val: `${avgLatencyMs}ms`,         color: avgLatencyMs < 3000  ? 'text-primary' : 'text-amber-600',        sub: '이동 속도'    },
        ].map(k => (
          <div key={k.label} className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">{k.label}</div>
            <div className={`text-2xl font-black ${k.color}`}>{k.val}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* SLA Bar */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-on-surface">5초 SLA 준수율</span>
          <span className={`text-sm font-black ${slaCompliance >= 99 ? 'text-primary' : 'text-amber-600'}`}>
            {slaCompliance}%
          </span>
        </div>
        <div className="h-3 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${slaCompliance}%`,
              background: slaCompliance >= 99 ? '#3eb489' : '#f4c542',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-on-surface-variant mt-2">
          <span>목표: 100% (5초 이내)</span>
          <span>실패 {stats?.failed ?? 0}건</span>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="bg-surface-container-low rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">history</span>
            최근 이동 이력
          </h3>
          <span className="text-xs text-on-surface-variant">최근 10건</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : !stats?.recent?.length ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl block mb-2">encrypted</span>
            이동 이력이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-lowest/80 rounded-xl">
                  {['시그널 ID', '접수 시각', '이동 완료', '지연 시간', '무결성', '상태'].map(h => (
                    <th
                      key={h}
                      className="text-left p-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider first:rounded-l-xl last:rounded-r-xl"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-3">
                      <code className="text-xs font-mono text-outline bg-surface-container px-2 py-1 rounded">
                        {t.signalId.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="p-3 text-xs text-on-surface-variant font-mono">
                      {new Date(t.receivedAt).toLocaleTimeString('ko-KR')}
                    </td>
                    <td className="p-3 text-xs text-on-surface-variant font-mono">
                      {t.transferredAt ? new Date(t.transferredAt).toLocaleTimeString('ko-KR') : '—'}
                    </td>
                    <td className="p-3">
                      {t.latencyMs != null ? (
                        <span className={`text-xs font-bold ${t.latencyMs <= 5000 ? 'text-primary' : 'text-error'}`}>
                          {t.latencyMs < 1000 ? `${t.latencyMs}ms` : `${(t.latencyMs / 1000).toFixed(1)}s`}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.integrityVerified ? (
                        <span className="text-primary flex items-center gap-1 text-xs font-bold">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          확인됨
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">대기 중</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status] || 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {STATUS_KO[t.status] || t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Policy */}
      <div className="bg-inverse-surface rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <span
            className="material-symbols-outlined text-primary-fixed-dim text-2xl mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            security
          </span>
          <div>
            <div className="font-bold text-sm mb-2">데이터 격리 보안 정책</div>
            <div className="text-xs text-white/60 leading-relaxed space-y-1">
              <div>• 외부 제보 접수 후 <strong className="text-white">5초 이내</strong> 내부 Secure Vault로 자동 이동</div>
              <div>• 이동 완료 후 <strong className="text-white">외부 DB 원본 즉시 삭제</strong> (토큰·날짜·카테고리만 잔류)</div>
              <div>• 이동 전후 <strong className="text-white">SHA-256 해시 비교</strong>로 무결성 100% 검증</div>
              <div>• 모든 이동 이력 <strong className="text-white">영구 감사 기록</strong> (변조 불가)</div>
              <div>• 내부에서만 원본 접근 가능 — 외부 트래킹은 <strong className="text-white">토큰 기반 최소 정보만</strong> 제공</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
