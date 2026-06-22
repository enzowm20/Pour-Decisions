import { useScrollProgress } from "../hooks/useScrollProgress"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"
import bottleImg from "../assets/limoncello-bottle.webp"

// Each bottle falls continuously as you scroll (wrapping back to the top once
// it passes the bottom), with its own horizontal wobble and tumble speed so
// the set reads as erratic rather than a single repeating pattern.
const BOTTLES = [
  { left: 6, fallSpeed: 0.5, wobbleAmp: 14, wobblePeriod: 240, spinSpeed: 0.22, phase: 0, size: 36, loopOffset: 0 },
  { left: 18, fallSpeed: 0.8, wobbleAmp: 8, wobblePeriod: 160, spinSpeed: -0.3, phase: 1.1, size: 26, loopOffset: 300 },
  { left: 30, fallSpeed: 0.35, wobbleAmp: 20, wobblePeriod: 320, spinSpeed: 0.15, phase: 2.4, size: 42, loopOffset: 650 },
  { left: 70, fallSpeed: 0.65, wobbleAmp: 10, wobblePeriod: 190, spinSpeed: -0.2, phase: 3.3, size: 30, loopOffset: 120 },
  { left: 82, fallSpeed: 0.42, wobbleAmp: 16, wobblePeriod: 280, spinSpeed: 0.28, phase: 4.6, size: 38, loopOffset: 480 },
  { left: 92, fallSpeed: 0.9, wobbleAmp: 6, wobblePeriod: 140, spinSpeed: -0.35, phase: 5.2, size: 24, loopOffset: 800 },
  { left: 50, fallSpeed: 0.55, wobbleAmp: 18, wobblePeriod: 260, spinSpeed: 0.18, phase: 0.7, size: 32, loopOffset: 950 },
  { left: 60, fallSpeed: 0.7, wobbleAmp: 9, wobblePeriod: 170, spinSpeed: -0.25, phase: 1.8, size: 28, loopOffset: 200 },
]

const LOOP_HEIGHT_VH = 140 // wrap distance, in vh, before a bottle resets to the top
const ASPECT = 1280 / 1024 // source image height / width

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
        const height = b.size * ASPECT
        const fallDistance = scrollY * b.fallSpeed + b.loopOffset
        const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
        const topPx = (fallDistance % loopPx) - height
        const wobble = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const rotation = (scrollY * b.spinSpeed + b.phase * 40) % 360

        return (
          <img
            key={i}
            src={bottleImg}
            alt=""
            width={b.size}
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
