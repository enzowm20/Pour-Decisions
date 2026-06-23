import { useEffect, useMemo, useRef, useState } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

const VIEW = 380
const CENTER = VIEW / 2
const BASE_RADIUS = 125
const MIN_GAP = 16
const GOO_FILTER_ID = "flavor-picker-goo"

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

// Water palette only — no rainbow accents, and no yellow glow on picked
// tags anymore (the gold stays on the text only). A deep blue body, a
// brighter aqua mid-tone, and a near-white highlight for gloss/sparkle.
const WATER_DEEP = "#0a3d5c"
const WATER_AQUA = "#6fe3ff"
const WATER_SHINE = "#e6fbff"

// Builds a closed, organic outline through an ordered ring of points, joined
// with smooth curves through their midpoints — no straight edges or sharp
// corners anywhere, just a watery silhouette.
function smoothClosedPath(points: { x: number; y: number }[]) {
  const n = points.length
  const start = { x: (points[0].x + points[n - 1].x) / 2, y: (points[0].y + points[n - 1].y) / 2 }
  let d = `M ${start.x} ${start.y}`
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const next = points[(i + 1) % n]
    const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 }
    d += ` Q ${p.x} ${p.y} ${mid.x} ${mid.y}`
  }
  return `${d} Z`
}

// An irregular blob outline: the SAME point count every time (so SMIL can
// actually interpolate point-for-point between morph frames — a varying
// count just snaps from shape to shape), but each point's radius wobbles
// independently and the whole outline's center drifts off-axis per variant,
// so it sloshes asymmetrically rather than breathing in and out evenly.
const BLOB_POINTS = 9
function blobPath(cx: number, cy: number, baseR: number, seed: number, variant: number) {
  const driftAngle = pseudoRandom(seed, variant * 61) * Math.PI * 2
  const driftMag = baseR * 0.28 * pseudoRandom(seed, variant * 71)
  const ccx = cx + Math.cos(driftAngle) * driftMag
  const ccy = cy + Math.sin(driftAngle) * driftMag

  const pts = []
  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (i / BLOB_POINTS) * Math.PI * 2
    const wobble = 0.38 + pseudoRandom(seed, variant * 97 + i * 7) * 1.3
    const r = baseR * wobble
    pts.push({ x: ccx + r * Math.cos(angle), y: ccy + r * Math.sin(angle) })
  }
  return smoothClosedPath(pts)
}

// Even, eased timing for a 5-keyframe SMIL loop (4 variants + the repeat of
// the first) — without this, the default linear pacing between very
// different shapes reads as a snap rather than a slosh.
const BLOB_KEY_TIMES = "0;0.25;0.5;0.75;1"
const BLOB_KEY_SPLINES = "0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"

