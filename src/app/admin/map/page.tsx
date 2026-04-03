'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const RISK_NODES = [
  { name: 'Seoul',     country: '한국',     lat: 37.5,  lon: 127,   risk: 'CRITICAL',  type: '기업',  score: 91, change: '+340%', signals: 14 },
  { name: 'Moscow',    country: '러시아',   lat: 55.7,  lon: 37.6,  risk: 'CRITICAL',  type: '지정학', score: 89, change: '+280%', signals: 11 },
  { name: 'Beijing',   country: '중국',     lat: 39.9,  lon: 116.4, risk: 'HIGH',      type: '기업',  score: 82, change: '+120%', signals: 8  },
  { name: 'Tokyo',     country: '일본',     lat: 35.7,  lon: 139.7, risk: 'HIGH',      type: '금융',  score: 85, change: '+80%',  signals: 6  },
  { name: 'Singapore', country: '싱가포르', lat: 1.3,   lon: 103.8, risk: 'HIGH',      type: '기술',  score: 67, change: '+45%',  signals: 5  },
  { name: 'Dubai',     country: 'UAE',      lat: 25.2,  lon: 55.3,  risk: 'HIGH',      type: '범죄',  score: 71, change: '+60%',  signals: 4  },
  { name: 'London',    country: '영국',     lat: 51.5,  lon: -0.1,  risk: 'ELEVATED',  type: '금융',  score: 55, change: '+30%',  signals: 3  },
  { name: 'NewYork',   country: '미국',     lat: 40.7,  lon: -74,   risk: 'STABLE',    type: '기업',  score: 30, change: '+10%',  signals: 2  },
  { name: 'Berlin',    country: '독일',     lat: 52.5,  lon: 13.4,  risk: 'STABLE',    type: '정치',  score: 25, change: '-5%',   signals: 1  },
  { name: 'Sydney',    country: '호주',     lat: -33.9, lon: 151.2, risk: 'STABLE',    type: '금융',  score: 20, change: '0%',    signals: 1  },
  { name: 'Paris',     country: '프랑스',   lat: 48.8,  lon: 2.3,   risk: 'ELEVATED',  type: '정치',  score: 48, change: '+22%',  signals: 3  },
  { name: 'SaoPaulo',  country: '브라질',   lat: -23.5, lon: -46.6, risk: 'ELEVATED',  type: '기업',  score: 52, change: '+35%',  signals: 4  },
]

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#E06C75', HIGH: '#F4C542', ELEVATED: '#F0A050', MONITOR: '#4A9C7E', STABLE: '#3EB489',
}
const RISK_KO: Record<string, string> = {
  CRITICAL: '위급', HIGH: '고위험', ELEVATED: '주의', MONITOR: '모니터링', STABLE: '안정',
}
const RISK_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH:     'bg-amber-100 text-amber-700 border-amber-200',
  ELEVATED: 'bg-orange-100 text-orange-700 border-orange-200',
  MONITOR:  'bg-blue-100 text-blue-700 border-blue-200',
  STABLE:   'bg-primary/10 text-primary border-primary/20',
}

