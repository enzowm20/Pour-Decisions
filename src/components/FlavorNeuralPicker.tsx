import { useMemo } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

const VIEW = 380
const CENTER = VIEW / 2
const BASE_RADIUS = 125
const MIN_GAP = 16

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

// Pill width is roughly proportional to label length — used as a collision
// radius so longer tags ("refreshing") claim more personal space than short
// ones ("dry") when nodes get pushed apart.
function nodeRadius(tag: string) {
  return 20 + tag.length * 3.1
}

// Nudges any pair of points closer than their combined radii apart, run for
// a fixed number of passes — settles an initial scatter into a non-
// overlapping layout while keeping its rough shape.
function relax<T extends { x: number; y: number; r: number }>(points: T[], passes: number) {
  for (let pass = 0; pass < passes; pass++) {
    for (let a = 0; a < points.length; a++) {
      for (let b = a + 1; b < points.length; b++) {
        const dx = points[b].x - points[a].x
        const dy = points[b].y - points[a].y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = points[a].r + points[b].r + MIN_GAP
        if (dist < minDist) {
          const push = (minDist - dist) / 2
          const ux = dx / dist
          const uy = dy / dist
          points[a].x -= ux * push
          points[a].y -= uy * push
          points[b].x += ux * push
          points[b].y += uy * push
        }
      }
    }
  }
  return points
}

// A jagged, multi-segment ribbon rather than one clean arc — each layer gets
// its own independent wander so the 3 stacked strands don't trace the same
// shape, while jitter tapers to zero at both ends so it still lands exactly
// on the two nodes it connects.
function organicPath(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len

  const segments = 5
  let d = `M ${x1} ${y1}`
  let prevX = x1
  let prevY = y1
  for (let s = 1; s <= segments; s++) {
    const t = s / segments
    const baseX = x1 + dx * t
    const baseY = y1 + dy * t
    const taper = Math.sin(Math.PI * t)
    const jitter = (pseudoRandom(seed, s * 13.7) - 0.5) * 46 * taper
    const along = (pseudoRandom(seed, s * 5.3) - 0.5) * 14 * taper
    const px = baseX + nx * jitter + (dx / len) * along
    const py = baseY + ny * jitter + (dy / len) * along
    const ctrlX = (prevX + px) / 2 + (pseudoRandom(seed, s * 8.1) - 0.5) * 16 * taper
    const ctrlY = (prevY + py) / 2 + (pseudoRandom(seed, s * 3.9) - 0.5) * 16 * taper
    d += ` Q ${ctrlX} ${ctrlY}, ${px} ${py}`
    prevX = px
    prevY = py
  }
  return d
}

const ACCENTS = ["var(--teal)", "var(--gold)", "var(--berry)"]

function AuroraLink({ from, to, seed }: { from: { x: number; y: number }; to: { x: number; y: number }; seed: number }) {
  return (
    <g className="aurora-group" style={{ animationDelay: `${pseudoRandom(seed, 40) * 2.5}s` }}>
      {ACCENTS.map((color, layer) => (
        <path
          key={layer}
          d={organicPath(from.x, from.y, to.x, to.y, seed + layer * 17)}
          className={`aurora-strand aurora-strand-${layer}`}
          stroke={color}
          style={{ animationDelay: `${pseudoRandom(seed, 50 + layer) * 2}s` }}
        />
      ))}
    </g>
  )
}