// A simple teardrop silhouette (pointed top, round bottom) plus a tiny
// specular highlight — reads as an actual droplet rather than a glowing dot.
// Drawn pointing "up" by default; rotate to orient along its direction of
// travel.
function WaterDrop({ x, y, r, rotationDeg, fill }: { x: number; y: number; r: number; rotationDeg: number; fill: string }) {
  const d = `M0,${-r} C${r * 0.55},${-r * 0.1} ${r * 0.9},${r * 0.35} ${r * 0.55},${r * 0.75} A${r * 0.55},${r * 0.55} 0 1 1 ${-r * 0.55},${r * 0.75} C${-r * 0.9},${r * 0.35} ${-r * 0.55},${-r * 0.1} 0,${-r} Z`
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotationDeg})`}>
      <path d={d} fill={fill} />
      <ellipse cx={-r * 0.18} cy={-r * 0.2} rx={r * 0.18} ry={r * 0.12} fill={WATER_SHINE} opacity={0.7} />
    </g>
  )
}

// A few small droplets flung off a point along its outward normal, fading
// and falling as they go, oriented tip-first along their direction of
// travel — this is what actually sells "water being moved by something,"
// not just a glow.
function Droplets({ x, y, nx, ny, seed, count = 3 }: { x: number; y: number; nx: number; ny: number; seed: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = seed + i * 13
        const spread = (pseudoRandom(s, 1) - 0.5) * 1.4
        const dx = nx + spread * ny
        const dy = ny - spread * nx
        const len = Math.hypot(dx, dy) || 1
        const rotationDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
        return (
          <g
            key={i}
            className="water-droplet"
            style={
              {
                "--dx": `${(dx / len) * (14 + pseudoRandom(s, 4) * 16)}px`,
                "--dy": `${(dy / len) * (14 + pseudoRandom(s, 4) * 16)}px`,
                animationDuration: `${1.6 + pseudoRandom(s, 5) * 1.4}s`,
                animationDelay: `${pseudoRandom(s, 6) * 3}s`,
              } as React.CSSProperties
            }
          >
            <WaterDrop
              x={x}
              y={y}
              r={1.6 + pseudoRandom(s, 2) * 1.6}
              rotationDeg={rotationDeg}
              fill={pseudoRandom(s, 3) > 0.5 ? WATER_AQUA : WATER_SHINE}
            />
          </g>
        )
      })}
    </>
  )
}

// A small cluster of droplets that orbit a lagged "anchor" point — the
// anchor itself eases toward the cursor (or back to the blob's own center
// once the cursor leaves) like a satellite system being towed around, while
// each droplet spins around that anchor at its own radius/speed/phase so the
// whole group reads as orbiting rather than just trailing behind the mouse.
function OrbitDroplets({ anchor, t, seed, count = 5 }: { anchor: { x: number; y: number }; t: number; seed: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = seed + i * 19
        const speed = 0.7 + pseudoRandom(s, 1) * 0.7
        const radius = 22 + pseudoRandom(s, 2) * 16
        const squash = 0.55 + pseudoRandom(s, 3) * 0.3
        const phase = pseudoRandom(s, 4) * Math.PI * 2
        const angle = phase + t * speed
        const x = anchor.x + radius * Math.cos(angle)
        const y = anchor.y + radius * Math.sin(angle) * squash
        // Tangent of the orbit (derivative w.r.t. angle) — orients the
        // droplet's point along its direction of travel.
        const tx = -radius * Math.sin(angle)
        const ty = radius * Math.cos(angle) * squash
        const rotationDeg = (Math.atan2(ty, tx) * 180) / Math.PI + 90
        return (
          <WaterDrop
            key={i}
            x={x}
            y={y}
            r={1.6 + pseudoRandom(s, 5) * 1.6}
            rotationDeg={rotationDeg}
            fill={pseudoRandom(s, 6) > 0.5 ? WATER_AQUA : WATER_SHINE}
          />
        )
      })}
    </>
  )
}

// Just the morphing outline + glossy body of the "thinking" core — no
// droplets here, so this can be grouped with every other blob's shape under
// one shared "goo" filter (blur + contrast threshold) that fuses overlapping
// edges into a single body, the classic metaball trick. This is what makes
// separate blobs read as pooling together via surface tension rather than
// being joined by a drawn connector.
function WaterBlobShape({
  cx,
  cy,
  radius,
  seed,
  active,
  sweep,
  stretchX = 1,
}: {
  cx: number
  cy: number
  radius: number
  seed: number
  active: boolean
  sweep?: boolean
  stretchX?: number
}) {
  const REF_R = 20
  const variants = useMemo(() => [0, 1, 2, 3].map((v) => blobPath(0, 0, REF_R, seed, v)), [seed])
  const values = `${variants.join(";")};${variants[0]}`
  const gradId = `water-body-${seed}`
  const clipId = `water-clip-${seed}`
  const scale = radius / REF_R

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g
        className="water-blob-scale"
        style={{ transform: `scale(${scale * stretchX}, ${scale})` } as React.CSSProperties}
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={WATER_SHINE} stopOpacity={0.9} />
            <stop offset="35%" stopColor={WATER_AQUA} stopOpacity={0.85} />
            <stop offset="100%" stopColor={WATER_DEEP} stopOpacity={0.9} />
          </radialGradient>
          <clipPath id={clipId}>
            <circle r={REF_R * 1.05} />
          </clipPath>
        </defs>
        <path d={variants[0]} fill={WATER_DEEP} opacity={active ? 0.35 : 0.18} className="water-blob-glow">
          <animate
            attributeName="d"
            values={values}
            keyTimes={BLOB_KEY_TIMES}
            keySplines={BLOB_KEY_SPLINES}
            calcMode="spline"
            dur="7s"
            repeatCount="indefinite"
          />
        </path>
        <path d={variants[0]} fill={`url(#${gradId})`} className="water-blob-body">
          <animate
            attributeName="d"
            values={values}
            keyTimes={BLOB_KEY_TIMES}
            keySplines={BLOB_KEY_SPLINES}
            calcMode="spline"
            dur="5.5s"
            repeatCount="indefinite"
          />
        </path>
        {sweep && (
          <g clipPath={`url(#${clipId})`}>
            <rect x={-7} y={-REF_R * 1.4} width={14} height={REF_R * 2.8} fill={WATER_SHINE} className="blob-wave-sweep" />
          </g>
        )}
      </g>
    </g>
  )
}

