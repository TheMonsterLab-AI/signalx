'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'dashboard',             label: '글로벌 운영 현황' },
  { href: '/admin/signals',   icon: 'sensors',               label: '시그널 피드'      },
  { href: '/admin/review',    icon: 'rate_review',           label: '인간 검토 큐'     },
  { href: '/admin/ann',       icon: 'psychology',            label: 'ANN 검증 관리'    },
  { href: '/admin/reporters', icon: 'contacts',              label: '파트너 기자 DB'   },
  { href: '/admin/distribute',icon: 'share',                 label: '배포 관리'        },
  { href: '/admin/inquiries', icon: 'mark_unread_chat_alt',  label: '문의 · 반박 인박스' },
  { href: '/admin/map',       icon: 'public',                label: '리스크 맵'        },
  { href: '/admin/email',     icon: 'mark_email_read',       label: '이메일 감사 로그' },
  { href: '/admin/vault',     icon: 'encrypted',             label: '보안 볼트 모니터' },
  { href: '/admin/org',       icon: 'group',                 label: '조직 · 리더 관리' },
  { href: '/admin/patterns',  icon: 'trending_up',           label: '패턴 분석'        },
  { href: '/admin/archive',   icon: 'inventory_2',           label: '아카이브 검색'    },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden font-body" style={{ backgroundColor: '#f3fbf5' }}>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] flex flex-col
        transition-transform duration-250
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#1a2e24' }}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              signal_cellular_alt
            </span>
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-tight">SignalX</div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest">Admin Portal</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-white/40 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-3 py-2 mb-1">
            운영 센터
          </div>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/20 text-primary-fixed-dim'
                    : 'text-white/55 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base flex-shrink-0"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-fixed-dim" />}
              </Link>
            )
          })}

          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-3 py-2 mb-1 mt-4">
            시스템
          </div>
          <Link href="/admin/audit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:bg-white/8 hover:text-white transition-all">
            <span className="material-symbols-outlined text-base">history</span>
            감사 로그
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:bg-white/8 hover:text-white transition-all">
            <span className="material-symbols-outlined text-base">settings</span>
            설정
          </Link>
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              D
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">박 대니</div>
              <div className="text-[10px] text-white/40">Global Signal Director</div>
            </div>
            <Link href="/admin/login" className="text-white/30 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-sm">logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-14 bg-white border-b border-outline-variant/30 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1 className="text-sm font-bold text-on-surface leading-none">
                {NAV_ITEMS.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              실시간 운영 중
            </div>

            {/* Clock */}
            <div className="hidden md:block text-[11px] font-mono text-on-surface-variant/60">
              {time}
            </div>

            <div className="w-px h-5 bg-outline-variant/50" />

            {/* Notifications */}
            <button className="relative text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
            </button>

            {/* User avatar */}
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              D
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
