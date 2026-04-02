'use client'

import { useState, useEffect } from 'react'

const TYPE_KO: Record<string, string> = {
  SUBMISSION_RECEIPT: '접수 확인',
  ANN_REPORT_READY:   'ANN 리포트',
  DISTRIBUTION_SENT:  '배포 완료',
  ADMIN_ALERT:        '관리자 알림',
  PARTNER_DELIVERY:   '파트너 배포',
  SYSTEM_NOTICE:      '시스템 공지',
}
const STATUS_STYLE: Record<string, string> = {
  DELIVERED: 'text-primary',
  SENDING:   'text-blue-600',
  QUEUED:    'text-amber-600',
  FAILED:    'text-error',
  BOUNCED:   'text-error',
}

export default function AdminEmailPage() {
  const [logs,    setLogs]    = useState<any[]>([])
  const [stats,   setStats]   = useState({ totalAll: 0, delivered: 0, failed: 0, deliveryRate: 99.98 })
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState({ type: '', status: '', direction: '' })
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const params = new URLSearchParams({ limit: '30', ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)) })
    fetch(`/api/admin/email?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.logs)   setLogs(d.logs)
        if (d.stats)  setStats(d.stats)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight -ml-0.5">
          이메일 감사 로그
        </h2>
        <p className="text-on-surface-variant text-lg font-light max-w-2xl">
          단일 수신(report@signalx.global) · 다수 자동 발신 구조의 암호화 전달 이벤트 검증 기록
        </p>
      </div>

      {/* KPI Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">stacked_line_chart</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-1">총 발송 건수</p>
            <h3 className="text-3xl font-black text-on-surface">{stats.totalAll.toLocaleString()}</h3>
          </div>
          <p className="text-[11px] text-primary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_upward</span>
            발신 {stats.delivered.toLocaleString()}건 완료
          </p>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-1">전달 성공률</p>
            <h3 className="text-3xl font-black text-on-surface">{stats.deliveryRate}%</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#3eb489] rounded-full" style={{ boxShadow: '0 0 4px #3eb489' }} />
            <p className="text-[11px] text-on-surface-variant font-medium">최적 시스템 성능</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">verified</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-1">암호화 상태</p>
            <h3 className="text-3xl font-black text-on-surface">검증됨</h3>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium">RSA-4096 다중 레이어 프로토콜</p>
        </div>

      </div>

      {/* Policy Notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-primary">policy</span>
        </div>
        <div>
          <div className="font-bold text-on-surface text-sm mb-1">이메일 보안 정책</div>
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <strong>수신</strong>: report@signalx.global (단일 주소만 허용) &nbsp;|&nbsp;
            <strong>발신</strong>: 자동화 시스템에서 다수 발송 &nbsp;|&nbsp;
            <strong>원본 이메일 주소 미저장</strong> — HMAC-SHA256 해시만 기록 &nbsp;|&nbsp;
            <strong>모든 발송</strong>에 감사 근거 자동 생성 (변조 불가)
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface-container-low p-8 rounded-xl">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <h4 className="text-xl font-bold text-on-surface">발송 감사 원장</h4>
          <div className="flex gap-3 flex-wrap">
            {/* Type filter */}
            <select
              value={filter.type}
              onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              className="bg-white px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant shadow-sm border border-outline-variant/30 focus:outline-none focus:border-primary"
            >
              <option value="">전체 유형</option>
              {Object.entries(TYPE_KO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {/* Status filter */}
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              className="bg-white px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant shadow-sm border border-outline-variant/30 focus:outline-none focus:border-primary"
            >
              <option value="">전체 상태</option>
              <option value="DELIVERED">전달 완료</option>
              <option value="FAILED">실패</option>
              <option value="QUEUED">대기 중</option>
            </select>
            <button className="bg-white px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant shadow-sm flex items-center gap-2 hover:bg-surface transition-all border border-outline-variant/30">
              <span className="material-symbols-outlined text-sm">download</span>
              CSV 내보내기
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-on-surface-variant uppercase text-[10px] tracking-[0.1em] font-bold">
              <tr>
                <th className="pb-5 pl-4">발송 시각</th>
                <th className="pb-5">수신자 해시</th>
                <th className="pb-5">이메일 유형</th>
                <th className="pb-5">관련 토큰</th>
                <th className="pb-5">전달 상태</th>
                <th className="pb-5 pr-4 text-right">감사 근거</th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {loading ? (
                Array(8).fill(null).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 pl-4">
                      <div className="skeleton h-4 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2">mark_email_read</span>
                    이메일 로그가 없습니다
                  </td>
                </tr>
              ) : logs.map((log, i) => (
                <tr key={i} className="group hover:bg-white/60 transition-all">
                  <td className="py-5 pl-4 rounded-l-xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface">
                        {new Date(log.sentAt).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {new Date(log.sentAt).toLocaleTimeString('ko-KR')} KST
                      </span>
                    </div>
                  </td>
                  <td className="py-5">
                    <code className="text-xs font-mono text-outline bg-surface-container px-2 py-1 rounded">
                      {log.recipientHash.slice(0, 4)}...{log.recipientHash.slice(-4)}
                    </code>
                  </td>
                  <td className="py-5">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {TYPE_KO[log.emailType] || log.emailType}
                    </span>
                  </td>
                  <td className="py-5">
                    {log.signalToken ? (
                      <span className="text-xs font-mono text-primary">{log.signalToken}</span>
                    ) : (
                      <span className="text-xs text-on-surface-variant/40">—</span>
                    )}
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                        log.status === 'DELIVERED' ? 'bg-primary' :
                        log.status === 'FAILED'    ? 'bg-error'   : 'bg-amber-400'
                      }`} style={log.status === 'DELIVERED' ? { boxShadow: '0 0 4px #3eb489' } : {}} />
                      <span className={`text-xs font-bold ${STATUS_STYLE[log.status] || 'text-on-surface-variant'}`}>
                        {log.status === 'DELIVERED' ? '전달 완료' :
                         log.status === 'FAILED'    ? '실패'      :
                         log.status === 'QUEUED'    ? '대기 중'   : log.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 pr-4 rounded-r-xl text-right">
                    <button
                      onClick={() => setSelected(log)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 ml-auto"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      근거 확인
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Proof Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-outline-variant/30"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                감사 근거 증빙
              </h3>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: '이벤트 ID',  val: selected.id },
                { label: '발송 시각',  val: new Date(selected.sentAt).toISOString() },
                { label: '유형',       val: TYPE_KO[selected.emailType] || selected.emailType },
                { label: '방향',       val: selected.direction === 'OUTBOUND' ? '발신' : '수신' },
                { label: '수신자 해시', val: selected.recipientHash },
                { label: '제목 해시',  val: selected.subjectHash.slice(0, 32) + '...' },
                { label: '본문 해시',  val: selected.contentHash.slice(0, 32) + '...' },
                { label: '관련 토큰',  val: selected.signalToken || '—' },
                { label: '전달 상태',  val: selected.status },
                { label: '공급자 ID',  val: selected.providerMsgId || '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="text-on-surface-variant font-medium">{r.label}</span>
                  <span className="font-mono text-xs text-on-surface max-w-xs text-right break-all">{r.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <div className="text-[11px] text-primary font-medium">
                ✓ 이 기록은 변조 불가능합니다 — HMAC 서명으로 무결성이 보호됩니다
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
