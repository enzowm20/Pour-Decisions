import { useEffect, useRef } from "react"

interface Props {
  onClick: () => void
  disabled?: boolean
  spinning?: boolean
}

// Dice dot positions for faces 1-6
const DICE_FACES: [number, number][][] = [
  [[0, 0]],
  [[-4, -4], [4, 4]],
  [[-4, -4], [0, 0], [4, 4]],
  [[-4, -4], [4, -4], [-4, 4], [4, 4]],
  [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]],
  [[-4, -4], [4, -4], [-4, 0], [4, 0], [-4, 4], [4, 4]],
]

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const dice1AngleRef = useRef(0)
  const dice2AngleRef = useRef(Math.PI)
  const liquidPhaseRef = useRef(0)
  const frameRef = useRef<number>(0)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let running = true
    const RADIUS = 22
    const CX = 60
    const GLASS_BOTTOM = 88

    function tick() {
      if (!running || !svgRef.current) return
      const svg = svgRef.current

      const speed = spinning ? 0.045 : 0.018
      dice1AngleRef.current += speed
      dice2AngleRef.current += speed
      liquidPhaseRef.current += 0.04

      // Dice 1
      const d1 = svg.querySelector<SVGGElement>("#lucky-die-1")
      if (d1) {
        const x = CX + Math.cos(dice1AngleRef.current) * RADIUS
        const y = GLASS_BOTTOM - 18 + Math.sin(dice1AngleRef.current) * 7
        d1.setAttribute("transform", `translate(${x},${y}) rotate(${(dice1AngleRef.current * 180) / Math.PI})`)
      }

      // Dice 2
      const d2 = svg.querySelector<SVGGElement>("#lucky-die-2")
      if (d2) {
        const x = CX + Math.cos(dice2AngleRef.current) * RADIUS
        const y = GLASS_BOTTOM - 18 + Math.sin(dice2AngleRef.current) * 7
        d2.setAttribute("transform", `translate(${x},${y}) rotate(${(dice2AngleRef.current * 180) / Math.PI + 45})`)
      }

      // Liquid surface slosh
      const liquid = svg.querySelector<SVGPathElement>("#lucky-liquid")
      if (liquid) {
        const phase = liquidPhaseRef.current
        const amp = spinning ? 3.5 : 1.5
        const sway = Math.sin(phase) * amp
        const sway2 = Math.sin(phase * 1.3 + 1) * (amp * 0.5)
        // liquid fills the glass cone from y=56 to y=90; glass edges at those points
        // At y=56: glass width ~0 (near top of cone converge); at y=88 width ~46
        // Surface sits at y≈62 (upper part of glass)
        const surfaceY = 63
        const lx = 60 - 20 + sway2
        const rx = 60 + 20 + sway2
        const midY = surfaceY + sway
        liquid.setAttribute(
          "d",
          `M ${lx} ${surfaceY + sway} Q ${60 + sway} ${midY - 3} ${rx} ${surfaceY + sway}` +
            ` L 83 88 Q 60 91 37 88 Z`,
        )
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [spinning])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Generate a random cocktail"
      className="group relative mx-auto flex flex-col items-center gap-2 rounded-2xl border border-[var(--teal)]/30 bg-[var(--surface-raised)] p-5 transition-all duration-200 hover:border-[var(--teal)]/60 hover:bg-[var(--teal)]/8 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      style={{ minWidth: 140 }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 120 120"
        width={120}
        height={120}
        aria-hidden="true"
      >
        {/* ── Glass shadow / stem ── */}
        <line x1="60" y1="88" x2="60" y2="106" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="44" y1="106" x2="76" y2="106" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {/* ── Liquid fill (updated by rAF) ── */}
        <clipPath id="lucky-glass-clip">
          <polygon points="14,20 106,20 83,88 37,88" />
        </clipPath>
        <path
          id="lucky-liquid"
          d="M 40 63 Q 60 60 80 63 L 83 88 Q 60 91 37 88 Z"
          fill="var(--gold)"
          opacity="0.35"
          clipPath="url(#lucky-glass-clip)"
        />

        {/* ── Liquid shimmer lines ── */}
        <g clipPath="url(#lucky-glass-clip)" opacity="0.18">
          <line x1="44" y1="70" x2="76" y2="70" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="x1" values="40;48;40" dur="3.1s" repeatCount="indefinite" />
            <animate attributeName="x2" values="80;72;80" dur="3.1s" repeatCount="indefinite" />
            <animate attributeName="y1" values="70;73;70" dur="3.1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="70;73;70" dur="3.1s" repeatCount="indefinite" />
          </line>
          <line x1="50" y1="78" x2="70" y2="78" stroke="var(--cream)" strokeWidth="1" strokeLinecap="round">
            <animate attributeName="x1" values="48;54;48" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="x2" values="72;66;72" dur="2.4s" repeatCount="indefinite" />
          </line>
        </g>

        {/* ── Olive / garnish ── */}
        <circle cx="60" cy="62" r="4" fill="var(--sage)" opacity="0.8" />
        <line x1="60" y1="55" x2="60" y2="62" stroke="var(--sage)" strokeWidth="1.2" opacity="0.7" />

        {/* ── Glass outline (drawn on top so it clips the liquid) ── */}
        <polygon
          points="14,20 106,20 83,88 37,88"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          opacity="0.85"
        />
        {/* Rim highlight */}
        <line x1="14" y1="20" x2="106" y2="20" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

        {/* ── Dice 1 ── */}
        <g id="lucky-die-1">
          <rect x="-9" y="-9" width="18" height="18" rx="3.5"
            fill="var(--surface-raised)" stroke="var(--gold)" strokeWidth="1.8" opacity="0.92" />
          {/* face 5 dots */}
          {DICE_FACES[4].map(([dx, dy], i) => (
            <circle key={i} cx={dx} cy={dy} r="2.2" fill="var(--gold)" />
          ))}
        </g>

        {/* ── Dice 2 ── */}
        <g id="lucky-die-2">
          <rect x="-9" y="-9" width="18" height="18" rx="3.5"
            fill="var(--surface-raised)" stroke="var(--teal)" strokeWidth="1.8" opacity="0.92" />
          {/* face 3 dots */}
          {DICE_FACES[2].map(([dx, dy], i) => (
            <circle key={i} cx={dx} cy={dy} r="2.2" fill="var(--teal)" />
          ))}
        </g>

        {/* ── Spin ring glow when spinning ── */}
        {spinning && (
          <circle cx="60" cy="70" r="25" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.2">
            <animate attributeName="r" values="22;28;22" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      <span className="text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
        {spinning ? "Rolling…" : "Feeling Lucky?"}
      </span>
    </button>
  )
}