interface TagSim {
  x: number
  y: number
  angle: number
  settled: boolean
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

  const hasSelection = selectedTags.length > 0

  // The blob swells a little more with every tag pressed, capped so it never
  // crowds out the picker.
  const blobRadius = Math.min(26 + selectedTags.length * 3.4, 46)
  // How far out the whirlpool sits — comfortably inside the blob's own
  // radius, so swirling tags never read as floating past its edge.
  const whirlRadius = blobRadius * 0.42

  // The central blob is a fixed obstacle for the resting layout below —
  // this is what stops idle tags from ever drifting on top of it. Picked
  // tags are no longer laid out by this relax pass at all (see the gravity
  // simulation further down) — they leave it the moment they're picked.
  const blobObstacle: Point = { x: CENTER, y: CENTER, r: blobRadius + 12 }

  const restingPositions = useMemo(() => {
    const inactive = nodes
      .filter((n) => !selectedTags.includes(n.tag))
      .map((n) => ({ tag: n.tag, x: n.x, y: n.y, r: n.r }))
    relax(inactive, [blobObstacle], 60)
    return new Map(inactive.map((p) => [p.tag, { x: p.x, y: p.y }]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, selectedTags, blobRadius])

  // Live refs for values the animation loop below needs but shouldn't
  // re-subscribe to (the loop itself only ever runs once) — updated by
  // plain assignment every render, always current by the next frame.
  const selectedTagsRef = useRef(selectedTags)
  selectedTagsRef.current = selectedTags
  const whirlRadiusRef = useRef(whirlRadius)
  whirlRadiusRef.current = whirlRadius

  const tagSimRef = useRef<Map<FlavorTag, TagSim>>(new Map())

  // Whenever a tag is freshly picked, start its simulation from wherever it
  // was just resting — gravity takes it from there. Whenever one is
  // unpicked, drop it from the sim; the render below falls back to the
  // ordinary resting layout (with its normal CSS transition) for it.
  useEffect(() => {
    const sim = tagSimRef.current
    for (const tag of selectedTags) {
      if (sim.has(tag)) continue
      const start = nodes.find((n) => n.tag === tag)
      sim.set(tag, { x: start?.x ?? CENTER, y: start?.y ?? CENTER, angle: 0, settled: false })
    }
    for (const tag of Array.from(sim.keys())) {
      if (!selectedTags.includes(tag)) sim.delete(tag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags])

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<{ x: number; y: number } | null>(null)
  const [orbit, setOrbit] = useState({ x: CENTER, y: CENTER, t: 0 })

  // One shared animation loop: the orbit-droplet anchor eases toward the
  // cursor (or back to the blob's center), AND every picked tag gets pulled
  // in by the blob's "gravity" until it's close enough to peel off into a
  // clockwise orbit of its own — a whirlpool. Driven by refs + a single
  // re-render-triggering state update so positions read as continuous
  // motion rather than a CSS transition chasing a constantly moving target.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      setOrbit((prev) => {
        const target = cursorRef.current ?? { x: CENTER, y: CENTER }
        const ease = 1 - Math.pow(0.0008, dt)
        return {
          x: prev.x + (target.x - prev.x) * ease,
          y: prev.y + (target.y - prev.y) * ease,
          t: prev.t + dt,
        }
      })

      const whirlR = whirlRadiusRef.current
      for (const tag of selectedTagsRef.current) {
        const sim = tagSimRef.current.get(tag)
        if (!sim) continue
        const dx = CENTER - sim.x
        const dy = CENTER - sim.y
        const dist = Math.hypot(dx, dy)
        if (!sim.settled && dist <= whirlR * 1.15) sim.settled = true

        if (!sim.settled) {
          // Gravity: ease steadily in toward the core.
          const pull = 1 - Math.pow(0.01, dt)
          sim.x += dx * pull
          sim.y += dy * pull
        } else {
          // Whirlpool: orbit clockwise (angle increasing is clockwise in
          // screen space, where y points down) at a fixed radius, easing
          // toward that rotating point rather than snapping to it.
          sim.angle += dt * 1.7
          const tx = CENTER + whirlR * Math.cos(sim.angle)
          const ty = CENTER + whirlR * Math.sin(sim.angle)
          const ease = 1 - Math.pow(0.0004, dt)
          sim.x += (tx - sim.x) * ease
          sim.y += (ty - sim.y) * ease
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    cursorRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * VIEW,
      y: ((e.clientY - rect.top) / rect.height) * VIEW,
    }
  }

  // Skip the position CSS-transition on the very first paint — without
  // this, every node's left/top appears to animate in from the default
  // (top-left) corner the instant the page mounts, which is the "jitters to
  // the left" jolt.
  const [settledIn, setSettledIn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSettledIn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        cursorRef.current = null
      }}
      className="relative mx-auto mb-6 aspect-square w-full max-w-[400px] overflow-visible"
    >
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          {/* The "goo" trick: blur everything in the group together, then
              push contrast back up past a threshold — wherever two blurred
              shapes overlapped enough, the threshold reconnects them into
              one solid edge instead of two separate outlines. */}
          <filter id={GOO_FILTER_ID}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feComposite in="goo" in2="goo" operator="atop" />
          </filter>
        </defs>

        {/* Droplets originating from the blob, orbiting a lagged anchor that
            eases toward the cursor — like little satellites being towed
            around, no connecting stream here. */}
        <OrbitDroplets anchor={{ x: orbit.x, y: orbit.y }} t={orbit.t} seed={11} count={5} />

        {/* Every blob shape (core + one per picked tag) shares this filter,
            so anything close enough pools into the central body via surface
            tension rather than being linked by a drawn connector. */}
        <g filter={`url(#${GOO_FILTER_ID})`}>
          <WaterBlobShape cx={CENTER} cy={CENTER} radius={blobRadius} seed={7} active={hasSelection} />
          {selectedTags.map((tag, i) => {
            const sim = tagSimRef.current.get(tag)
            if (!sim) return null
            const tagSeed = tag.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + i * 17
            // Sized and stretched to actually engulf the label (longer words
            // need a wider, not just bigger, blob). It travels with the
            // gravity/whirlpool simulation below, so as it nears the core
            // and starts orbiting, the goo filter naturally fuses it into
            // the central body — no separate connector shape needed.
            const stretchX = Math.min(1.5 + tag.length * 0.22, 4.2)
            return (
              <g key={`node-blob-${tag}`} className="blob-pop-in">
                <WaterBlobShape cx={sim.x} cy={sim.y} radius={13} seed={tagSeed} active sweep stretchX={stretchX} />
              </g>
            )
          })}
        </g>

        {/* Surface droplets for the central blob — kept outside the goo
            group so the filter's blur never touches them. */}
        {[0, 1, 2].map((i) => {
          const angle = pseudoRandom(7, i * 31) * Math.PI * 2
          const r = blobRadius * (0.8 + pseudoRandom(7, i * 41) * 0.3)
          return (
            <Droplets
              key={i}
              x={CENTER + r * Math.cos(angle)}
              y={CENTER + r * Math.sin(angle)}
              nx={Math.cos(angle)}
              ny={Math.sin(angle)}
              seed={7 + i * 23}
              count={2}
            />
          )
        })}
      </svg>

      {nodes.map(({ tag, x, y, duration, delay, ampX, ampY }) => {
        const isActive = selectedTags.includes(tag)
        const sim = isActive ? tagSimRef.current.get(tag) : undefined
        const pos = sim ?? restingPositions.get(tag) ?? { x, y }
        // Active tags are positioned every frame by the gravity/whirlpool
        // simulation — a CSS transition fighting a target that moves 60
        // times a second is exactly what produces laggy, jittery motion, so
        // it's switched off for those. Resting tags keep the smooth
        // transition, except on the very first paint (see settledIn).
        const transition = isActive
          ? "none"
          : settledIn
            ? "left 0.9s cubic-bezier(0.22, 1, 0.36, 1), top 0.9s cubic-bezier(0.22, 1, 0.36, 1)"
            : "none"
        return (
          <div
            key={tag}
            style={
              {
                left: `${(pos.x / VIEW) * 100}%`,
                top: `${(pos.y / VIEW) * 100}%`,
                transition,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--ampx": `${ampX}px`,
                "--ampy": `${ampY}px`,
              } as React.CSSProperties
            }
            className={`absolute ${isActive ? "" : "neuron-float"}`}
          >
            <button
              type="button"
              onClick={() => onToggle(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out hover:scale-125 ${
                isActive
                  ? "text-[var(--gold)] drop-shadow-[0_0_6px_var(--gold)]"
                  : "border border-[var(--cream-dim)]/25 bg-[var(--surface-raised)] text-[var(--cream-dim)] hover:border-[var(--gold)]/60 hover:text-[var(--cream)]"
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
