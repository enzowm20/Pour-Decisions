import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"

// left values: 14 zones across 0–100%, each bottle offset erratically within
// its zone so coverage stays even but the rigid 8% grid is gone.
// loopFraction: similarly jittered across 0–1 so vertical stagger isn't
// a perfect ladder either.
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

const LOOP_HEIGHT_VH = 120
const ASPECT = 1280 / 1024
const SIZE_MULTIPLIER = 2.5

const IDLE_THRESHOLD_MS = 2000
const BLEND_DURATION_MS = 1800

// Irrational frequency multipliers ensure each bottle's path never exactly
// repeats and no two bottles share the same cycle length. Using the golden
// ratio (φ) and its powers creates the densest possible non-repeating spread.
const PHI  = 1.6180339887
const PHI2 = PHI * PHI       // 2.618…
const PHI3 = PHI2 * PHI      // 4.236…

// Each bottle gets a unique float "personality": base frequency, drift radii,
// and which harmonic multipliers are used for X vs Y. This means the spatial
// path each bottle traces is a slowly-precessing Lissajous figure — it looks
// similar on successive passes but never lands exactly the same way twice.
const FLOAT_CONFIG = BOTTLES.map((_b, i) => {
  // Spread base periods between ~18s and ~32s so bottles visibly drift at
  // different rates — slow enough to feel like suspension in liquid.
  const basePeriod = 18 + (i * PHI * 2.3) % 14  // seconds

  // X and Y use different harmonic multipliers (PHI vs PHI2) so horizontal
  // and vertical cycles are incommensurate — the path never closes.
  return {
    // Primary (large, slow) drift
    xFreq1: 1 / basePeriod,
    xAmp1:  18 + (i * 7.3) % 22,
    yFreq1: 1 / (basePeriod * PHI),
    yAmp1:  (window?.innerHeight ?? 800) * (0.04 + (i * 0.003) % 0.04),

    // Secondary (medium) drift — different harmonic so paths don't mirror
    xFreq2: PHI2 / basePeriod,
    xAmp2:  8 + (i * 4.1) % 10,
    yFreq2: PHI3 / (basePeriod * PHI),
    yAmp2:  (window?.innerHeight ?? 800) * (0.02 + (i * 0.002) % 0.025),

    // Tertiary (tiny flutter) — feels like micro-currents in the liquid
    xFreq3: PHI3 / (basePeriod * 0.7),
    xAmp3:  3 + (i * 1.7) % 5,
    yFreq3: PHI2 / (basePeriod * 1.3),
    yAmp3:  (window?.innerHeight ?? 800) * (0.008 + (i * 0.001) % 0.01),

    // Rotation: two overlapping waves for organic tilting, never locks to
    // a fixed angle
    rotFreq1: 1 / (basePeriod * 1.5),
    rotFreq2: PHI / (basePeriod * 2.2),
    rotAmp:   6 + (i * 2.3) % 9,
  }
})

// Smoothstep easing: feels much more organic than a linear blend because the
// acceleration/deceleration at both ends mimics how real floating objects
// transition between states of motion.
function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

interface Props {
  bottleImg: string | string[]
}

