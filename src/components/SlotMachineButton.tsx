import { useEffect, useRef } from "react"

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

// ── Cocktail SVG graphics ─────────────────────────────────────────────────────
// Each is 80×100 viewBox, flat colour + linework style

const MartiniSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid fill */}
    <polygon points="20,14 60,14 40,52" fill="#C9E87A" opacity="0.85"/>
    {/* glass V */}
    <polyline points="8,8 40,58 72,8" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
    {/* rim */}
    <line x1="8" y1="8" x2="72" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* stem */}
    <line x1="40" y1="58" x2="40" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* base */}
    <line x1="24" y1="82" x2="56" y2="82" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* olive + pick */}
    <circle cx="40" cy="14" r="5" fill="#5A9E5A" stroke="var(--cream)" strokeWidth="1.5"/>
    <line x1="40" y1="9" x2="40" y2="2" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="40" cy="2" r="2" fill="#E85A5A"/>
  </svg>
)

const OldFashionedSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <rect x="16" y="42" width="48" height="38" rx="2" fill="#D97B2A" opacity="0.85"/>
    {/* glass */}
    <path d="M14 20 L18 80 Q18 82 20 82 L60 82 Q62 82 62 80 L66 20 Z"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* rim */}
    <line x1="14" y1="20" x2="66" y2="20" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* ice cube */}
    <rect x="24" y="28" width="14" height="14" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,0.3)"/>
    <rect x="42" y="32" width="12" height="12" rx="2" stroke="var(--cream)" strokeWidth="1.8" fill="rgba(200,230,255,0.3)"/>
    {/* orange peel curl */}
    <path d="M52 22 Q62 16 60 26" stroke="#E8A44A" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
)

const HighballSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <rect x="18" y="44" width="44" height="36" rx="2" fill="#A8D87A" opacity="0.8"/>
    {/* glass */}
    <path d="M16 12 L18 82 Q18 84 20 84 L60 84 Q62 84 62 82 L64 12 Z"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* rim */}
    <line x1="16" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* lime wheel on rim */}
    <circle cx="56" cy="12" r="8" fill="#78C840" stroke="var(--cream)" strokeWidth="1.5"/>
    <line x1="56" y1="4" x2="56" y2="20" stroke="var(--cream)" strokeWidth="1"/>
    <line x1="48" y1="12" x2="64" y2="12" stroke="var(--cream)" strokeWidth="1"/>
    <line x1="50" y1="6" x2="62" y2="18" stroke="var(--cream)" strokeWidth="1"/>
    <line x1="62" y1="6" x2="50" y2="18" stroke="var(--cream)" strokeWidth="1"/>
    {/* mint sprig */}
    <line x1="28" y1="44" x2="28" y2="18" stroke="#4E9A40" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="24" cy="30" rx="5" ry="3" fill="#4E9A40" transform="rotate(-30 24 30)"/>
    <ellipse cx="32" cy="24" rx="5" ry="3" fill="#5AB04A" transform="rotate(20 32 24)"/>
  </svg>
)

const CoupeSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid fill in bowl */}
    <path d="M16 10 Q16 44 40 48 Q64 44 64 10 Z" fill="#E85A8A" opacity="0.8"/>
    {/* bowl outline */}
    <path d="M12 8 Q12 48 40 52 Q68 48 68 8 Z"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* rim */}
    <line x1="12" y1="8" x2="68" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* stem */}
    <line x1="40" y1="52" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* base */}
    <line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* cherry */}
    <circle cx="40" cy="14" r="5" fill="#C0182A" stroke="var(--cream)" strokeWidth="1.5"/>
    <path d="M40 9 Q44 4 48 6" stroke="#4E9A40" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
)

const FluteSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <path d="M28 52 L26 80 L54 80 L52 52 Z" fill="#F0D060" opacity="0.85"/>
    {/* glass */}
    <path d="M24 8 L26 82 Q26 84 28 84 L52 84 Q54 84 54 82 L56 8 Z"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* slight taper at base */}
    <path d="M24 8 Q32 12 40 12 Q48 12 56 8"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* stem */}
    <line x1="40" y1="84" x2="40" y2="92" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* base */}
    <line x1="28" y1="92" x2="52" y2="92" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* bubbles */}
    <circle cx="36" cy="70" r="2" fill="var(--cream)" opacity="0.7"/>
    <circle cx="42" cy="60" r="1.5" fill="var(--cream)" opacity="0.6"/>
    <circle cx="38" cy="52" r="1" fill="var(--cream)" opacity="0.5"/>
    <circle cx="44" cy="74" r="1.5" fill="var(--cream)" opacity="0.6"/>
  </svg>
)

const MargaritaSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <path d="M20 14 L40 54 L60 14 Z" fill="#78D8B0" opacity="0.8"/>
    {/* wide V */}
    <polyline points="6,10 40,58 74,10" stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
    {/* wide rim */}
    <line x1="6" y1="10" x2="74" y2="10" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* salt rim dashes */}
    {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
      const angle = (i / 13) * Math.PI
      const x1 = 40 - Math.cos(angle) * 34
      const y1 = 10 - Math.sin(angle) * 0
      const x2 = 40 - Math.cos(angle) * 34
      const y2b = y1 - 4
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2b} stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    })}
    {/* stem */}
    <line x1="40" y1="58" x2="40" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* base */}
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* lime slice on rim */}
    <path d="M66 10 Q74 2 78 10" stroke="#78C840" strokeWidth="2" fill="#78C840" opacity="0.9" strokeLinecap="round"/>
  </svg>
)

const WineGlassSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <path d="M22 30 Q20 52 40 56 Q60 52 58 30 Z" fill="#C03060" opacity="0.8"/>
    {/* bowl */}
    <path d="M18 8 Q16 54 40 58 Q64 54 62 8"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* rim */}
    <line x1="18" y1="8" x2="62" y2="8" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* waist */}
    <path d="M40 58 Q36 62 36 70 Q36 76 40 78 Q44 76 44 70 Q44 62 40 58 Z"
      stroke="var(--cream)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
    {/* base */}
    <line x1="26" y1="78" x2="54" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const ShotGlassSVG = () => (
  <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* liquid */}
    <path d="M24 38 L26 74 L54 74 L56 38 Z" fill="#D97B2A" opacity="0.85"/>
    {/* glass (trapezoid, wider at top) */}
    <path d="M20 28 L24 78 L56 78 L60 28 Z"
      stroke="var(--cream)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    {/* rim */}
    <line x1="20" y1="28" x2="60" y2="28" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* base line */}
    <line x1="24" y1="78" x2="56" y2="78" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round"/>
    {/* lemon wedge on rim */}
    <path d="M54 28 L66 18 L68 26 Z" fill="#F0D060" stroke="var(--cream)" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

const COCKTAILS = [
  { id: "martini",     name: "Martini",      graphic: <MartiniSVG />,    accent: "#C9E87A" },
  { id: "oldfashion",  name: "Old Fashioned", graphic: <OldFashionedSVG />, accent: "#D97B2A" },
  { id: "highball",    name: "Highball",      graphic: <HighballSVG />,   accent: "#A8D87A" },
  { id: "coupe",       name: "Coupe",         graphic: <CoupeSVG />,      accent: "#E85A8A" },
  { id: "flute",       name: "Champagne",     graphic: <FluteSVG />,      accent: "#F0D060" },
  { id: "margarita",   name: "Margarita",     graphic: <MargaritaSVG />,  accent: "#78D8B0" },
  { id: "wine",        name: "Wine",          graphic: <WineGlassSVG />,  accent: "#C03060" },
  { id: "shot",        name: "Shot",          graphic: <ShotGlassSVG />,  accent: "#D97B2A" },
]

