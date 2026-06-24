import { useRef } from "react"
import { useLocation } from "react-router-dom"
import { useScrollFrame } from "../hooks/useScrollProgress"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"
import { waveTile } from "../lib/waveTile"
import { liquidLayersForTheme, themeForPath } from "../lib/theme"

// At progress 0 (top of page) the liquid fills the full viewport; at progress 1
// (bottom) it's drained down to a thin remainder near the floor of the bottle.
const MAX_DRAIN = 95

export default function DrainingBackground() {
  const location = useLocation()
  const reducedMotion = usePrefersReducedMotion()

  const theme = themeForPath(location.pathname)
  const layers = liquidLayersForTheme(theme)

  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const stripRefs = useRef<(HTMLDivElement | null)[]>([])

  useScrollFrame(
    ({ progress, scrollY }) => {
      if (reducedMotion) return
      const waveTop = progress * MAX_DRAIN
      layers.forEach((layer, i) => {
        const jitter = Math.sin(scrollY / layer.jitterPeriod + layer.phase) * layer.jitterAmp
        const top = Math.min(100, Math.max(0, waveTop - layer.peek + jitter))
        const offsetPx = scrollY * layer.speed
        const layerEl = layerRefs.current[i]
        if (layerEl) layerEl.style.top = `${top}%`
        const stripEl = stripRefs.current[i]
        if (stripEl) stripEl.style.backgroundPositionX = `${offsetPx}px`
      })
    },
    location.pathname,
  )

  // Reduced motion: static, no scroll-driven movement at all — set once.
  const staticTop = reducedMotion ? 35 : 0

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: "var(--drain-bg, var(--cream))",
        overflow: "hidden",
      }}
    >
      {layers.map((layer, i) => {
        const top = reducedMotion ? Math.max(0, staticTop - layer.peek) : 0
        const tile = waveTile(layer.color, layer.variant)

        return (
          <div
            key={i}
            ref={(el) => {
              layerRefs.current[i] = el
            }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              top: `${top}%`,
              overflow: "hidden",
            }}
          >
            {/* Wavy surface strip: transparent above the curve (reveals
                whatever is behind this layer), solid below it. */}
            <div
              ref={(el) => {
                stripRefs.current[i] = el
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: tile.height,
                backgroundImage: `url("${tile.uri}")`,
                backgroundRepeat: "repeat-x",
                backgroundSize: `${tile.width}px ${tile.height}px`,
                backgroundPositionX: 0,
              }}
            />
            {/* Solid body of the liquid, starting right where the wave
                strip ends so the curve and the flat fill join seamlessly. */}
            <div
              style={{
                position: "absolute",
                top: tile.height - 1,
                left: 0,
                right: 0,
                bottom: 0,
                background: layer.color,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
