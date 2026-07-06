import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"

// Each bottle falls continuously as you scroll and wraps back to the top once
// it passes the bottom of its loop. `loopFraction` (0–1) staggers each one's
// starting position as a fraction of the full loop length — computed against
// the actual loop height at render time, not a fixed pixel offset — so they
// stay evenly spread across the entire screen instead of bunching near the
// top. Each also gets its own wobble/spin speed so the set reads as erratic.
const BOTTLES = [
  { left: 0,  fallSpeed: 0.5,  wobbleAmp: 12, wobblePeriod: 240, spinSpeed: 0.22,  phase: 0,   size: 46, loopFraction: 0.0  },
  { left: 8,  fallSpeed: 0.8,  wobbleAmp: 7,  wobblePeriod: 160, spinSpeed: -0.3,  phase: 1.1, size: 34, loopFraction: 0.07 },
  { left: 16, fallSpeed: 0.35, wobbleAmp: 18, wobblePeriod: 320, spinSpeed: 0.15,  phase: 2.4, size: 54, loopFraction: 0.14 },
  { left: 24, fallSpeed: 0.65, wobbleAmp: 9,  wobblePeriod: 190, spinSpeed: -0.2,  phase: 3.3, size: 40, loopFraction: 0.21 },
  { left: 32, fallSpeed: 0.42, wobbleAmp: 14, wobblePeriod: 280, spinSpeed: 0.28,  phase: 4.6, size: 48, loopFraction: 0.28 },
  { left: 40, fallSpeed: 0.9,  wobbleAmp: 6,  wobblePeriod: 140, spinSpeed: -0.35, phase: 5.2, size: 30, loopFraction: 0.35 },
  { left: 48, fallSpeed: 0.55, wobbleAmp: 16, wobblePeriod: 260, spinSpeed: 0.18,  phase: 0.7, size: 42, loopFraction: 0.42 },
  { left: 56, fallSpeed: 0.7,  wobbleAmp: 8,  wobblePeriod: 170, spinSpeed: -0.25, phase: 1.8, size: 36, loopFraction: 0.49 },
  { left: 64, fallSpeed: 0.48, wobbleAmp: 11, wobblePeriod: 300, spinSpeed: 0.2,   phase: 2.9, size: 50, loopFraction: 0.56 },
  { left: 72, fallSpeed: 0.75, wobbleAmp: 7,  wobblePeriod: 150, spinSpeed: -0.28, phase: 4.0, size: 32, loopFraction: 0.63 },
  { left: 80, fallSpeed: 0.6,  wobbleAmp: 13, wobblePeriod: 220, spinSpeed: 0.24,  phase: 5.8, size: 44, loopFraction: 0.7  },
  { left: 88, fallSpeed: 0.4,  wobbleAmp: 19, wobblePeriod: 350, spinSpeed: -0.18, phase: 0.4, size: 56, loopFraction: 0.77 },
  { left: 4,  fallSpeed: 0.85, wobbleAmp: 5,  wobblePeriod: 130, spinSpeed: 0.32,  phase: 1.5, size: 28, loopFraction: 0.84 },
  { left: 96, fallSpeed: 0.52, wobbleAmp: 10, wobblePeriod: 270, spinSpeed: -0.22, phase: 3.7, size: 38, loopFraction: 0.91 },
]

const LOOP_HEIGHT_VH = 120
const ASPECT = 1280 / 1024
const SIZE_MULTIPLIER = 2.5

// How long without scrolling before float mode kicks in (ms).
const IDLE_THRESHOLD_MS = 2000
// How long the crossfade from scroll→float (and float→scroll) takes (ms).
const BLEND_DURATION_MS = 1200

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

    // Accumulated time used to drive the idle float animation.
    let floatTime = 0
    // Timestamp of the last detected scroll movement.
    let lastScrollTime = performance.now()
    let lastScrollY = window.scrollY

    function tick(timestamp: number) {
      const dt = timestamp - prevTimestamp
      prevTimestamp = timestamp

      const scrollY = window.scrollY

      // Detect movement this frame.
      if (scrollY !== lastScrollY) {
        lastScrollY = scrollY
        lastScrollTime = timestamp
      }

      const idleMs = timestamp - lastScrollTime

      // Float time only advances while idle, so the float animation picks up
      // exactly where it would be rather than jumping.
      if (idleMs > IDLE_THRESHOLD_MS) floatTime += dt

      // blend 0 = fully scroll-driven, blend 1 = fully floating.
      const blend = idleMs > IDLE_THRESHOLD_MS
        ? Math.min(1, (idleMs - IDLE_THRESHOLD_MS) / BLEND_DURATION_MS)
        : Math.max(0, 1 - idleMs / BLEND_DURATION_MS)

      const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
      const t = floatTime / 1000 // float time in seconds

      BOTTLES.forEach((b, i) => {
        const el = bottleRefs.current[i]
        if (!el) return

        const height = b.size * SIZE_MULTIPLIER * ASPECT

        // ── Scroll-driven position ────────────────────────────────────
        const fallDistance = scrollY * b.fallSpeed + b.loopFraction * loopPx
        const scrollTop = (((fallDistance % loopPx) + loopPx) % loopPx) - height
        const scrollWobble = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const scrollRotation = (scrollY * b.spinSpeed + b.phase * 40) % 360

        // ── Idle float position ───────────────────────────────────────
        // Each bottle lazily drifts around a home position distributed
        // across the viewport. Two overlapping sine waves give organic,
        // non-repeating motion without being chaotic.
        const homeY = b.loopFraction * window.innerHeight - height / 2
        const floatTop =
          homeY +
          Math.sin(t * 0.18 + b.phase) * window.innerHeight * 0.06 +
          Math.sin(t * 0.11 + b.phase * 1.7) * window.innerHeight * 0.04

        const floatWobble =
          Math.sin(t * 0.22 + b.phase) * b.wobbleAmp * 1.4 +
          Math.sin(t * 0.13 + b.phase * 2.1) * b.wobbleAmp * 0.6

        // Gentle tilt: ±12° with a slow, unique period per bottle.
        const floatRotation = Math.sin(t * Math.abs(b.spinSpeed) * 0.4 + b.phase) * 12

        // ── Blend ─────────────────────────────────────────────────────
        const wobble   = scrollWobble  * (1 - blend) + floatWobble  * blend
        const topPx    = scrollTop     * (1 - blend) + floatTop     * blend
        const rotation = scrollRotation * (1 - blend) + floatRotation * blend

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
            ref={(el) => {
              bottleRefs.current[i] = el
            }}
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