export default function FallingBottles({ bottleImg }: Props) {
  const location = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const images = Array.isArray(bottleImg) ? bottleImg : [bottleImg]
  const bottleRefs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    if (reducedMotion) return

    let raf: number
    let prevTimestamp = performance.now()
    let floatTime = 0
    let lastScrollTime = performance.now()
    let lastScrollY = window.scrollY
    // Continuously-interpolated blend value: 0 = scroll-driven, 1 = floating.
    // Chases its target each frame at a fixed rate so it can never jump or
    // reverse — the root cause of the jitter was rawBlend snapping to 1.0
    // the instant idleMs reset to 0 on every scroll event.
    let floatBlend = 0
    const blendRate = 1 / (BLEND_DURATION_MS / 1000) // units: per second

    function tick(timestamp: number) {
      const dt = Math.min(timestamp - prevTimestamp, 64) // cap so tab-hidden catch-up doesn't jump
      prevTimestamp = timestamp

      const scrollY = window.scrollY
      if (scrollY !== lastScrollY) {
        lastScrollY = scrollY
        lastScrollTime = timestamp
      }

      const idleMs = timestamp - lastScrollTime
      const wantFloat = idleMs > IDLE_THRESHOLD_MS

      // Drive floatBlend smoothly toward 1 when idle, 0 when scrolling.
      // No condition ever snaps it — only increments/decrements by dt each frame.
      if (wantFloat) {
        floatBlend = Math.min(1, floatBlend + blendRate * dt / 1000)
      } else {
        floatBlend = Math.max(0, floatBlend - blendRate * dt / 1000)
      }

      // Only advance floatTime while blending in or fully floating, so the
      // animation doesn't freeze mid-transition on the way back out.
      if (floatBlend > 0) floatTime += dt

      const blend = smoothstep(floatBlend)

      const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
      const t = floatTime / 1000

      BOTTLES.forEach((b, i) => {
        const el = bottleRefs.current[i]
        if (!el) return

        const height = b.size * SIZE_MULTIPLIER * ASPECT
        const fc = FLOAT_CONFIG[i]

        // ── Scroll-driven ─────────────────────────────────────────────
        const fallDistance = scrollY * b.fallSpeed + b.loopFraction * loopPx
        const scrollTop    = (((fallDistance % loopPx) + loopPx) % loopPx) - height
        const scrollWobble = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const scrollRot    = (scrollY * b.spinSpeed + b.phase * 40) % 360

        // ── Idle float ────────────────────────────────────────────────
        // Home Y is the bottle's resting position spread across the
        // viewport. The three overlapping sine waves (each with an
        // irrational ratio to the others) create a path that visually
        // feels organic without ever exactly repeating.
        const homeY = b.loopFraction * window.innerHeight - height / 2

        const floatX =
          Math.sin(2 * Math.PI * fc.xFreq1 * t + b.phase)         * fc.xAmp1 +
          Math.sin(2 * Math.PI * fc.xFreq2 * t + b.phase * 1.3)   * fc.xAmp2 +
          Math.sin(2 * Math.PI * fc.xFreq3 * t + b.phase * 2.1)   * fc.xAmp3

        const floatY =
          homeY +
          Math.sin(2 * Math.PI * fc.yFreq1 * t + b.phase * 1.7)   * fc.yAmp1 +
          Math.sin(2 * Math.PI * fc.yFreq2 * t + b.phase * 0.9)   * fc.yAmp2 +
          Math.sin(2 * Math.PI * fc.yFreq3 * t + b.phase * 2.6)   * fc.yAmp3

        const floatRot =
          Math.sin(2 * Math.PI * fc.rotFreq1 * t + b.phase)        * fc.rotAmp +
          Math.sin(2 * Math.PI * fc.rotFreq2 * t + b.phase * 1.4)  * (fc.rotAmp * 0.4)

        // ── Blend ─────────────────────────────────────────────────────
        const wobble   = scrollWobble * (1 - blend) + floatX   * blend
        const topPx    = scrollTop    * (1 - blend) + floatY   * blend
        const rotation = scrollRot    * (1 - blend) + floatRot * blend

        el.style.transform = `translate3d(${wobble}px, ${topPx}px, 0) rotate(${rotation}deg)`
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {BOTTLES.map((b, i) => {
        const size = b.size * SIZE_MULTIPLIER
        const height = size * ASPECT

        return (
          <img
            key={i}
            ref={(el) => { bottleRefs.current[i] = el }}
            src={images[i % images.length]}
            alt=""
            width={size}
            height={height}
            style={{
              position: "absolute",
              left: `${b.left}%`,
              top: 0,
              willChange: "transform",
            }}
          />
        )
      })}
    </div>
  )
}
