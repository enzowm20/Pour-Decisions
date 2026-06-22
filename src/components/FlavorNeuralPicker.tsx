import { useMemo } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

const VIEW_W = 900
const VIEW_H = 380
const CENTER_X = VIEW_W / 2
const CENTER_Y = VIEW_H / 2
const EDGE_MARGIN = 60
const ACTIVE_RADIUS = 85

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

// Where a ray from the center, at angle theta, exits the rectangle — used so
// resting positions are spread across the whole box edge, not a tidy circle.
function edgePoint(theta: number) {
  const dx = Math.cos(theta)
  const dy = Math.sin(theta)
  const halfW = VIEW_W / 2 - EDGE_MARGIN
  const halfH = VIEW_H / 2 - EDGE_MARGIN
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)
  return { x: CENTER_X + dx * scale, y: CENTER_Y + dy * scale }
}

const ACCENTS = ["var(--teal)", "var(--gold)", "var(--berry)"]

export default function FlavorNeuralPicker({ selectedTags, onToggle }: Props) {
  const nodes = useMemo(() => {
    return FLAVOR_TAGS.map((tag, i) => {
      const theta =
        (i / FLAVOR_TAGS.length) * Math.PI * 2 - Math.PI / 2 + (pseudoRandom(i, 0) - 0.5) * 0.3
      const home = edgePoint(theta)
      const activeR = ACTIVE_RADIUS + pseudoRandom(i, 30) * 30
      const active = {
        x: CENTER_X + activeR * Math.cos(theta),
        y: CENTER_Y + activeR * Math.sin(theta),
      }

      // Three irregular drift offsets the float animation visits in turn, so
      // resting motion reads as erratic wandering rather than a clean bob.
      const drift = (salt: number, spread: number) => (pseudoRandom(i, salt) - 0.5) * spread

      return {
        tag,
        home,
        active,
        duration: 4 + pseudoRandom(i, 1) * 3.5,
        delay: pseudoRandom(i, 2) * 4,
        dx1: drift(3, 22),
        dy1: drift(4, 22),
        dx2: drift(5, 26),
        dy2: drift(6, 26),
        dx3: drift(7, 18),
        dy3: drift(8, 18),
      }
    })
  }, [])

  const hasSelection = selectedTags.length > 0

  function curveFor(x: number, y: number, i: number) {
    const mx = (CENTER_X + x) / 2
    const my = (CENTER_Y + y) / 2
    const dx = x - CENTER_X
    const dy = y - CENTER_Y
    const len = Math.hypot(dx, dy) || 1
    const bow = (i % 2 === 0 ? 1 : -1) * (18 + pseudoRandom(i, 9) * 20)
    const ctrlX = mx + (-dy / len) * bow
    const ctrlY = my + (dx / len) * bow
    return `M ${CENTER_X} ${CENTER_Y} Q ${ctrlX} ${ctrlY} ${x} ${y}`
  }

  return (
    <div className="relative mb-6 w-full overflow-visible" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {nodes.map(({ tag, active }, i) =>
          selectedTags.includes(tag) ? (
            <g
              key={tag}
              className="aurora-group"
              style={{ animationDelay: `${pseudoRandom(i, 40) * 2.5}s` }}
            >
              {ACCENTS.map((color, layer) => (
                <path
                  key={layer}
                  d={curveFor(active.x, active.y, i)}
                  className={`aurora-strand aurora-strand-${layer}`}
                  stroke={color}
                  style={{ animationDelay: `${pseudoRandom(i, 50 + layer) * 2}s` }}
                />
              ))}
            </g>
          ) : null,
        )}
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={hasSelection ? 14 : 7}
          fill="var(--gold)"
          opacity={hasSelection ? 0.85 : 0.35}
          className="neuron-core"
        />
      </svg>

      {nodes.map(({ tag, home, active, duration, delay, dx1, dy1, dx2, dy2, dx3, dy3 }) => {
        const isActive = selectedTags.includes(tag)
        const pos = isActive ? active : home
        return (
          <div
            key={tag}
            style={
              {
                left: `${(pos.x / VIEW_W) * 100}%`,
                top: `${(pos.y / VIEW_H) * 100}%`,
                transition: "left 0.9s cubic-bezier(0.22, 1, 0.36, 1), top 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
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
                isActive
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
