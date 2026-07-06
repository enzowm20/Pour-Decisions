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
const BLEND_DURATION_MS  = 1400
// Small threshold so wantFloat only flips after the user has genuinely
// stopped — without this it toggles every other frame during smooth scrolling
// (frames where scrollY didn't change this exact tick), which causes
// dirFlip to fire constantly and the offsets to be recaptured mid-transition.
const IDLE_THRESHOLD_MS  = 180

const PHI  = 1.6180339887
const PHI2 = PHI * PHI
const PHI3 = PHI2 * PHI

const FLOAT_CONFIG = BOTTLES.map((_b, i) => {
  const basePeriod = 18 + (i * PHI * 2.3) % 14
  return {
    xFreq1: 1 / basePeriod,            xAmp1: 28 + (i * 7.3) % 30,
    yFreq1: 1 / (basePeriod * PHI),    yAmp1: 0.16 + (i * 0.007) % 0.06,
    xFreq2: PHI2 / basePeriod,         xAmp2: 12 + (i * 4.1) % 14,
    yFreq2: PHI3 / (basePeriod * PHI), yAmp2: 0.07 + (i * 0.004) % 0.04,
    xFreq3: PHI3 / (basePeriod * 0.7), xAmp3: 5 + (i * 1.7) % 7,
    yFreq3: PHI2 / (basePeriod * 1.3), yAmp3: 0.03 + (i * 0.002) % 0.02,
    rotFreq1: 1 / (basePeriod * 1.5), rotFreq2: PHI / (basePeriod * 2.2),
    rotAmp: 6 + (i * 2.3) % 9,
  }
})

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

interface Props { bottleImg: string | string[] }

