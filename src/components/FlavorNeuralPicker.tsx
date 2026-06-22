import { useMemo } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

const VIEWBOX = 320
const CENTER = VIEWBOX / 2
const RADIUS = 130

interface Props {
  selectedTags: FlavorTag[]
  onToggle: (tag: FlavorTag) => void
}

export default function FlavorNeuralPicker({ selectedTags, onToggle }: Props) {
  // Scattered around the ring with a touch of randomness per tag so they
  // don't read as a perfectly even, robotic circle, and each gets its own
  // float timing so the whole thing drifts erratically rather than in sync.
  const nodes = useMemo(() => {
    return FLAVOR_TAGS.map((tag, i) => {
      const angle = (i / FLAVOR_TAGS.length) * Math.PI * 2 - Math.PI / 2
      const jitter = ((i * 53) % 17) - 8
      const r = RADIUS + jitter
      return {
        tag,
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
        duration: 3.2 + ((i * 0.7) % 2.4),
        delay: (i * 0.41) % 3,
        drift: 6 + ((i * 3) % 6),
      }
    })
  }, [])

  const hasSelection = selectedTags.length > 0

  return (
    <div className="relative mx-auto mb-6 aspect-square w-full max-w-[360px] select-none">
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full overflow-visible">
        {nodes.map(({ tag, x, y }) =>
          selectedTags.includes(tag) ? (
            <line
              key={tag}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="var(--gold)"
              strokeWidth={1.5}
              className="neuron-synapse"
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

      {nodes.map(({ tag, x, y, duration, delay, drift }) => {
        const active = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            style={{
              left: `${(x / VIEWBOX) * 100}%`,
              top: `${(y / VIEWBOX) * 100}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              "--neuron-drift": `${drift}px`,
            } as React.CSSProperties}
            className={`neuron-float absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              active
                ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)] shadow-[0_0_14px_-2px_var(--gold)]"
                : "border-[var(--cream-dim)]/25 bg-[var(--surface-raised)] text-[var(--cream-dim)] hover:border-[var(--gold)]/50 hover:text-[var(--cream)]"
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
