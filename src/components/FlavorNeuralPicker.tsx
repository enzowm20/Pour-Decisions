import { useEffect, useMemo, useRef, useState } from "react"
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

// Water palette only — no rainbow accents. A deep blue body, a brighter
// aqua mid-tone, and a near-white highlight for gloss/sparkle.
const WATER_DEEP = "#0a3d5c"
const WATER_BLUE = "#1f8fd6"
const WATER_AQUA = "#6fe3ff"
const WATER_SHINE = "#e6fbff"

interface CubicCurve {
  p0: { x: number; y: number }
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  p3: { x: number; y: number }
}

// Two independently-randomized control points — not mirrored around the
// midpoint, so the curve reads as an asymmetric flowing shape rather than a
// clean, perfect arc.
function cubicControls(x1: number, y1: number, x2: number, y2: number, seed: number): CubicCurve {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len

  const t1 = 0.22 + pseudoRandom(seed, 1) * 0.2
  const t2 = 0.58 + pseudoRandom(seed, 2) * 0.25
  const bow1 = (pseudoRandom(seed, 3) - 0.5) * 80
  const bow2 = (pseudoRandom(seed, 4) - 0.5) * 80

  return {
    p0: { x: x1, y: y1 },
    p1: { x: x1 + dx * t1 + nx * bow1, y: y1 + dy * t1 + ny * bow1 },
    p2: { x: x1 + dx * t2 + nx * bow2, y: y1 + dy * t2 + ny * bow2 },
    p3: { x: x2, y: y2 },
  }
}

function curveBetween(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const c = cubicControls(x1, y1, x2, y2, seed)
  return `M ${c.p0.x} ${c.p0.y} C ${c.p1.x} ${c.p1.y}, ${c.p2.x} ${c.p2.y}, ${c.p3.x} ${c.p3.y}`
}

function cubicPoint(c: CubicCurve, t: number) {
  const mt = 1 - t
  return {
    x: mt * mt * mt * c.p0.x + 3 * mt * mt * t * c.p1.x + 3 * mt * t * t * c.p2.x + t * t * t * c.p3.x,
    y: mt * mt * mt * c.p0.y + 3 * mt * mt * t * c.p1.y + 3 * mt * t * t * c.p2.y + t * t * t * c.p3.y,
  }
}

function cubicTangent(c: CubicCurve, t: number) {
  const mt = 1 - t
  return {
    x: 3 * mt * mt * (c.p1.x - c.p0.x) + 6 * mt * t * (c.p2.x - c.p1.x) + 3 * t * t * (c.p3.x - c.p2.x),
    y: 3 * mt * mt * (c.p1.y - c.p0.y) + 6 * mt * t * (c.p2.y - c.p1.y) + 3 * t * t * (c.p3.y - c.p2.y),
  }
}

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
  const driftMag = baseR * 0.2 * pseudoRandom(seed, variant * 71)
  const ccx = cx + Math.cos(driftAngle) * driftMag
  const ccy = cy + Math.sin(driftAngle) * driftMag

  const pts = []
  for (let i = 0; i < BLOB_POINTS; i++) {
    const angle = (i / BLOB_POINTS) * Math.PI * 2
    const wobble = 0.5 + pseudoRandom(seed, variant * 97 + i * 7) * 0.9
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

// A filled river/blob shape running along a curve between two points,
// tapered near both ends but bulging and pinching erratically in between —
// reads as an elongated body of liquid flowing from one point to the other,
// not a drawn line.
function riverOutline(x1: number, y1: number, x2: number, y2: number, seed: number, variant: number, maxWidth: number) {
  const c = cubicControls(x1, y1, x2, y2, seed)
  const samples = 10
  const left: { x: number; y: number }[] = []
  const right: { x: number; y: number }[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const pt = cubicPoint(c, t)
    const tan = cubicTangent(c, t)
    const tlen = Math.hypot(tan.x, tan.y) || 1
    const nx = -tan.y / tlen
    const ny = tan.x / tlen
    const envelope = 0.2 + 0.8 * Math.sin(Math.PI * t)
    const jitter = 0.6 + pseudoRandom(seed + variant * 131, i * 17) * 0.7
    const width = maxWidth * envelope * jitter
    left.push({ x: pt.x + nx * (width / 2), y: pt.y + ny * (width / 2) })
    right.push({ x: pt.x - nx * (width / 2), y: pt.y - ny * (width / 2) })
  }
  return smoothClosedPath([...left, ...right.reverse()])
}

// A few small droplets flung off a point along its outward normal, fading
// and falling as they go — this is what actually sells "water being moved
// by something," not just a glow.
function Droplets({ x, y, nx, ny, seed, count = 3 }: { x: number; y: number; nx: number; ny: number; seed: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = seed + i * 13
        const spread = (pseudoRandom(s, 1) - 0.5) * 1.4
        const dx = nx + spread * ny
        const dy = ny - spread * nx
        const len = Math.hypot(dx, dy) || 1
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.1 + pseudoRandom(s, 2) * 1.1}
            fill={pseudoRandom(s, 3) > 0.5 ? WATER_AQUA : WATER_SHINE}
            className="water-droplet"
            style={
              {
                "--dx": `${(dx / len) * (14 + pseudoRandom(s, 4) * 16)}px`,
                "--dy": `${(dy / len) * (14 + pseudoRandom(s, 4) * 16)}px`,
                animationDuration: `${1.6 + pseudoRandom(s, 5) * 1.4}s`,
                animationDelay: `${pseudoRandom(s, 6) * 3}s`,
              } as React.CSSProperties
            }
          />
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
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.6 + pseudoRandom(s, 5) * 1.6}
            fill={pseudoRandom(s, 6) > 0.5 ? WATER_AQUA : WATER_SHINE}
            className="orbit-droplet"
          />
        )
      })}
    </>
  )
}

