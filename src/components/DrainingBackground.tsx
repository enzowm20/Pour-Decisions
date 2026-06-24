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
      const viewportH = window.innerHeight
      layers.forEach((layer, i) => {
        const jitter = Math.sin(scrollY / layer.jitterPeriod + layer.phase) * layer.jitterAmp
        const top = Math.min(100, Math.max(0, waveTop - layer.peek + jitter))
        const offsetPx = scrollY * layer.speed
        const layerEl = layerRefs.current[i]
        // translateY (a compositor-only transform) instead of animating the
        // `top` property — `top` forces a synchronous layout recalculation
        // on every single frame, which is cheap enough on a desktop GPU to
        // go unnoticed but is exactly what reads as choppy on an iPad's
        // weaker CPU/GPU pairing. A transform never touches layout, so the
        // browser can animate it purely on the compositor thread.
        if (layerEl) layerEl.style.transform = `translate3d(0, ${(top / 100) * viewportH}px, 0)`
        const stripEl = stripRefs.current[i]
        if (stripEl) stripEl.style.backgroundPositionX = `${offsetPx}px`
      })
    },
    location.pathname,
  )

  // Reduced motion: static, no scroll-driven movement at all — set once.
  const staticTopPercent = reducedMotion ? 35 : 0

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
        const staticTop = reducedMotion ? Math.max(0, staticTopPercent - layer.peek) : 0
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
              top: 0,
              // Fixed full-height box, always anchored at the top — the
              // scroll-driven position above is purely a transform on this
              // same box now, never a layout-affecting `top` change.
              height: "100%",
              willChange: "transform",
              transform: `translate3d(0, ${staticTop}vh, 0)`,
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
