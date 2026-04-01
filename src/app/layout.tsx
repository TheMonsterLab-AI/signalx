import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    template: '%s | SignalX',
    default:  'SignalX — Global Signal Intelligence Platform',
  },
  description: '전 세계 어디서나 안전하게 제보하세요. ANN AI 7단계 검증 · 글로벌 파트너 원스톱 배포',
  robots: { index: false, follow: false }, // private platform
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="font-body text-on-surface antialiased">
        {children}
      </body>
    </html>
  )
}
