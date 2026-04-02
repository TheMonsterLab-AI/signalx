'use client'

const SURGE_ALERTS = [
  { id: 'SIG-9284-FX', cat: '금융',  score: 8.4, pct: 84, change: '+142%/시간', status: '모니터링', statusCls: 'bg-amber-50 text-amber-700 border-amber-200'   },
  { id: 'SIG-4012-GP', cat: '지정학', score: 9.7, pct: 97, change: '+380%/시간', status: '위급',    statusCls: 'bg-red-50 text-red-700 border-red-200'         },
  { id: 'SIG-5501-CR', cat: '기업',  score: 4.2, pct: 42, change: '-12%/시간',  status: '중립',    statusCls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' },
  { id: 'SIG-7733-PL', cat: '정치',  score: 7.1, pct: 71, change: '+89%/시간',  status: '경보',    statusCls: 'bg-orange-50 text-orange-700 border-orange-200' },
]
const TREND_DATA = [
  [40,65,30],[55,50,45],[80,35,60],[45,75,40],[70,40,85],[60,90,55],[95,60,75],
]
const DAYS = ['월','화','수','목','금','토','오늘']

export default function AdminPatternsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface">패턴 분석</h2>
        <p className="text-on-surface-variant text-sm mt-1">AI 트렌드 감지 · 급증 알림 · 리스크 패턴</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '활성 시그널', val: '14,284', sub: '▲ 12.4%', subCls: 'text-primary'           },
          { label: '급증 알림',   val: '82',     sub: '▲ 24%',   subCls: 'text-error'             },
          { label: '평균 신뢰도', val: '92.8%',  sub: '안정적',   subCls: 'text-on-surface-variant' },
          { label: '뉴럴 노드',   val: '1,024',  sub: '정상',     subCls: 'text-primary'           },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">{k.label}</div>
            <div className="text-2xl font-black text-on-surface">{k.val}</div>
            <div className={`text-xs mt-1 font-semibold ${k.subCls}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-on-surface text-sm">7일 시그널 트렌드</div>
                <div className="text-xs text-on-surface-variant">카테고리별 분포</div>
              </div>
              <div className="flex gap-3 text-[10px] text-on-surface-variant">
                {[{color:'bg-primary',label:'지정학'},{color:'bg-emerald-400',label:'기업'},{color:'bg-amber-400',label:'금융'}].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 h-40">
              {TREND_DATA.map((bars, i) => (
                <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                  {bars.map((h, j) => (
                    <div key={j} className="flex-1 rounded-t-sm" style={{
                      height:`${h}%`,
                      background: j===0?'rgba(0,108,77,.7)':j===1?'rgba(62,180,137,.7)':'rgba(244,197,66,.7)',
                    }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-on-surface-variant/60 font-mono">
              {DAYS.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                <span className="font-bold text-on-surface text-sm">활성 급증 알림</span>
              </div>
              <span className="text-xs text-on-surface-variant">{SURGE_ALERTS.length}건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20">
                    {['시그널 ID','카테고리','위험도','변화율','상태'].map(h => (
                      <th key={h} className="text-left p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SURGE_ALERTS.map(s => (
                    <tr key={s.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                      <td className="p-4 font-mono text-xs text-on-surface-variant">{s.id}</td>
                      <td className="p-4 text-sm font-medium text-on-surface">{s.cat}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-on-surface">{s.score}</span>
                          <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width:`${s.pct}%`,
                              background: s.pct>90?'#E06C75':s.pct>70?'#F4C542':'#3EB489',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold" style={{color:s.change.startsWith('+')?'#3EB489':'#6d7a72'}}>{s.change}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.statusCls}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{background:'linear-gradient(135deg,#1a2e24,#006c4d)'}}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-6 translate-x-6" />
            <div className="text-xs font-bold text-[#3EB489] uppercase tracking-wider mb-2">최대 급증 지역</div>
            <div className="text-xl font-black mb-1">한국 — 기업</div>
            <div className="text-sm text-white/60 mb-3">본사 데이터 유출 가능성</div>
            <div className="text-5xl font-black text-[#3EB489]/80 italic">5.2x</div>
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5">
            <div className="font-bold text-on-surface text-sm mb-4">카테고리 분포</div>
            <div className="space-y-3">
              {[
                {cat:'기업', pct:34,color:'#006c4d'},
                {cat:'지정학',pct:28,color:'#3EB489'},
                {cat:'금융', pct:21,color:'#F4C542'},
                {cat:'기술', pct:10,color:'#4A9C7E'},
                {cat:'기타', pct:7, color:'#bccac1'},
              ].map(c => (
                <div key={c.cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">{c.cat}</span>
                    <span className="font-bold text-on-surface">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${c.pct}%`,background:c.color}} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm p-5">
            <div className="font-bold text-on-surface text-sm mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">hub</span>
              뉴럴 노드 상태
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'활성 노드',val:'1,024'},
                {label:'처리 속도',val:'1.2k/s'},
                {label:'평균 지연',val:'14ms'},
                {label:'오류율',  val:'0.02%'},
              ].map(s => (
                <div key={s.label} className="bg-surface-container-low rounded-xl p-3 text-center">
                  <div className="text-lg font-black text-primary">{s.val}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
