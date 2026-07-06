import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"

const BOTTLES = [
  { left: 2,  fallSpeed: 0.5,  wobbleAmp: 12, wobblePeriod: 240, spinSpeed: 0.22,  phase: 0,   size: 46, loopFraction: 0.03 },
  { left: 11, fallSpeed: 0.8,  wobbleAmp: 7,  wobblePeriod: 160, spinSpeed: -0.3,  phase: 1.1, size: 34, loopFraction: 0.19 },
  { left: 17, fallSpeed: 0.35, wobbleAmp: 18, wobblePeriod: 320, spinSpeed: 0.15,  phase: 2.4, size: 54, loopFraction: 0.11 },
  { left: 26, fallSpeed: 0.65, wobbleAmp: 9,  wobblePeriod: 190, spinSpeed: -0.2,  phase: 3.3, size: 40, loopFraction: 0.34 },
  { left: 31, fallSpeed: 0.42, wobbleAmp: 14, wobblePeriod: 280, spinSpeed: 0.28,  phase: 4.6, size: 48, loopFraction: 0.26 },
  { left: 41, fallSpeed: 0.9,  wobbleAmp: 6,  wobblePeriod: 140, spinSpeed: -0.35, phase: 5.2, size: 30, loopFraction: 0.55 },
  { left: 46, fallSpeed: 0.55, wobbleAmp: 16, wobblePeriod: 260, spinSpeed: 0.18,  phase: 0.7, size: 42, loopFraction: 0.42 },
  { left: 55, fallSpeed: 0.7,  wobbleAmp: 8,  wobblePeriod: 170, spinSpeed: -0.25, phase: 1.8, size: 36, loopFraction: 0.68 },
  { left: 62, fallSpeed: 0.48, wobbleAmp: 11, wobblePeriod: 300, spinSpeed: 0.2,   phase: 2.9, size: 50, loopFraction: 0.61 },
  { left: 68, fallSpeed: 0.75, wobbleAmp: 7,  wobblePeriod: 150, spinSpeed: -0.28, phase: 4.0, size: 32, loopFraction: 0.79 },
  { left: 75, fallSpeed: 0.6,  wobbleAmp: 13, wobblePeriod: 220, spinSpeed: 0.24,  phase: 5.8, size: 44, loopFraction: 0.47 },
  { left: 83, fallSpeed: 0.4,  wobbleAmp: 19, wobblePeriod: 350, spinSpeed: -0.18, phase: 0.4, size: 56, loopFraction: 0.88 },
  { left: 89, fallSpeed: 0.85, wobbleAmp: 5,  wobblePeriod: 130, spinSpeed: 0.32,  phase: 1.5, size: 28, loopFraction: 0.73 },
  { left: 96, fallSpeed: 0.52, wobbleAmp: 10, wobblePeriod: 270, spinSpeed: -0.22, phase: 3.7, size: 38, loopFraction: 0.93 },
]

const LOOP_HEIGHT_VH  = 120
const ASPECT          = 1280 / 1024
const SIZE_MULTIPLIER = 2.5
// Blend duration: how long the scroll↔float crossfade takes
const BLEND_DURATION_MS = 1400
// How long without scroll input before idle float kicks in
const IDLE_THRESHOLD_MS = 180

const PHI  = 1.6180339887
const PHI2 = PHI * PHI
const PHI3 = PHI2 * PHI

const FLOAT_CONFIG = BOTTLES.map((_b, i) => {
  const base = 18 + (i * PHI * 2.3) % 14  // period in seconds per bottle
  return {
    xFreq1: 1 / base,             xAmp1: 30 + (i * 7.3) % 30,
    xFreq2: PHI2 / base,          xAmp2: 14 + (i * 4.1) % 14,
    xFreq3: PHI3 / (base * 0.7),  xAmp3: 6  + (i * 1.7) % 7,
    // Y amplitudes in viewport-height fractions — large enough to scatter
    // bottles across the full screen, not just hover in a band
    yFreq1: 1 / (base * PHI),             yAmp1: 0.18 + (i * 0.007) % 0.07,
    yFreq2: PHI3 / (base * PHI),          yAmp2: 0.09 + (i * 0.004) % 0.04,
    yFreq3: PHI2 / (base * 1.3),          yAmp3: 0.04 + (i * 0.002) % 0.02,
    rotFreq1: 1 / (base * 1.5),  rotFreq2: PHI / (base * 2.2),
    rotAmp: 7 + (i * 2.3) % 9,
  }
})