// A liquid river between two points: a filled, organically morphing body
// (not a stroked line) with a thin glossy centerline and a droplet of light
// sliding along it — reads as a taut, flowing body of water joining the
// blob to whatever it's linked to.
function LiquidLink({ from, to, seed }: { from: { x: number; y: number }; to: { x: number; y: number }; seed: number }) {
  const centerline = curveBetween(from.x, from.y, to.x, to.y, seed)
  const variants = useMemo(
    () => [0, 1, 2].map((v) => riverOutline(from.x, from.y, to.x, to.y, seed, v, 17)),
    [from.x, from.y, to.x, to.y, seed],
  )
  const values = `${variants.join(";")};${variants[0]}`
  const gradId = `liquid-grad-${seed}`
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={WATER_BLUE} />
          <stop offset="50%" stopColor={WATER_AQUA} />
          <stop offset="100%" stopColor={WATER_BLUE} />
        </linearGradient>
      </defs>
      <path d={variants[0]} fill={`url(#${gradId})`} className="liquid-river">
        <animate attributeName="d" values={values} dur={`${4.2 + pseudoRandom(seed, 80) * 2.2}s`} repeatCount="indefinite" />
      </path>
      <path d={centerline} stroke={WATER_SHINE} className="liquid-sheen" />
      <ellipse rx={3.6} ry={1.8} fill={WATER_SHINE} className="liquid-droplet">
        <animateMotion
          dur={`${2.6 + pseudoRandom(seed, 60) * 1.8}s`}
          begin={`${pseudoRandom(seed, 70) * 2}s`}
          repeatCount="indefinite"
          path={centerline}
          rotate="auto"
        />
      </ellipse>
      <Droplets x={mx} y={my} nx={-dy / len} ny={dx / len} seed={seed + 100} count={2} />
    </g>
  )
}

// The "thinking" core — possessed water: an outline that morphs between
// irregular, asymmetric shapes (SMIL on "d", at a fixed reference size, so
// the morph loop itself never restarts), wrapped in a separate group whose
// CSS-transitioned scale is the only thing that changes when the blob grows
// — so swelling reads as one continuous body filling out, not the same
// animation replayed bigger.
function WaterBlob({ cx, cy, radius, seed, active }: { cx: number; cy: number; radius: number; seed: number; active: boolean }) {
  const REF_R = 20
  const variants = useMemo(() => [0, 1, 2, 3].map((v) => blobPath(0, 0, REF_R, seed, v)), [seed])
  const values = `${variants.join(";")};${variants[0]}`
  const gradId = `water-body-${seed}`
  const scale = radius / REF_R

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g className="water-blob-scale" style={{ transform: `scale(${scale})` } as React.CSSProperties}>
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={WATER_SHINE} stopOpacity={0.9} />
            <stop offset="35%" stopColor={WATER_AQUA} stopOpacity={0.85} />
            <stop offset="100%" stopColor={WATER_DEEP} stopOpacity={0.9} />
          </radialGradient>
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
      </g>
      {[0, 1, 2].map((i) => {
        const angle = pseudoRandom(seed, i * 31) * Math.PI * 2
        const r = radius * (0.8 + pseudoRandom(seed, i * 41) * 0.3)
        return (
          <Droplets
            key={i}
            x={r * Math.cos(angle)}
            y={r * Math.sin(angle)}
            nx={Math.cos(angle)}
            ny={Math.sin(angle)}
            seed={seed + i * 23}
            count={2}
          />
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

  // The blob swells a little more with every tag pressed, capped so it never
  // crowds out the picker.
  const blobRadius = Math.min(15 + selectedTags.length * 3.4, 34)

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<{ x: number; y: number } | null>(null)
  const [orbit, setOrbit] = useState({ x: CENTER, y: CENTER, t: 0 })

  // The orbit anchor eases toward the cursor (read from a ref, not state, so
  // mouse-move events don't themselves trigger renders) — and eases back to
  // the blob's own center once the cursor leaves, which is what makes the
  // droplets read as originating from the blob rather than just trailing
  // the pointer everywhere it goes.
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

        {/* Droplets originating from the blob, orbiting a lagged anchor that
            eases toward the cursor — no river here, just water lazily
            trailing wherever you point, like little satellites being towed
            around. */}
        <OrbitDroplets anchor={{ x: orbit.x, y: orbit.y }} t={orbit.t} seed={11} count={5} />

        {/* Each picked tag gets its own small blob — same shading and morph
            style as the central one — sitting right where its label has
            gravitated to, joined back to the core by a river. Together with
            the core's own growth, this is the "pooling" effect: more, and
            bigger, body of liquid the more you pick. */}
        {selectedTags.map((tag, i) => {
          const pos = activePositions.get(tag)
          if (!pos) return null
          const tagSeed = tag.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + i * 17
          return (
            <g key={`node-blob-${tag}`} className="blob-pop-in">
              <WaterBlob cx={pos.x} cy={pos.y} radius={10} seed={tagSeed} active />
            </g>
          )
        })}

        <WaterBlob cx={CENTER} cy={CENTER} radius={blobRadius} seed={7} active={hasSelection} />
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
