import { useLocation } from "react-router-dom"
import { useScrollProgress } from "../hooks/useScrollProgress"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion"
import { waveTile } from "../lib/waveTile"
import { liquidLayersForTheme, themeForPath } from "../lib/theme"

// At progress 0 (top of page) the liquid fills the full viewport; at progress 1
// (bottom) it's drained down to a thin remainder near the floor of the bottle.
const MAX_DRAIN = 95

export default function DrainingBackground() {
  const location = useLocation()
  const { progress, scrollY } = useScrollProgress(location.pathname)
  const reducedMotion = usePrefersReducedMotion()

  const theme = themeForPath(location.pathname)
  const layers = liquidLayersForTheme(theme)

  // Full at the top of the page (0% drained), down to a thin remainder at the
  // bottom of the page (MAX_DRAIN% drained).
  const waveTop = reducedMotion ? 35 : progress * MAX_DRAIN

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        background: "var(--cream)",
        overflow: "hidden",
      }}
    >
      {layers.map((layer, i) => {
        const jitter = reducedMotion
          ? 0
          : Math.sin(scrollY / layer.jitterPeriod + layer.phase) * layer.jitterAmp
        const top = Math.min(100, Math.max(0, waveTop - layer.peek + jitter))
        const offsetPx = reducedMotion ? 0 : scrollY * layer.speed
        const tile = waveTile(layer.color, layer.variant)

        return (
          <div
            key={i}
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
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: tile.height,
                backgroundImage: `url("${tile.uri}")`,
                backgroundRepeat: "repeat-x",
                backgroundSize: `${tile.width}px ${tile.height}px`,
                backgroundPositionX: `${offsetPx}px`,
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
