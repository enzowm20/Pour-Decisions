import { useEffect, useState } from "react"

export interface ScrollState {
  progress: number // 0 at top, 1 at bottom
  scrollY: number // raw scroll offset in px, used for horizontal parallax
}

// `resetKey` (typically the route pathname) re-subscribes the listeners and
// re-measures immediately, so each page tracks its own scroll independently.
export function useScrollProgress(resetKey: unknown): ScrollState {
  const [state, setState] = useState<ScrollState>({ progress: 0, scrollY: 0 })

  useEffect(() => {
    let frame: number | null = null

    function measure() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      setState({
        progress: Math.min(1, Math.max(0, progress)),
        scrollY: Math.max(0, window.scrollY),
      })
      frame = null
    }

    function onScrollOrResize() {
      if (frame === null) {
        frame = requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener("scroll", onScrollOrResize, { passive: true })
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      window.removeEventListener("scroll", onScrollOrResize)
      window.removeEventListener("resize", onScrollOrResize)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [resetKey])

  return state
}
