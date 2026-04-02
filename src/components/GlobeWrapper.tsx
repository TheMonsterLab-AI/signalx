'use client'

// Globe 컴포넌트 래퍼 — react-globe.gl은 WebGL/three.js 의존성으로 인해
// 반드시 클라이언트 전용으로 분리해야 빌드 오류 없음
import dynamic from 'next/dynamic'

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

export default Globe
