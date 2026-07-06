import { useRef } from "react"
import { useLocation } from "react-router-dom"
import { useScrollFrame } from "../hooks/useScrollProgress"
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

interface Props { bottleImg: string | string[] }

export default function FallingBottles({ bottleImg }: Props) {
  const location      = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const images        = Array.isArray(bottleImg) ? bottleImg : [bottleImg]
  const bottleRefs    = useRef<(HTMLImageElement | null)[]>([])

  useScrollFrame(
    ({ scrollY }) => {
      const loopPx = (LOOP_HEIGHT_VH / 100) * window.innerHeight
      BOTTLES.forEach((b, i) => {
        const el = bottleRefs.current[i]
        if (!el) return
        const height       = b.size * SIZE_MULTIPLIER * ASPECT
        const fallDistance = scrollY * b.fallSpeed + b.loopFraction * loopPx
        const topPx        = (((fallDistance % loopPx) + loopPx) % loopPx) - height
        const wobble       = Math.sin(scrollY / b.wobblePeriod + b.phase) * b.wobbleAmp
        const rotation     = (scrollY * b.spinSpeed + b.phase * 40) % 360
        el.style.transform = `translate3d(${wobble}px, ${topPx}px, 0) rotate(${rotation}deg)`
      })
    },
    location.pathname,
  )

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