function smoothstep(t: number) {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

interface Props { bottleImg: string | string[] }

export default function FallingBottles({ bottleImg }: Props) {
  const location   = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const images     = Array.isArray(bottleImg) ? bottleImg : [bottleImg]
  const bottleRefs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    if (reducedMotion) return

    let raf: number
    let prev  = performance.now()
    let floatTime   = 0
    let lastScrollY = window.scrollY
    let lastScrollT = performance.now()
    let floatBlend  = 0
    const blendRate = 1 / (BLEND_DURATION_MS / 1000)

    // Per-bottle stored position — the actual rendered X/Y/rot from the
    // previous frame. Lerping toward the target FROM this value (rather than
    // from a computed anchor) is what prevents snapping: the stored position
    // carries continuity automatically across every direction change.
    const cur = BOTTLES.map((b) => {
      const h    = b.size * SIZE_MULTIPLIER * ASPECT
      const loop = (LOOP_HEIGHT_VH / 100) * (window.innerHeight || 800)
      return {
        x:   0,
        y:   (b.loopFraction * loop) % loop - h,
        rot: 0,
      }
    })

    function scrollTarget(b: typeof BOTTLES[0], sy: number, loopPx: number) {
      const h    = b.size * SIZE_MULTIPLIER * ASPECT
      const fall = sy * b.fallSpeed + b.loopFraction * loopPx
      return {
        x:   Math.sin(sy / b.wobblePeriod + b.phase) * b.wobbleAmp,
        y:   (((fall % loopPx) + loopPx) % loopPx) - h,
        rot: (sy * b.spinSpeed + b.phase * 40) % 360,
      }
    }

    function floatTarget(b: typeof BOTTLES[0], fc: typeof FLOAT_CONFIG[0], t: number) {
      const h    = b.size * SIZE_MULTIPLIER * ASPECT
      const homeY = b.loopFraction * window.innerHeight - h / 2
      const vh   = window.innerHeight
      return {
        x:
          Math.sin(2 * Math.PI * fc.xFreq1 * t + b.phase)        * fc.xAmp1 +
          Math.sin(2 * Math.PI * fc.xFreq2 * t + b.phase * 1.3)  * fc.xAmp2 +
          Math.sin(2 * Math.PI * fc.xFreq3 * t + b.phase * 2.1)  * fc.xAmp3,
        y:
          homeY +
          Math.sin(2 * Math.PI * fc.yFreq1 * t + b.phase * 1.7)  * fc.yAmp1 * vh +
          Math.sin(2 * Math.PI * fc.yFreq2 * t + b.phase * 0.9)  * fc.yAmp2 * vh +
          Math.sin(2 * Math.PI * fc.yFreq3 * t + b.phase * 2.6)  * fc.yAmp3 * vh,
        rot:
          Math.sin(2 * Math.PI * fc.rotFreq1 * t + b.phase)       * fc.rotAmp +
          Math.sin(2 * Math.PI * fc.rotFreq2 * t + b.phase * 1.4) * fc.rotAmp * 0.4,
      }
    }

    function tick(ts: number) {
      const dt = Math.min(ts - prev, 64)
      prev = ts
      // floatTime always advances so the float animation is mid-cycle when
      // idle first kicks in — it never starts from the zero (homeY) position.
      floatTime += dt

      const sy = window.scrollY
      if (sy !== lastScrollY) { lastScrollY = sy; lastScrollT = ts }
      const wantFloat = (ts - lastScrollT) > IDLE_THRESHOLD_MS

      if (wantFloat) floatBlend = Math.min(1, floatBlend + blendRate * dt / 1000)
      else           floatBlend = Math.max(0, floatBlend - blendRate * dt / 1000)

      const blend  = smoothstep(floatBlend)
      const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
      const t      = floatTime / 1000

      BOTTLES.forEach((b, i) => {
        const el = bottleRefs.current[i]
        if (!el) return

        const st = scrollTarget(b, sy, loopPx)
        const ft = floatTarget(b, FLOAT_CONFIG[i], t)

        // Blend determines the TARGET this frame.
        // When fully in scroll (blend≈0) the target is the exact scroll position.
        // When fully floating (blend≈1) the target is the float animation.
        // In between, the target is a weighted mix — but crucially, we do NOT
        // snap to it; we lerp cur[i] toward it each frame so the bottle always
        // moves from wherever it actually is, never from a stale anchor.
        const tx  = st.x   * (1 - blend) + ft.x   * blend
        const ty  = st.y   * (1 - blend) + ft.y   * blend
        const trot= st.rot * (1 - blend) + ft.rot * blend

        if (blend <= 0.001) {
          // Fully in scroll: snap directly — no lerp lag during scrolling.
          cur[i].x   = st.x
          cur[i].y   = st.y
          cur[i].rot = st.rot
        } else if (blend >= 0.999) {
          // Fully floating: follow the float animation directly — it provides
          // its own smooth motion, no lerp needed.
          cur[i].x   = ft.x
          cur[i].y   = ft.y
          cur[i].rot = ft.rot
        } else {
          // Transitioning: lerp cur toward the blended target.
          // Rate 0.07/frame ≈ 90% of the way in ~32 frames (≈0.5s) which
          // gives a smooth ease without visible lag.
          const rate = 0.07
          cur[i].x   += (tx   - cur[i].x)   * rate
          cur[i].y   += (ty   - cur[i].y)   * rate
          cur[i].rot += (trot - cur[i].rot) * rate
        }

        el.style.transform =
          `translate3d(${cur[i].x}px, ${cur[i].y}px, 0) rotate(${cur[i].rot}deg)`
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, reducedMotion])

  if (reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", pointerEvents: "none" }}
    >
      {BOTTLES.map((b, i) => {
        const size   = b.size * SIZE_MULTIPLIER
        const height = size * ASPECT
        return (
          <img
            key={i}
            ref={(el) => { bottleRefs.current[i] = el }}
            src={images[i % images.length]}
            alt=""
            width={size}
            height={height}
            style={{ position: "absolute", left: `${b.left}%`, top: 0, willChange: "transform" }}
          />
        )
      })}
    </div>
  )
}
