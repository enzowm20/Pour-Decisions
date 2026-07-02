import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"

export interface MenuCocktail {
  id: string
  name: string
  photo?: string
  ingredientNames: string[]
  sellPrice?: number
  outOfStock?: boolean
}

interface Props {
  cocktails: MenuCocktail[]
  onOrder: (id: string) => void
  orderedId?: string | null
}

const ITEM_W    = 120
const ITEM_H    = 160
const SQUARE_W  = ITEM_W + 24   // 144px initial square
const EXPAND_MS = 480
const COPIES    = 12
const COPY_START = 5

type Phase = "square" | "retracting" | "expanding" | "spinning" | "landed"

// Colourful placeholder for cocktails without a photo
function PlaceholderPhoto({ name }: { name: string }) {
  const hues   = [200, 160, 280, 30, 320, 120, 45, 260]
  const hue    = hues[(name.charCodeAt(0) ?? 0) % hues.length]
  return (
    <div style={{
      width: "100%", height: "100%",
      background: `linear-gradient(160deg,hsl(${hue},40%,22%),hsl(${(hue+40)%360},50%,18%))`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 40, fontWeight: 800,
      color: `hsl(${hue},60%,72%)`,
      letterSpacing: "-0.02em", userSelect: "none",
    }}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function MenuSlotMachine({ cocktails, onOrder, orderedId }: Props) {
  const reelRef     = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const posRef      = useRef(0)
  const speedRef    = useRef(0)
  const landingRef  = useRef(false)
  const rafRef      = useRef(0)
  const phaseRef    = useRef<Phase>("square")
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([])

  const [expanded,    setExpanded]    = useState(false)
  const [selected,    setSelected]    = useState(false)
  const [showFrame,   setShowFrame]   = useState(false)
  const [spinning,    setSpinning]    = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [dots,        setDots]        = useState(".")

  const N         = cocktails.length
  const SET_W     = N * ITEM_W
  const REEL_ITEMS = useMemo(
    () => (N > 0 ? Array.from({ length: COPIES }, () => cocktails).flat() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [N, cocktails],
  )
  const INITIAL_POS = (SQUARE_W - ITEM_W) / 2 - COPY_START * SET_W

  // Seed position on mount / when N changes
  useEffect(() => {
    if (N === 0) return
    posRef.current = INITIAL_POS
    if (reelRef.current) reelRef.current.style.transform = `translateX(${INITIAL_POS}px)`
  }, [N, INITIAL_POS])

  // Thinking-dots animation
  useEffect(() => {
    if (!spinning) { setDots("."); return }
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400)
    return () => clearInterval(id)
  }, [spinning])

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms); timersRef.current.push(id)
  }
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  const getAnchor = () => {
    const vW = viewportRef.current?.offsetWidth ?? SQUARE_W
    return (vW - ITEM_W) / 2
  }

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    landingRef.current = false
    speedRef.current   = 0
    setSpinning(true)
    setSelected(false)
    setSelectedIdx(null)
    phaseRef.current = "spinning"

    // Normalise strip — prevents blank reel on repeated spins
    const anchor    = getAnchor()
    const reel      = reelRef.current
    if (reel && N > 0) {
      const N_current = Math.round((anchor - posRef.current) / ITEM_W)
      const N_visual  = ((N_current % N) + N) % N
      const N_norm    = COPY_START * N + N_visual
      const normPos   = anchor - N_norm * ITEM_W
      posRef.current  = normPos
      reel.style.transition = ""
      reel.style.transform  = `translateX(${normPos}px)`
    }

    // Random spin duration before decelerating
    addTimer(() => { landingRef.current = true }, 1800 + Math.random() * 2200)

    const MAX_SPEED  = 1.6
    const ACCEL      = 0.07
    const FRICTION   = 0.958
    const SNAP_SPEED = 0.12

    const loop = (t: number, lastT: number) => {
      const dt   = Math.min(t - lastT, 50)
      const r    = reelRef.current
      if (!r) return

      if (landingRef.current) {
        speedRef.current *= Math.pow(FRICTION, dt / 16.67)

        if (speedRef.current > SNAP_SPEED) {
          posRef.current -= speedRef.current * dt
          r.style.transform = `translateX(${posRef.current}px)`
          rafRef.current = requestAnimationFrame(t2 => loop(t2, t))
        } else {
          // Hand off to smooth CSS snap — stops exactly in frame
          const A      = getAnchor()
          const N_snap = Math.round((A - posRef.current) / ITEM_W)
          const snapTo = A - N_snap * ITEM_W
          const dist   = Math.abs(snapTo - posRef.current)
          const dur    = Math.max(200, Math.min(700, dist / Math.max(speedRef.current, 0.01)))

          r.style.transition = `transform ${dur}ms cubic-bezier(0.25,0.46,0.45,0.94)`
          r.style.transform  = `translateX(${snapTo}px)`
          posRef.current     = snapTo

          const idx = ((N_snap % N) + N) % N
          addTimer(() => {
            r.style.transition = ""
            phaseRef.current   = "landed"
            setSpinning(false)
            setSelected(true)
            setSelectedIdx(idx)
          }, dur + 20)
        }
      } else {
        speedRef.current    = Math.min(speedRef.current + ACCEL * (dt / 16.67), MAX_SPEED)
        posRef.current     -= speedRef.current * dt
        r.style.transform   = `translateX(${posRef.current}px)`
        rafRef.current      = requestAnimationFrame(t2 => loop(t2, t))
      }
    }

    rafRef.current = requestAnimationFrame(t => loop(t, t))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N])

  const doExpand = useCallback(() => {
    phaseRef.current = "expanding"
    setExpanded(true)
    addTimer(() => { setShowFrame(true); startLoop() }, EXPAND_MS + 40)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLoop])

  const doRetract = useCallback(() => {
    phaseRef.current = "retracting"
    cancelAnimationFrame(rafRef.current)
    setShowFrame(false)

    // Snap to square-centred item before retracting
    const A_sq    = (SQUARE_W - ITEM_W) / 2
    const N_snap  = Math.round((A_sq - posRef.current) / ITEM_W)
    const snapPos = A_sq - N_snap * ITEM_W
    posRef.current = snapPos
    if (reelRef.current) {
      reelRef.current.style.transition = ""
      reelRef.current.style.transform  = `translateX(${snapPos}px)`
    }
    setExpanded(false)
    addTimer(() => doExpand(), EXPAND_MS + 40)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doExpand])

  function handleClick() {
    if (N === 0) return
    const phase = phaseRef.current
    if (phase === "expanding" || phase === "retracting" || phase === "spinning") return
    clearTimers()
    if (phase === "square")  doExpand()
    if (phase === "landed")  { setSelectedIdx(null); setSelected(false); doRetract() }
  }

  useEffect(() => () => { clearTimers(); cancelAnimationFrame(rafRef.current) }, []) // eslint-disable-line

  if (N === 0) return null

  const selectedCocktail = selectedIdx !== null ? cocktails[selectedIdx] ?? null : null
  const borderColor = selected ? "var(--teal)" : "var(--gold)"
  const headerBg    = selected ? "var(--teal)" : "var(--gold)"
  const headerColor = selected ? "var(--bg)"   : "var(--on-gold,#1a1a0e)"

  return (
    <div className="flex flex-col items-center">
      <style>{`
        @keyframes smDropIn {
          from { opacity:0; transform:translateY(-10px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>

      {/* ── slot machine body ── */}
      <div
        role="button"
        aria-label="Spin for a random cocktail"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleClick() }}
        style={{
          width: expanded ? "100%" : SQUARE_W,
          transition: `width ${EXPAND_MS}ms cubic-bezier(0.4,0,0.2,1)`,
          cursor: (spinning || phaseRef.current === "expanding" || phaseRef.current === "retracting") ? "default" : "pointer",
          outline: "none",
        }}
      >
        <div style={{
          border: `2px solid ${borderColor}`,
          borderRadius: 12, overflow: "hidden",
          background: "var(--surface-raised)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
          transition: "border-color 0.6s ease",
        }}>
          {/* header bar */}
          <div style={{
            padding: "5px 0", textAlign: "center",
            background: headerBg, color: headerColor,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            transition: "background 0.6s ease, color 0.6s ease",
          }}>
            FEELING LUCKY?
          </div>

          {/* reel viewport */}
          <div ref={viewportRef} style={{ height: ITEM_H, overflow: "hidden", position: "relative" }}>
            <div
              ref={reelRef}
              style={{
                display: "flex", flexDirection: "row",
                transform: `translateX(${INITIAL_POS}px)`,
                willChange: "transform",
              }}
            >
              {REEL_ITEMS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0, width: ITEM_W, height: ITEM_H,
                    overflow: "hidden",
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {c.photo
                    ? <img src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <PlaceholderPhoto name={c.name} />
                  }
                </div>
              ))}
            </div>

            {/* edge fades */}
            <div style={{ position:"absolute",inset:"0 auto 0 0",width:52,background:"linear-gradient(to right,var(--surface-raised),transparent)",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",inset:"0 0 0 auto",width:52,background:"linear-gradient(to left,var(--surface-raised),transparent)",pointerEvents:"none" }}/>

            {/* selector frame — only after expansion */}
            {showFrame && (
              <div style={{
                position: "absolute", top: 6, bottom: 6,
                left: "50%",
                transform: `translateX(-${ITEM_W / 2}px)`,
                width: ITEM_W,
                border: `2.5px solid ${borderColor}`,
                borderRadius: 10,
                boxShadow: selected
                  ? "0 0 18px rgba(0,200,180,0.4), inset 0 0 10px rgba(0,200,180,0.1)"
                  : "0 0 18px rgba(212,175,55,0.4), inset 0 0 10px rgba(212,175,55,0.1)",
                pointerEvents: "none",
                transition: "border-color 0.6s ease, box-shadow 0.6s ease",
              }}/>
            )}
          </div>

          {/* footer label */}
          <div style={{
            padding: "4px 0", textAlign: "center",
            fontSize: 11, fontWeight: 600,
            color: selected ? "var(--teal)" : "var(--gold)",
            transition: "color 0.6s ease",
            minHeight: 22,
          }}>
            {!expanded
              ? "Tap to spin"
              : spinning
                ? `Rolling${dots}`
                : selected
                  ? "✓ Lucky pour — spin again to re-roll"
                  : ""}
          </div>
        </div>
      </div>

      {/* ── selection dropdown ── */}
      {selectedCocktail && (
        <div style={{
          width: "100%", marginTop: 12,
          animation: "smDropIn 0.35s ease forwards",
          background: "var(--surface-raised)",
          border: "1.5px solid var(--teal)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
            {/* photo panel */}
            {selectedCocktail.photo && (
              <div style={{ width: 90, flexShrink: 0, overflow: "hidden" }}>
                <img
                  src={selectedCocktail.photo}
                  alt={selectedCocktail.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}
            {/* info panel */}
            <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--cream)", margin: 0 }}>
                {selectedCocktail.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--cream-dim)", margin: 0, lineHeight: 1.5 }}>
                {selectedCocktail.ingredientNames.join(", ")}
              </p>
              {selectedCocktail.sellPrice !== undefined && (
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", margin: 0 }}>
                  ${selectedCocktail.sellPrice.toFixed(2)}
                </p>
              )}
              <div style={{ marginTop: "auto", paddingTop: 4 }}>
                {selectedCocktail.outOfStock ? (
                  <button type="button" disabled style={outOfStockBtn}>Out of Stock</button>
                ) : (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onOrder(selectedCocktail.id) }}
                    style={orderedId === selectedCocktail.id ? orderedBtn : orderBtn}
                  >
                    {orderedId === selectedCocktail.id ? "Ordered ✓" : "Order Cocktail"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const baseBtn: CSSProperties = {
  padding: "7px 18px", borderRadius: 8, border: "none",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
}
const orderBtn:     CSSProperties = { ...baseBtn, background: "var(--teal)",   color: "var(--on-teal)" }
const orderedBtn:   CSSProperties = { ...baseBtn, background: "var(--berry)",  color: "var(--on-berry,#fff)" }
const outOfStockBtn:CSSProperties = { ...baseBtn, background: "#4a3220",       color: "var(--cream)", cursor: "not-allowed", opacity: 0.7 }
