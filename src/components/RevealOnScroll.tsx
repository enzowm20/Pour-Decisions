import { useEffect, useRef, useState, type ReactNode } from "react"

// Fades a block in once it scrolls into view (or is already in view the
// moment the page mounts — e.g. switching tabs), then leaves it be. Used both
// for "appear one by one while scrolling" and "fade in on page open".
export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Anything already on screen the instant this mounts (e.g. opening a
    // tab) reveals immediately via a direct, synchronous check — this is
    // what "fade in on page open" actually depends on, since waiting on the
    // observer's first callback isn't guaranteed to land before paint, and a
    // tall wrapped section (a long ingredient list, say) may never show
    // enough of itself in the viewport at once to clear a ratio-based
    // threshold at all.
    const rect = el.getBoundingClientRect()
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      setVisible(true)
      return
    }

    // Anything below the fold reveals the normal way, as it scrolls in.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  )
}