const N = COCKTAILS.length
const ITEM_H = 128   // px per reel cell
const SET_H  = N * ITEM_H

// 5 copies of the list so we always have room to spin
const REEL_ITEMS = [...COCKTAILS, ...COCKTAILS, ...COCKTAILS, ...COCKTAILS, ...COCKTAILS]
// Start centred in copy 2 (index N)
const INITIAL_Y = -(N * ITEM_H)

export default function SlotMachineButton({ onClick, disabled, spinning }: Props) {
  const reelRef  = useRef<HTMLDivElement>(null)
  const posRef   = useRef(INITIAL_Y)
  const animRef  = useRef<Animation | null>(null)
  const spunRef  = useRef(false)

  // Trigger spin when spinning prop becomes true
  useEffect(() => {
    if (!spinning) { spunRef.current = false; return }
    if (spunRef.current) return
    spunRef.current = true

    const reel = reelRef.current
    if (!reel) return

    // Cancel any in-progress animation
    animRef.current?.cancel()

    const targetIdx = Math.floor(Math.random() * N)
    const from = posRef.current
    // 3 full set rotations + land on target (always go further negative)
    const to = from - (3 * SET_H + targetIdx * ITEM_H)

    const anim = reel.animate(
      [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
      { duration: 1800, easing: "cubic-bezier(0.08, 0.6, 0.2, 1.0)", fill: "forwards" }
    )
    animRef.current = anim

    anim.onfinish = () => {
      // Commit the final position, then reset to equivalent position in the strip middle
      if (!reel) return
      const normalised = INITIAL_Y - targetIdx * ITEM_H
      anim.commitStyles()
      anim.cancel()
      reel.style.transform = `translateY(${normalised}px)`
      posRef.current = normalised
    }
  }, [spinning])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Spin for a random cocktail"
      style={{ background: "none", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer" }}
      className="group"
    >
      {/* ── Slot machine frame ───────────────────────────── */}
      <div style={{
        width: 170,
        border: "2px solid var(--gold)",
        borderRadius: 14,
        overflow: "hidden",
        background: "var(--surface-raised)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        position: "relative",
      }}>
        {/* header */}
        <div style={{
          padding: "6px 0 5px",
          textAlign: "center",
          background: "var(--gold)",
          color: "var(--on-gold)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}>
          LUCKY POUR
        </div>

        {/* viewport — shows one cell */}
        <div style={{ height: ITEM_H, overflow: "hidden", position: "relative" }}>
          {/* reel strip */}
          <div
            ref={reelRef}
            style={{ transform: `translateY(${INITIAL_Y}px)`, willChange: "transform" }}
          >
            {REEL_ITEMS.map((c, i) => (
              <div key={i} style={{
                height: ITEM_H,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ width: 72, height: 92 }}>{c.graphic}</div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: c.accent,
                  textTransform: "uppercase",
                }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>

          {/* top fade */}
          <div style={{
            position: "absolute", inset: "0 0 auto 0", height: 36,
            background: "linear-gradient(to bottom, var(--surface-raised), transparent)",
            pointerEvents: "none",
          }}/>
          {/* bottom fade */}
          <div style={{
            position: "absolute", inset: "auto 0 0 0", height: 36,
            background: "linear-gradient(to top, var(--surface-raised), transparent)",
            pointerEvents: "none",
          }}/>

          {/* centre line indicator */}
          <div style={{
            position: "absolute",
            top: "50%", left: 8, right: 8,
            height: 1,
            background: "rgba(var(--gold-rgb, 212,175,55), 0.25)",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}/>
        </div>

        {/* footer */}
        <div style={{
          padding: "6px 0 7px",
          textAlign: "center",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: spinning ? "var(--gold)" : "var(--teal)",
          transition: "color 0.3s",
        }}>
          {spinning ? "Rolling…" : "Feeling Lucky?"}
        </div>
      </div>
    </button>
  )
}
