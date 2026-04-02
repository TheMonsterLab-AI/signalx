'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/',        label: '홈'       },
  { href: '/signals', label: '시그널'   },
  { href: '/map',     label: '글로벌 맵' },
  { href: '/about',   label: '소개'     },
]

const MOBILE_NAV = [
  { href: '/',        icon: 'home',          label: '홈'   },
  { href: '/signals', icon: 'sensors',       label: '시그널' },
  { href: '/map',     icon: 'public',        label: '맵'   },
  { href: '/about',   icon: 'info',          label: '소개'  },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* ── 공통 헤더 ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-emerald-50/95 backdrop-blur-xl border-b border-emerald-900/6">
        <div className="flex justify-between items-center px-6 md:px-8 h-16 max-w-[1440px] mx-auto">

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings:"'FILL' 1" }}>signal_cellular_alt</span>
            <span className="text-xl font-black tracking-tighter text-emerald-900">SignalX</span>
          </Link>

          {/* 데스크탑 nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className={`text-sm font-semibold transition-colors ${
                    active ? 'text-primary' : 'text-emerald-900/60 hover:text-emerald-900'
                  }`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signals"
              className="text-sm font-semibold text-emerald-900/60 hover:text-emerald-900 transition-colors px-3 py-2">
              제보 확인
            </Link>
            <Link href="/submit"
              className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 active:scale-95 transition-all">
              지금 제보하기
            </Link>
          </div>

          {/* 모바일 햄버거 */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/submit"
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-md shadow-primary/25">
              제보하기
            </Link>
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-xl hover:bg-emerald-100 transition-colors">
              <span className={`block w-5 h-0.5 bg-emerald-900 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-emerald-900 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-emerald-900 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {menuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-emerald-50/98 backdrop-blur-xl px-6 py-4 space-y-1">
            {NAV.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-emerald-900/70 hover:bg-emerald-100'
                  }`}>
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-emerald-100">
              <Link href="/signals" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-emerald-900/70 hover:bg-emerald-100">
                제보 확인
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 페이지 콘텐츠 */}
      <div style={{ paddingTop: '64px', minHeight: '100dvh', backgroundColor: '#f3fbf5' }}>
        {children}
      </div>

      {/* 모바일 하단 nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-2 pb-safe pt-2 border-t border-emerald-100"
        style={{ background: 'rgba(243,251,245,.97)', backdropFilter: 'blur(20px)' }}>
        {MOBILE_NAV.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-emerald-900/40'
              }`}>
              <span className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