export default function AdminMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<typeof RISK_NODES[0] | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const globeRef = useRef<any>({ rx: 0.25, ry: 0, vx: 0, vy: 0, drag: false, lx: 0, ly: 0, zoom: 2.7, raf: 0 })

  useEffect(() => {
    const G = globeRef.current
    let scene: any, cam: any, rend: any, sphere: any, cloud: any

    async function init() {
      if (typeof window === 'undefined' || !canvasRef.current) return
      {

        const cv = canvasRef.current
        const w = cv.parentElement?.clientWidth || 800
        const h = cv.parentElement?.clientHeight || 500
        cv.width = w; cv.height = h

        scene = new THREE.Scene()
        cam   = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000)
        cam.position.z = G.zoom

        rend = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false })
        rend.setSize(w, h)
        rend.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        rend.setClearColor(0x1a2e24, 1)

        // Globe
        sphere = new THREE.Mesh(
          new THREE.SphereGeometry(1, 64, 64),
          new THREE.MeshPhongMaterial({ color: 0x1F4A38, emissive: 0x0D2218, shininess: 20 })
        )
        scene.add(sphere)

        // Stars
        const sa: number[] = []
        for (let i = 0; i < 2000; i++) {
          const sp = new THREE.Spherical(50 + Math.random() * 50, Math.acos(2 * Math.random() - 1), Math.random() * Math.PI * 2)
          const v = new THREE.Vector3(); v.setFromSpherical(sp)
          sa.push(v.x, v.y, v.z)
        }
        const sg = new THREE.BufferGeometry()
        sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sa), 3))
        scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x3EB489, size: 0.08, transparent: true, opacity: 0.3 })))

        // Wireframe overlay
        scene.add(new THREE.Mesh(
          new THREE.SphereGeometry(1.002, 24, 24),
          new THREE.MeshBasicMaterial({ color: 0x3EB489, wireframe: true, transparent: true, opacity: 0.04 })
        ))

        // Lights
        scene.add(new THREE.AmbientLight(0x1F4033, 2.5))
        const sun = new THREE.DirectionalLight(0x3EB489, 1.5); sun.position.set(5, 3, 5); scene.add(sun)

        // Earth textures (unpkg three-globe — same as user map)
        const tl = new THREE.TextureLoader()
        tl.load('//unpkg.com/three-globe/example/img/earth-day.jpg', (t: any) => {
          sphere.material.map = t; sphere.material.color.setHex(0xffffff); sphere.material.needsUpdate = true
        })

        // Clouds
        cloud = new THREE.Mesh(
          new THREE.SphereGeometry(1.012, 48, 48),
          new THREE.MeshPhongMaterial({
            map: tl.load('//unpkg.com/three-globe/example/img/earth-water.png'),
            transparent: true, opacity: 0.18, depthWrite: false
          })
        )
        scene.add(cloud)

        // Risk node markers
        RISK_NODES.forEach(n => {
          const ph = (90 - n.lat) * Math.PI / 180
          const th = (n.lon + 180) * Math.PI / 180
          const pos = new THREE.Vector3(
            -Math.sin(ph) * Math.cos(th),
            Math.cos(ph),
            Math.sin(ph) * Math.sin(th)
          )

          const color = parseInt(RISK_COLORS[n.risk].replace('#', ''), 16)
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.022, 8, 8),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
          )
          dot.position.copy(pos); dot.userData = n; sphere.add(dot)

          // Spike
          const spike = new THREE.Mesh(
            new THREE.CylinderGeometry(0, 0.008, 0.08, 6),
            new THREE.MeshBasicMaterial({ color })
          )
          spike.position.copy(pos); spike.lookAt(new THREE.Vector3(0,0,0))
          spike.rotateX(Math.PI / 2); sphere.add(spike)

          // Ring pulse
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.028, 0.036, 16),
            new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
          )
          ring.position.copy(pos); ring.lookAt(new THREE.Vector3(0,0,0)); ring.userData = { ri: n.name }
          sphere.add(ring)
        })

        // Drag
        const ds = (x: number, y: number) => { G.drag = true; G.lx = x; G.ly = y; G.vx = 0; G.vy = 0 }
        const dm = (x: number, y: number) => {
          if (!G.drag) return
          G.vy = (x - G.lx) * 0.005; G.vx = (y - G.ly) * 0.005
          G.ry += G.vy; G.rx += G.vx
          G.rx = Math.max(-1.4, Math.min(1.4, G.rx))
          G.lx = x; G.ly = y
        }
        cv.addEventListener('mousedown',  e => { ds(e.clientX, e.clientY); cv.style.cursor = 'grabbing' })
        window.addEventListener('mouseup',  () => { G.drag = false; cv.style.cursor = 'grab' })
        window.addEventListener('mousemove', e => dm(e.clientX, e.clientY))
        cv.addEventListener('touchstart', e => { ds(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault() }, { passive: false })
        cv.addEventListener('touchend',   () => G.drag = false)
        cv.addEventListener('touchmove',  e => { dm(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault() }, { passive: false })
        cv.addEventListener('wheel',      e => { G.zoom = Math.max(1.8, Math.min(5, G.zoom + e.deltaY * 0.003)); cam.position.z = G.zoom; e.preventDefault() }, { passive: false })

        // Raycaster for hover
        const ray = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        cv.addEventListener('mousemove', e => {
          if (G.drag) return
          const rect = cv.getBoundingClientRect()
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
          ray.setFromCamera(mouse, cam)
          const pts = sphere.children.filter((c: any) => c.userData?.name)
          const hits = ray.intersectObjects(pts)
          if (hits.length) setSelected(hits[0].object.userData as any)
        })

        // Resize
        window.addEventListener('resize', () => {
          if (!rend) return
          const nw = cv.parentElement?.clientWidth || 800
          const nh = cv.parentElement?.clientHeight || 500
          cv.width = nw; cv.height = nh
          cam.aspect = nw / nh; cam.updateProjectionMatrix(); rend.setSize(nw, nh)
        })

        animate()
      }
    }

    function animate() {
      G.raf = requestAnimationFrame(animate)
      if (autoRotate && !G.drag) G.ry += 0.003
      if (!G.drag) { G.vy *= 0.92; G.vx *= 0.92; G.ry += G.vy; G.rx += G.vx }
      G.rx = Math.max(-1.4, Math.min(1.4, G.rx))
      if (sphere) { sphere.rotation.y = G.ry; sphere.rotation.x = G.rx }
      if (cloud)  { cloud.rotation.y = G.ry + Date.now() * 0.00003; cloud.rotation.x = G.rx }
      // Pulse rings
      if (sphere) {
        const t = Date.now() * 0.002
        sphere.children.forEach((c: any, i: number) => {
          if (c.geometry?.type === 'RingGeometry') c.material.opacity = 0.25 + 0.3 * Math.sin(t + i * 0.7)
        })
      }
      if (rend && scene && cam) rend.render(scene, cam)
    }

    init()
    return () => { cancelAnimationFrame(G.raf); G.raf = 0 }
  }, [])

  const flyTo = (node: typeof RISK_NODES[0]) => {
    setSelected(node)
    const G = globeRef.current
    const ty = -node.lon * Math.PI / 180
    const tx = node.lat  * Math.PI / 180 * 0.5
    let step = 0; const frames = 50
    const fy = G.ry, fx = G.rx
    G.auto = false;
    (function go() {
      step++; const e = step / frames; const ease = e < 0.5 ? 2*e*e : (4-2*e)*e-1
      G.ry = fy + (ty - fy) * ease; G.rx = fx + (tx - fx) * ease
      if (step < frames) requestAnimationFrame(go)
    })()
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Globe */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Map header */}
        <div className="px-5 py-3 flex justify-between items-center bg-white border-b border-outline-variant/30 flex-shrink-0">
          <div>
            <div className="text-sm font-bold text-on-surface">글로벌 리스크 현황</div>
            <div className="text-xs text-on-surface-variant">활성 노드 {RISK_NODES.length}개 · 위급 2 · 고위험 4 · 주의 3 · 안정 3</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRotate(p => !p)}
              className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              자동 회전: {autoRotate ? '켜짐' : '꺼짐'}
            </button>
            <button
              onClick={() => { globeRef.current.rx = 0.25; globeRef.current.ry = 0; globeRef.current.zoom = 2.7 }}
              className="px-3 py-1.5 border border-outline-variant/40 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative min-h-0 cursor-grab">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Legend */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="bg-[#1a2e24]/90 border border-[#3EB489]/20 rounded-xl p-3 text-xs space-y-1.5">
              {Object.entries(RISK_KO).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[k] }} />
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* Selected tooltip */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[#1a2e24]/95 border border-[#3EB489]/30 rounded-2xl px-5 py-3 text-white text-sm min-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{selected.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{ background: RISK_COLORS[selected.risk] + '25', color: RISK_COLORS[selected.risk] }}>
                  {RISK_KO[selected.risk]}
                </span>
              </div>
              <div className="text-white/60 text-xs">{selected.country} · {selected.type}</div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-white/60">신뢰도</span>
                <span className="font-bold" style={{ color: RISK_COLORS[selected.risk] }}>{selected.score}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">시그널</span>
                <span className="font-bold text-white">{selected.signals}건</span>
              </div>
            </div>
          )}

          {/* Terminal log */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#1a2e24]/80 border-t border-[#3EB489]/20 pointer-events-none">
            <div className="flex items-center justify-between px-4 py-1 border-b border-white/5">
              <span className="text-[9px] font-bold text-[#3EB489] uppercase tracking-wider">실시간 시그널 로그</span>
              <span className="text-[9px] font-mono text-white/30">LIVE</span>
            </div>
            <div className="px-4 py-1.5 space-y-0.5">
              {[
                { t: '12:45:01', lvl: 'INFO',  c: '#3EB489', msg: '서울 노드 급증 감지 — 기업 카테고리 +340%' },
                { t: '12:44:58', lvl: 'WARN',  c: '#F4C542', msg: '모스크바 지정학 시그널 이상 급증' },
                { t: '12:44:30', lvl: 'ALERT', c: '#E06C75', msg: 'SX-2025-008 CRITICAL 등급 — 즉시 검토 필요' },
              ].map(l => (
                <div key={l.t} className="flex gap-3 font-mono text-[10px]">
                  <span className="text-[#3EB489]">{l.t}</span>
                  <span style={{ color: l.c }}>[{l.lvl}]</span>
                  <span className="text-white/50">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-64 flex-shrink-0 border-l border-outline-variant/30 bg-surface-container-low flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-outline-variant/20">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">리스크 핫스팟</div>
          <div className="space-y-2">
            {RISK_NODES.filter(n => n.risk === 'CRITICAL' || n.risk === 'HIGH').map(n => (
              <button
                key={n.name}
                onClick={() => flyTo(n)}
                className={`w-full text-left p-3 rounded-xl border bg-white hover:border-primary transition-all ${
                  selected?.name === n.name ? 'border-primary shadow-sm' : 'border-outline-variant/30'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-on-surface">{n.country}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${RISK_BADGE[n.risk]}`}>
                    {RISK_KO[n.risk]}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant">{n.type}</div>
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className="font-bold" style={{ color: RISK_COLORS[n.risk] }}>{n.change}</span>
                  <span className="text-on-surface-variant">신뢰도 {n.score}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="p-4 mt-auto">
          <div className="bg-[#1a2e24] rounded-2xl p-4 text-white text-center">
            <div className="text-xs text-white/50 mb-1">AI 추천 액션</div>
            <div className="text-sm font-bold mb-3">한국·러시아<br />집중 모니터링</div>
            <button className="w-full bg-[#E06C75] text-white py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
              경보 발령
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
