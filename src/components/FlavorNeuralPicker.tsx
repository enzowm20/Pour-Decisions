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

// A liquid thread between two points: a glossy gradient-filled stream (not a
// drawn line) with a small droplet of light sliding along it — like a thread
// of spirit still moving between the blob and whatever it's linked to.
function LiquidLink({ from, to, seed }: { from: { x: number; y: number }; to: { x: number; y: number }; seed: number }) {
  const d = curveBetween(from.x, from.y, to.x, to.y, seed)
  const gradId = `liquid-grad-${seed}`
  return (
    <g style={{ animationDelay: `${pseudoRandom(seed, 40) * 2.5}s` }}>
      <defs>
        <linearGradient id={gradId} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--teal)" />
          <stop offset="50%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--berry)" />
        </linearGradient>
      </defs>
      <path
        d={d}
        stroke={`url(#${gradId})`}
        className="liquid-strand"
        style={{ animationDelay: `${pseudoRandom(seed, 51) * 2}s` }}
      />
      <ellipse rx={4.5} ry={2.2} fill="var(--cream)" className="liquid-droplet">
        <animateMotion
          dur={`${2.6 + pseudoRandom(seed, 60) * 1.8}s`}
          begin={`${pseudoRandom(seed, 70) * 2}s`}
          repeatCount="indefinite"
          path={d}
          rotate="auto"
        />
      </ellipse>
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
        {/* Liquid connections: each active node back to the blob, plus a full
            mesh between every pair of active nodes — picks "talk" to each
            other through threads of the same liquid. Resting nodes stay
            unconnected until they're picked. */}
        {hasSelection &&
          selectedTags.map((tag, i) => {
            const pos = activePositions.get(tag)
            if (!pos) return null
            return <LiquidLink key={`hub-${tag}`} from={{ x: CENTER, y: CENTER }} to={pos} seed={i * 5} />
          })}
        {selectedTags.flatMap((tagA, ai) =>
          selectedTags.slice(ai + 1).map((tagB, bi) => {
            const posA = activePositions.get(tagA)
            const posB = activePositions.get(tagB)
            if (!posA || !posB) return null
            return <LiquidLink key={`${tagA}-${tagB}`} from={posA} to={posB} seed={ai * 11 + bi * 7 + 3} />
          }),
        )}

        {/* The "thinking" core — sentient liquid: several overlapping
            blurred blobs squashing/stretching out of sync so they read as
            one amorphous glowing mass rather than clean circles. */}
        <g transform={`translate(${CENTER}, ${CENTER})`} className="liquid-core">
          <ellipse rx={hasSelection ? 30 : 16} ry={hasSelection ? 24 : 13} fill="var(--gold)" opacity={hasSelection ? 0.24 : 0.09} className="liquid-blob liquid-blob-a" />
          <ellipse rx={hasSelection ? 22 : 12} ry={hasSelection ? 28 : 15} fill="var(--teal)" opacity={hasSelection ? 0.18 : 0.06} className="liquid-blob liquid-blob-b" />
          <ellipse rx={hasSelection ? 26 : 14} ry={hasSelection ? 19 : 10} fill="var(--berry)" opacity={hasSelection ? 0.16 : 0.05} className="liquid-blob liquid-blob-c" />
          <ellipse rx={hasSelection ? 14 : 7.5} ry={hasSelection ? 12 : 6.5} fill="var(--gold)" opacity={hasSelection ? 0.92 : 0.55} className="liquid-blob-core" />
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
