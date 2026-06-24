import { useEffect, useRef } from "react"

export interface ScrollState {
  progress: number // 0 at top, 1 at bottom
  scrollY: number // raw scroll offset in px, used for horizontal parallax
}

// Runs `callback` on every animation frame with the CURRENT scroll position,
// rather than reacting to the browser's native "scroll" event. That
// distinction is what fixes choppiness on iOS/iPad: during touch-driven
// momentum scrolling, Safari fires "scroll" events far less often than the
// page actually visually scrolls (the compositor animates the scroll
// position independently of JS), so anything that only updates in response
// to that event visibly stutters between sparse updates. Sampling
// window.scrollY directly every rAF tick instead always matches what's
// actually on screen, on any device.
//
// The callback is also never routed through setState — callers write
// directly to DOM nodes via refs instead, so scrolling never triggers a
// React re-render (which was the same class of stutter fixed in the
// flavor-picker animation: per-frame setState forces the whole consuming
// component to re-render just to move a number).
export function useScrollFrame(callback: (state: ScrollState) => void, resetKey: unknown) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let raf = 0
    function tick() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      callbackRef.current({
        progress: Math.min(1, Math.max(0, progress)),
        scrollY: Math.max(0, window.scrollY),
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [resetKey])
}