export default function FallingBottles({ bottleImg }: Props) {
  const location = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const images = Array.isArray(bottleImg) ? bottleImg : [bottleImg]
  const bottleRefs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    if (reducedMotion) return

    let raf: number
    let prevTimestamp  = performance.now()
    // floatTime ALWAYS advances so the float animation is mid-cycle at the
    // moment the user first goes idle — prevents the "snap to homeY" start.
    let floatTime      = 0
    let lastScrollTime = performance.now()
    let lastScrollY    = window.scrollY

    // Blend accumulator: 0 = fully scroll-driven, 1 = fully floating.
    let floatBlend   = 0
    const blendRate  = 1 / (BLEND_DURATION_MS / 1000)
    let prevWantFloat = false

    // Per-bottle continuity offsets captured each time the blend direction
    // reverses. Two sets: one for each direction.
    //   fwdOffset: captured when SCROLL→FLOAT starts (blend at 0)
    //     applied as:  floatPos + fwdOffset * (1 - blend)
    //   bwdOffset: captured when FLOAT→SCROLL starts (blend somewhere > 0)
    //     applied as:  scrollPos + bwdOffset * blend
    // This ensures the transition always starts from the bottle's current
    // rendered position rather than snapping to homeY or any stale position.
    const fwdOffset = BOTTLES.map(() => ({ x: 0, y: 0, rot: 0 }))
    const bwdOffset = BOTTLES.map(() => ({ x: 0, y: 0, rot: 0 }))

    function scrollPos(b: typeof BOTTLES[0], sy: number, loopPx: number) {
      const height = b.size * SIZE_MULTIPLIER * ASPECT
      const fall   = sy * b.fallSpeed + b.loopFraction * loopPx
      const y      = (((fall % loopPx) + loopPx) % loopPx) - height
      const x      = Math.sin(sy / b.wobblePeriod + b.phase) * b.wobbleAmp
      const rot    = (sy * b.spinSpeed + b.phase * 40) % 360
      return { x, y, rot }
    }

    function floatPos(b: typeof BOTTLES[0], fc: typeof FLOAT_CONFIG[0], t: number) {
      const height = b.size * SIZE_MULTIPLIER * ASPECT
      const homeY  = b.loopFraction * window.innerHeight - height / 2
      const vhAmp  = window.innerHeight
      const x =
        Math.sin(2 * Math.PI * fc.xFreq1 * t + b.phase)        * fc.xAmp1 +
        Math.sin(2 * Math.PI * fc.xFreq2 * t + b.phase * 1.3)  * fc.xAmp2 +
        Math.sin(2 * Math.PI * fc.xFreq3 * t + b.phase * 2.1)  * fc.xAmp3
      const y =
        homeY +
        Math.sin(2 * Math.PI * fc.yFreq1 * t + b.phase * 1.7)  * fc.yAmp1 * vhAmp +
        Math.sin(2 * Math.PI * fc.yFreq2 * t + b.phase * 0.9)  * fc.yAmp2 * vhAmp +
        Math.sin(2 * Math.PI * fc.yFreq3 * t + b.phase * 2.6)  * fc.yAmp3 * vhAmp
      const rot =
        Math.sin(2 * Math.PI * fc.rotFreq1 * t + b.phase)       * fc.rotAmp +
        Math.sin(2 * Math.PI * fc.rotFreq2 * t + b.phase * 1.4) * fc.rotAmp * 0.4
      return { x, y, rot }
    }

    function tick(timestamp: number) {
      const dt = Math.min(timestamp - prevTimestamp, 64)
      prevTimestamp = timestamp
      floatTime    += dt

      const sy = window.scrollY
      if (sy !== lastScrollY) { lastScrollY = sy; lastScrollTime = timestamp }

      const wantFloat = (timestamp - lastScrollTime) > IDLE_THRESHOLD_MS

      if (wantFloat) floatBlend = Math.min(1, floatBlend + blendRate * dt / 1000)
      else           floatBlend = Math.max(0, floatBlend - blendRate * dt / 1000)

      const blend    = smoothstep(floatBlend)
      const loopPx   = (LOOP_HEIGHT_VH / 100) * window.innerHeight
      const t        = floatTime / 1000
      const dirFlip  = wantFloat !== prevWantFloat
      prevWantFloat  = wantFloat

      BOTTLES.forEach((b, i) => {
        const fc = FLOAT_CONFIG[i]
        const sp = scrollPos(b, sy, loopPx)
        const fp = floatPos(b, fc, t)

        if (dirFlip) {
          if (wantFloat) {
            // Scroll→Float: capture scroll position as forward offset so the
            // transition starts exactly where the bottle currently sits.
            fwdOffset[i] = { x: sp.x - fp.x, y: sp.y - fp.y, rot: sp.rot - fp.rot }
          } else {
            // Float��Scroll: capture float position as backward offset so the
            // transition starts from where the bottle is now, not scrollPos.
            bwdOffset[i] = { x: fp.x - sp.x, y: fp.y - sp.y, rot: fp.rot - sp.rot }
          }
        }

        // Reset offsets once fully at rest so stale values don't accumulate.
        if (floatBlend <= 0) bwdOffset[i] = { x: 0, y: 0, rot: 0 }
        if (floatBlend >= 1) fwdOffset[i] = { x: 0, y: 0, rot: 0 }

        // Two formulas — each guarantees exact position at the START of its
        // transition and smoothly reaches the target by the END.
        //
        //   Scroll→Float:  floatPos  + fwdOffset * (1-blend)
        //     blend=0 → floatPos + (scrollPos-floatPos) = scrollPos ✓
        //     blend=1 → floatPos ✓
        //
        //   Float→Scroll:  scrollPos + bwdOffset * blend
        //     blend=high → scrollPos + (floatPos-scrollPos)*blend ≈ floatPos ✓
        //     blend=0    → scrollPos ✓
        const x   = wantFloat
          ? fp.x   + fwdOffset[i].x   * (1 - blend)
          : sp.x   + bwdOffset[i].x   * blend
        const y   = wantFloat
          ? fp.y   + fwdOffset[i].y   * (1 - blend)
          : sp.y   + bwdOffset[i].y   * blend
        const rot = wantFloat
          ? fp.rot + fwdOffset[i].rot * (1 - blend)
          : sp.rot + bwdOffset[i].rot * blend

        const el = bottleRefs.current[i]
        if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`
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