export default function FlavorNeuralPicker({ selectedTags, onToggle }: Props) {
  // Resting layout: an irregular ring (randomized angle + radius per node),
  // then relaxed apart so labels never overlap no matter how the scatter
  // landed. A faint static mesh between ring-neighbours gives the picker a
  // constant "neural net" look even before anything's selected.
  const nodes = useMemo(() => {
    const points = FLAVOR_TAGS.map((tag, i) => {
      const angle = (i / FLAVOR_TAGS.length) * Math.PI * 2 - Math.PI / 2 + (pseudoRandom(i, 0) - 0.5) * 0.55
      const radius = BASE_RADIUS + (pseudoRandom(i, 12) - 0.5) * 80
      return {
        tag,
        angle,
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
        r: nodeRadius(tag),
      }
    })
    relax(points, 60)
    return points.map((p, i) => ({
      ...p,
      duration: 4 + pseudoRandom(i, 1) * 3.5,
      delay: pseudoRandom(i, 2) * 4,
      dx1: (pseudoRandom(i, 3) - 0.5) * 14,
      dy1: (pseudoRandom(i, 4) - 0.5) * 14,
      dx2: (pseudoRandom(i, 5) - 0.5) * 16,
      dy2: (pseudoRandom(i, 6) - 0.5) * 16,
      dx3: (pseudoRandom(i, 7) - 0.5) * 12,
      dy3: (pseudoRandom(i, 8) - 0.5) * 12,
    }))
  }, [])

  // Active layout: the same nodes pulled in toward the core along their own
  // angle, then relaxed again among just the selected subset so a cluster of
  // picks doesn't pile on top of itself near the center.
  const activeCluster = useMemo(() => {
    const active = nodes.filter((n) => selectedTags.includes(n.tag))
    const radius = 55 + active.length * 9
    const points = active.map((n) => ({
      tag: n.tag,
      r: n.r,
      x: CENTER + radius * Math.cos(n.angle),
      y: CENTER + radius * Math.sin(n.angle),
    }))
    relax(points, 40)
    return points
  }, [nodes, selectedTags])

  const activePositions = useMemo(
    () => new Map(activeCluster.map((p) => [p.tag, { x: p.x, y: p.y }])),
    [activeCluster],
  )

  // Any still-resting node that the incoming active cluster would now
  // overlap gets nudged straight back away from it — clears space in the
  // middle instead of letting a word tag sit underneath the cluster.
  const restingPositions = useMemo(() => {
    const result = new Map<FlavorTag, { x: number; y: number }>()
    for (const n of nodes) {
      if (selectedTags.includes(n.tag)) continue
      let pushX = 0
      let pushY = 0
      for (const ap of activeCluster) {
        const dx = n.x - ap.x
        const dy = n.y - ap.y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = n.r + ap.r + MIN_GAP
        if (dist < minDist) {
          const overlap = minDist - dist
          pushX += (dx / dist) * overlap
          pushY += (dy / dist) * overlap
        }
      }
      result.set(n.tag, { x: n.x + pushX, y: n.y + pushY })
    }
    return result
  }, [nodes, activeCluster, selectedTags])

  const hasSelection = selectedTags.length > 0

  return (
    <div className="relative mx-auto mb-6 aspect-square w-full max-w-[400px] overflow-visible">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full overflow-visible">
        {/* Faint always-on mesh between ring-neighbours, for that constant
            neural-net texture. */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length]
          const from = activePositions.get(n.tag) ?? restingPositions.get(n.tag) ?? n
          const to = activePositions.get(next.tag) ?? restingPositions.get(next.tag) ?? next
          return (
            <line
              key={`mesh-${n.tag}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--cream-dim)"
              strokeWidth={1}
              opacity={0.12}
            />
          )
        })}

        {/* Aurora synapses: each active node to the core, plus a full mesh
            between every pair of active nodes — picks "talk" to each other. */}
        {hasSelection &&
          selectedTags.map((tag, i) => {
            const pos = activePositions.get(tag)
            if (!pos) return null
            return <AuroraLink key={`hub-${tag}`} from={{ x: CENTER, y: CENTER }} to={pos} seed={i * 5} />
          })}
        {selectedTags.flatMap((tagA, ai) =>
          selectedTags.slice(ai + 1).map((tagB, bi) => {
            const posA = activePositions.get(tagA)
            const posB = activePositions.get(tagB)
            if (!posA || !posB) return null
            return <AuroraLink key={`${tagA}-${tagB}`} from={posA} to={posB} seed={ai * 11 + bi * 7 + 3} />
          }),
        )}

        <circle
          cx={CENTER}
          cy={CENTER}
          r={hasSelection ? 14 : 7}
          fill="var(--gold)"
          opacity={hasSelection ? 0.85 : 0.35}
          className="neuron-core"
        />
      </svg>

      {nodes.map(({ tag, x, y, duration, delay, dx1, dy1, dx2, dy2, dx3, dy3 }) => {
        const isActive = selectedTags.includes(tag)
        const pos = isActive
          ? activePositions.get(tag) ?? { x, y }
          : restingPositions.get(tag) ?? { x, y }
        return (
          <div
            key={tag}
            style={
              {
                left: `${(pos.x / VIEW) * 100}%`,
                top: `${(pos.y / VIEW) * 100}%`,
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
