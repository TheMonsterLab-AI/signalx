'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [totpCode,   setTotpCode]   = useState('')
  const [needsTOTP,  setNeedsTOTP]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          ...(needsTOTP ? { totpCode } : {}),
        }),
      })

      const data = await res.json()

      if (data.requiresTOTP) {
        setNeedsTOTP(true)
        setLoading(false)
        return
      }

      if (!data.success) {
        setError(data.error || '인증 정보가 올바르지 않습니다.')
        setLoading(false)
        return
      }

      // Success — redirect to dashboard
      router.push('/admin/dashboard')

    } catch {
      setError('서버 연결 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container-low font-body text-on-surface min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* Background Texture */}
      <div className="absolute inset-0 security-mesh pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-[480px] px-6 py-12">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-surface-container-lowest shadow-sm">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '3rem', fontVariationSettings: "'FILL' 1" }}
            >
              shield_lock
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">SignalX</h1>
          <p className="text-on-surface-variant font-medium tracking-wide">내부 관리자 포털</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-2xl shadow-on-surface/5 p-10 border border-outline-variant/10">

          {/* 2FA Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full">
              <span
                className="material-symbols-outlined text-primary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                2FA 필수
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Admin Identifier */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 ml-1" htmlFor="admin-id">
                관리자 식별자
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">badge</span>
                </div>
                <input
                  id="admin-id"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="예: SNX-9942"
                  autoComplete="username"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant text-on-surface outline-none"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full opacity-20" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                  보안 자격증명
                </label>
                <a className="text-xs font-semibold text-primary hover:text-primary-container transition-colors" href="#">
                  긴급 초기화
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">key</span>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant text-on-surface outline-none"
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full opacity-20" />
              </div>
            </div>

            {/* TOTP (shown after first step) */}
            {needsTOTP && (
              <div className="animate-fade-in-up">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 ml-1">
                  2FA 코드 (6자리)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">phonelink_lock</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant text-on-surface text-center text-2xl font-black tracking-[0.3em] outline-none"
                  />
                </div>
                <p className="text-xs text-on-surface-variant/60 text-center mt-2">
                  인증 앱에서 6자리 코드를 확인하세요
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full auth-gradient text-on-primary font-bold py-4 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 group disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  인증 중...
                </>
              ) : (
                <>
                  <span>{needsTOTP ? '인증 완료' : '보안 세션 시작'}</span>
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-[11px] text-on-surface-variant/60 leading-relaxed max-w-[280px] mx-auto">
              이 터미널에 대한 무단 접근은 엄격히 금지됩니다. 모든 활동은{' '}
              <span className="text-on-surface-variant font-semibold">Verdant Sanctuary Node Protocol</span>에 따라 기록됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-8 px-4 opacity-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface">Node Active: 14.2.0</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface">
            Encrypted P2P Tunnel
          </span>
        </div>
      </main>

      {/* Support Link */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-surface-container/80 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto shadow-sm border border-outline-variant/10">
          <a
            href="mailto:security@signalx.io"
            className="text-[11px] font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">help_center</span>
            기술 보안팀 문의
          </a>
        </div>
      </div>
    </div>
  )
}
