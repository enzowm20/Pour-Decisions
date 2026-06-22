import { useMemo } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

const VIEWBOX = 320
const CENTER = VIEWBOX / 2
const RADIUS = 130

interface Props {
  selectedTags: FlavorTag[]
  onToggle: (tag: FlavorTag) => void
}

// Cheap deterministic pseudo-randomness (no Math.random) so layout is stable
// across re-renders but still looks scattered rather than evenly spaced.
function pseudoRandom(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export default function FlavorNeuralPicker({ selectedTags, onToggle }: Props) {
  const nodes = useMemo(() => {
    return FLAVOR_TAGS.map((tag, i) => {
      const angle = (i / FLAVOR_TAGS.length) * Math.PI * 2 - Math.PI / 2
      const jitter = ((i * 53) % 17) - 8
      const r = RADIUS + jitter
      const x = CENTER + r * Math.cos(angle)
      const y = CENTER + r * Math.sin(angle)

      // Three irregular drift offsets the float animation visits in turn,
      // each a different size/direction, so the motion reads as erratic
      // wandering rather than a clean bob up and down.
      const drift = (salt: number, spread: number) => (pseudoRandom(i, salt) - 0.5) * spread

      // A bowed control point off the straight line to the core, alternating
      // curve direction per node, so connections look like organic synapse
      // arcs rather than rigid spokes.
      const mx = (CENTER + x) / 2
      const my = (CENTER + y) / 2
      const dx = x - CENTER
      const dy = y - CENTER
      const len = Math.hypot(dx, dy) || 1
      const bow = (i % 2 === 0 ? 1 : -1) * (16 + pseudoRandom(i, 9) * 18)
      const ctrlX = mx + (-dy / len) * bow
      const ctrlY = my + (dx / len) * bow

      return {
        tag,
        x,
        y,
        path: `M ${CENTER} ${CENTER} Q ${ctrlX} ${ctrlY} ${x} ${y}`,
        duration: 4 + pseudoRandom(i, 1) * 3.5,
        delay: pseudoRandom(i, 2) * 4,
        dx1: drift(3, 26),
        dy1: drift(4, 26),
        dx2: drift(5, 30),
        dy2: drift(6, 30),
        dx3: drift(7, 22),
        dy3: drift(8, 22),
      }
    })
  }, [])

  const hasSelection = selectedTags.length > 0

  return (
    <div className="relative mx-auto mb-6 aspect-square w-full max-w-[360px] select-none">
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full overflow-visible">
        {nodes.map(({ tag, path }, i) =>
          selectedTags.includes(tag) ? (
            <path
              key={tag}
              d={path}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="3 7"
              className="neuron-synapse"
              style={{ animationDelay: `${pseudoRandom(i, 11) * 1.2}s` }}
            />
          ) : null,
        )}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={hasSelection ? 12 : 7}
          fill="var(--gold)"
          opacity={hasSelection ? 0.85 : 0.35}
          className="neuron-core"
        />
      </svg>

      {nodes.map(({ tag, x, y, duration, delay, dx1, dy1, dx2, dy2, dx3, dy3 }) => {
        const active = selectedTags.includes(tag)
        return (
          <div
            key={tag}
            style={
              {
                left: `${(x / VIEWBOX) * 100}%`,
                top: `${(y / VIEWBOX) * 100}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--dx1": `${dx1}px`,
                "--dy1": `${dy1}px`,
                "--dx2": `${dx2}px`,
                "--dy2": `${dy2}px`,
                "--dx3": `${dx3}px`,
                "--dy3": `${dy3}px`,
              } as React.CSSProperties
            }
            className="neuron-float absolute"
          >
            <button
              type="button"
              onClick={() => onToggle(tag)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out hover:scale-125 ${
                active
                  ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)] shadow-[0_0_14px_-2px_var(--gold)]"
                  : "border-[var(--cream-dim)]/25 bg-[var(--surface-raised)] text-[var(--cream-dim)] hover:border-[var(--gold)]/60 hover:text-[var(--cream)]"
              }`}
            >
              {tag}
            </button>
          </div>
        )
      })}
    </div>
  )
}
