import { useLocation } from "react-router-dom"
import { useScrollProgress } from "../hooks/useScrollProgress"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"

// Each bottle falls continuously as you scroll and wraps back to the top once
// it passes the bottom of its loop. `loopFraction` (0–1) staggers each one's
// starting position as a fraction of the full loop length — computed against
// the actual loop height at render time, not a fixed pixel offset — so they
// stay evenly spread across the entire screen instead of bunching near the
// top. Each also gets its own wobble/spin speed so the set reads as erratic.
const BOTTLES = [
  { left: 0, fallSpeed: 0.5, wobbleAmp: 12, wobblePeriod: 240, spinSpeed: 0.22, phase: 0, size: 46, loopFraction: 0.0 },
  { left: 8, fallSpeed: 0.8, wobbleAmp: 7, wobblePeriod: 160, spinSpeed: -0.3, phase: 1.1, size: 34, loopFraction: 0.07 },
  { left: 16, fallSpeed: 0.35, wobbleAmp: 18, wobblePeriod: 320, spinSpeed: 0.15, phase: 2.4, size: 54, loopFraction: 0.14 },
  { left: 24, fallSpeed: 0.65, wobbleAmp: 9, wobblePeriod: 190, spinSpeed: -0.2, phase: 3.3, size: 40, loopFraction: 0.21 },
  { left: 32, fallSpeed: 0.42, wobbleAmp: 14, wobblePeriod: 280, spinSpeed: 0.28, phase: 4.6, size: 48, loopFraction: 0.28 },
  { left: 40, fallSpeed: 0.9, wobbleAmp: 6, wobblePeriod: 140, spinSpeed: -0.35, phase: 5.2, size: 30, loopFraction: 0.35 },
  { left: 48, fallSpeed: 0.55, wobbleAmp: 16, wobblePeriod: 260, spinSpeed: 0.18, phase: 0.7, size: 42, loopFraction: 0.42 },
  { left: 56, fallSpeed: 0.7, wobbleAmp: 8, wobblePeriod: 170, spinSpeed: -0.25, phase: 1.8, size: 36, loopFraction: 0.49 },
  { left: 64, fallSpeed: 0.48, wobbleAmp: 11, wobblePeriod: 300, spinSpeed: 0.2, phase: 2.9, size: 50, loopFraction: 0.56 },
  { left: 72, fallSpeed: 0.75, wobbleAmp: 7, wobblePeriod: 150, spinSpeed: -0.28, phase: 4.0, size: 32, loopFraction: 0.63 },
  { left: 80, fallSpeed: 0.6, wobbleAmp: 13, wobblePeriod: 220, spinSpeed: 0.24, phase: 5.8, size: 44, loopFraction: 0.7 },
  { left: 88, fallSpeed: 0.4, wobbleAmp: 19, wobblePeriod: 350, spinSpeed: -0.18, phase: 0.4, size: 56, loopFraction: 0.77 },
  { left: 4, fallSpeed: 0.85, wobbleAmp: 5, wobblePeriod: 130, spinSpeed: 0.32, phase: 1.5, size: 28, loopFraction: 0.84 },
  { left: 96, fallSpeed: 0.52, wobbleAmp: 10, wobblePeriod: 270, spinSpeed: -0.22, phase: 3.7, size: 38, loopFraction: 0.91 },
]

const LOOP_HEIGHT_VH = 120 // a bit more than one full viewport, so each bottle actually crosses top to bottom
const ASPECT = 1280 / 1024 // source image height / width
const SIZE_MULTIPLIER = 2.5

interface Props {
  bottleImg: string | string[]
}

export default function FallingBottles({ bottleImg }: Props) {
  const location = useLocation()
  const { scrollY } = useScrollProgress(location.pathname)
  const reducedMotion = usePrefersReducedMotion()
  const images = Array.isArray(bottleImg) ? bottleImg : [bottleImg]

  // Visible for the whole page, top to bottom — no fade in/out tied to scroll.
  if (reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        // Negative z-index keeps this behind all normal in-flow content
        // (headings, cards) — a fixed element with z-index 0 or higher
        // paints above static content regardless of DOM order, which is
        // what put bottles in front of the text before.
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {BOTTLES.map((b, i) => {
        const size = b.size * SIZE_MULTIPLIER
        const height = size * ASPECT
        const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
        const fallDistance = scrollY * b.fallSpeed + b.loopFraction * loopPx
        const topPx = (((fallDistance % loopPx) + loopPx) % loopPx) - height
        const wobble = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const rotation = (scrollY * b.spinSpeed + b.phase * 40) % 360

        return (
          <img
            key={i}
            src={images[i % images.length]}
            alt=""
            width={size}
            height={height}
            style={{
              position: "absolute",
              left: `${b.left}%`,
              top: topPx,
              transform: `translateX(${wobble}px) rotate(${rotation}deg)`,
            }}
          />
        )
      })}
    </div>
  )
}
