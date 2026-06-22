import { useScrollProgress } from "../hooks/useScrollProgress"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"

// Each bottle falls continuously as you scroll (wrapping back to the top once
// it passes the bottom), with its own horizontal wobble and tumble speed so
// the set reads as erratic rather than a single repeating pattern.
const BOTTLES = [
  { left: 6, fallSpeed: 0.5, wobbleAmp: 14, wobblePeriod: 240, spinSpeed: 0.22, phase: 0, size: 30, loopOffset: 0 },
  { left: 18, fallSpeed: 0.8, wobbleAmp: 8, wobblePeriod: 160, spinSpeed: -0.3, phase: 1.1, size: 22, loopOffset: 300 },
  { left: 30, fallSpeed: 0.35, wobbleAmp: 20, wobblePeriod: 320, spinSpeed: 0.15, phase: 2.4, size: 36, loopOffset: 650 },
  { left: 70, fallSpeed: 0.65, wobbleAmp: 10, wobblePeriod: 190, spinSpeed: -0.2, phase: 3.3, size: 26, loopOffset: 120 },
  { left: 82, fallSpeed: 0.42, wobbleAmp: 16, wobblePeriod: 280, spinSpeed: 0.28, phase: 4.6, size: 32, loopOffset: 480 },
  { left: 92, fallSpeed: 0.9, wobbleAmp: 6, wobblePeriod: 140, spinSpeed: -0.35, phase: 5.2, size: 20, loopOffset: 800 },
  { left: 50, fallSpeed: 0.55, wobbleAmp: 18, wobblePeriod: 260, spinSpeed: 0.18, phase: 0.7, size: 28, loopOffset: 950 },
  { left: 60, fallSpeed: 0.7, wobbleAmp: 9, wobblePeriod: 170, spinSpeed: -0.25, phase: 1.8, size: 24, loopOffset: 200 },
]

const LOOP_HEIGHT_VH = 140 // wrap distance, in vh, before a bottle resets to the top

function Bottle({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.9} viewBox="0 0 40 76" aria-hidden="true">
      <rect x="16" y="0" width="8" height="8" rx="2" fill="#c9a36b" />
      <rect x="15" y="8" width="10" height="14" fill="#59d9cc" />
      <rect x="15" y="18" width="10" height="4" fill="#f28095" />
      <path
        d="M15 22 L25 22 L33 46 C36 56 32 74 20 74 C8 74 4 56 7 46 Z"
        fill="#f2dd72"
      />
    </svg>
  )
}

export default function FallingBottles() {
  const { progress, scrollY } = useScrollProgress("home")
  const reducedMotion = usePrefersReducedMotion()

  // Fade and scale in with scroll progress, matching the liquid draining —
  // nothing falls while the bottle is still full at the top of the page.
  if (reducedMotion || progress <= 0) return null

  const intensity = Math.min(1, progress * 2.5)

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: intensity,
      }}
    >
      {BOTTLES.map((b, i) => {
        const fallDistance = scrollY * b.fallSpeed + b.loopOffset
        const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
        const topPx = (fallDistance % loopPx) - b.size * 1.9
        const wobble = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const rotation = (scrollY * b.spinSpeed + b.phase * 40) % 360

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.left}%`,
              top: topPx,
              transform: `translateX(${wobble}px) rotate(${rotation}deg)`,
            }}
          >
            <Bottle size={b.size} />
          </div>
        )
      })}
    </div>
  )
}
