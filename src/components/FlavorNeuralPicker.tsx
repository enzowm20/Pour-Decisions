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

interface Point {
  x: number
  y: number
  r: number
}

// Nudges any pair of movable points closer than their combined radii apart,
// and separately pushes movable points away from fixed obstacles (which
// don't move themselves) — run for a fixed number of passes so everything
// settles into a non-overlapping arrangement.
function relax<T extends Point>(movable: T[], fixed: Point[], passes: number) {
  for (let pass = 0; pass < passes; pass++) {
    for (const m of movable) {
      for (const f of fixed) {
        const dx = m.x - f.x
        const dy = m.y - f.y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = m.r + f.r + MIN_GAP
        if (dist < minDist) {
          const push = minDist - dist
          m.x += (dx / dist) * push
          m.y += (dy / dist) * push
        }
      }
    }
    for (let a = 0; a < movable.length; a++) {
      for (let b = a + 1; b < movable.length; b++) {
        const dx = movable[b].x - movable[a].x
        const dy = movable[b].y - movable[a].y
        const dist = Math.hypot(dx, dy) || 0.01
        const minDist = movable[a].r + movable[b].r + MIN_GAP
        if (dist < minDist) {
          const push = (minDist - dist) / 2
          const ux = dx / dist
          const uy = dy / dist
          movable[a].x -= ux * push
          movable[a].y -= uy * push
          movable[b].x += ux * push
          movable[b].y += uy * push
        }
      }
    }
  }
  return movable
}

// A smooth cubic ribbon with two independently-randomized control points —
// not mirrored around the midpoint like a single quadratic bow, so the curve
// reads as an asymmetric flowing "S" rather than a clean, perfect arc.
function curveBetween(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len

  const t1 = 0.22 + pseudoRandom(seed, 1) * 0.2
  const t2 = 0.58 + pseudoRandom(seed, 2) * 0.25
  const bow1 = (pseudoRandom(seed, 3) - 0.5) * 80
  const bow2 = (pseudoRandom(seed, 4) - 0.5) * 80

  const c1x = x1 + dx * t1 + nx * bow1
  const c1y = y1 + dy * t1 + ny * bow1
  const c2x = x1 + dx * t2 + nx * bow2
  const c2y = y1 + dy * t2 + ny * bow2

  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
}

const ACCENTS = ["var(--teal)", "var(--gold)", "var(--berry)"]

function AuroraLink({ from, to, seed }: { from: { x: number; y: number }; to: { x: number; y: number }; seed: number }) {
  return (
    <g className="aurora-group" style={{ animationDelay: `${pseudoRandom(seed, 40) * 2.5}s` }}>
      {ACCENTS.map((color, layer) => {
        const d = curveBetween(from.x, from.y, to.x, to.y, seed + layer * 17)
        return (
          <g key={layer}>
            <path
              d={d}
              className={`aurora-strand aurora-strand-${layer}`}
              stroke={color}
              style={{ animationDelay: `${pseudoRandom(seed, 50 + layer) * 2}s` }}
            />
            {/* A small bright spark drifting along the strand — this is what
                actually reads as "flowing" rather than a static glow. */}
            <circle r={2.2} fill={color} className="aurora-spark">
              <animateMotion
                dur={`${2.6 + pseudoRandom(seed, 60 + layer) * 1.8}s`}
                begin={`${pseudoRandom(seed, 70 + layer) * 2}s`}
                repeatCount="indefinite"
                path={d}
              />
            </circle>
          </g>
        )
      })}
    </g>
  )
}

export default function FlavorNeuralPicker({ selectedTags, onToggle }: Props) {
  // Resting layout: an irregular ring (randomized angle + radius per node),
  // then relaxed apart so labels never overlap no matter how the scatter
  // landed.
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
    relax(points, [], 60)
    return points.map((p, i) => ({
      ...p,
      duration: 5 + pseudoRandom(i, 1) * 3,
      delay: pseudoRandom(i, 2) * 4,
      ampX: (pseudoRandom(i, 3) - 0.5) * 10,
      ampY: 8 + pseudoRandom(i, 4) * 6,
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
    relax(points, [], 40)
    return points
  }, [nodes, selectedTags])

  const activePositions = useMemo(
    () => new Map(activeCluster.map((p) => [p.tag, { x: p.x, y: p.y }])),
    [activeCluster],
  )

  // Resting nodes are relaxed against the active cluster (as fixed obstacles
  // they get pushed away from) AND against each other (so being pushed back
  // doesn't just pile them up on top of one another instead) — nothing ends
  // up overlapping anything, active or resting.
  const restingPositions = useMemo(() => {
    const inactive = nodes
      .filter((n) => !selectedTags.includes(n.tag))
      .map((n) => ({ tag: n.tag, x: n.x, y: n.y, r: n.r }))
    relax(inactive, activeCluster, 60)
    return new Map(inactive.map((p) => [p.tag, { x: p.x, y: p.y }]))
  }, [nodes, activeCluster, selectedTags])

  const hasSelection = selectedTags.length > 0

  return (
    <div className="relative mx-auto mb-6 aspect-square w-full max-w-[400px] overflow-visible">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full overflow-visible">
        {/* Aurora synapses: each active node to the core, plus a full mesh
            between every pair of active nodes — picks "talk" to each other.
            Resting nodes stay unconnected until they're picked. */}
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

        {/* The "thinking" core — a layered, asymmetrically pulsing glow with
            two counter-rotating rings, rather than a single flat dot. */}
        <g transform={`translate(${CENTER}, ${CENTER})`} className="ai-core">
          <circle r={hasSelection ? 32 : 17} fill="var(--gold)" opacity={hasSelection ? 0.12 : 0.05} className="ai-core-halo ai-core-halo-a" />
          <circle r={hasSelection ? 24 : 13} fill="var(--teal)" opacity={hasSelection ? 0.14 : 0.05} className="ai-core-halo ai-core-halo-b" />
          <circle r={hasSelection ? 17 : 9} fill="var(--berry)" opacity={hasSelection ? 0.1 : 0.04} className="ai-core-halo ai-core-halo-c" />
          <circle
            r={hasSelection ? 15 : 8.5}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={1.2}
            strokeDasharray="3 6"
            opacity={hasSelection ? 0.7 : 0.3}
            className="ai-core-ring ai-core-ring-a"
          />
          <circle
            r={hasSelection ? 11 : 6}
            fill="none"
            stroke="var(--teal)"
            strokeWidth={1}
            strokeDasharray="2 5"
            opacity={hasSelection ? 0.55 : 0.22}
            className="ai-core-ring ai-core-ring-b"
          />
          <circle r={hasSelection ? 6.5 : 3.5} fill="var(--gold)" opacity={hasSelection ? 0.95 : 0.5} className="ai-core-nucleus" />
        </g>
      </svg>

      {nodes.map(({ tag, x, y, duration, delay, ampX, ampY }) => {
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
                "--ampx": `${ampX}px`,
                "--ampy": `${ampY}px`,
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
