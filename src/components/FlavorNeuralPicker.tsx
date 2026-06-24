import { useEffect, useMemo, useRef, useState } from "react"
import { FLAVOR_TAGS, type FlavorTag } from "../types"

// Wide rectangle (matches the picker spanning the full page width) rather
// than a small square — the coordinate space is still just a viewBox, scaled
// to whatever the container's actual rendered size is.
const VIEW_W = 760
const VIEW_H = 380
const CENTER_X = VIEW_W / 2
const CENTER_Y = VIEW_H / 2
const BASE_RADIUS = 125
// How much wider than tall the initial scatter ring is stretched — keeps the
// resting layout spread across the full width instead of bunching in a
// circle in the middle of a wide box.
const ELLIPSE_X = VIEW_W / VIEW_H
const MIN_GAP = 26
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
  return 26 + tag.length * 3.6
}

interface Point {
  x: number
  y: number
  r: number
}

// Nudges any pair of movable points closer than their combined radii apart,
// separately pushes movable points away from fixed obstacles (which don't
// move themselves), AND keeps every point's full footprint (its own radius,
// plus however far its idle float animation can carry it) inside the
// picker's own viewBox — run for a fixed number of passes so everything
// settles into a non-overlapping, fully-contained arrangement.
//
// The edge constraint has to be interleaved into the SAME passes as the
// repulsion, not applied once afterward — clamping only at the end let
// several points land on the very same clamped edge position (each pushed
// there independently, with no later pass to notice they'd collided), which
// is exactly what produced overlapping tags along the boundary. Doing both
// together each pass means a point shoved to the edge is still subject to
// the next pass's pairwise repulsion, sliding it sideways along the edge
// instead of stacking.
function repelFromFixed<T extends Point>(movable: T[], fixed: Point[]) {
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
}

function repelPairs<T extends Point>(movable: T[]) {
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

// Run for a fixed number of passes so everything settles into a
// non-overlapping, fully-contained arrangement.
//
// The edge constraint has to be interleaved into the SAME passes as the
// repulsion, not applied once afterward — clamping only at the end let
// several points land on the very same clamped edge position (each pushed
// there independently, with no later pass to notice they'd collided), which
// is exactly what produced overlapping tags along the boundary. Each pass
// now repels twice around a single clamp, so a point shoved to the edge by
// the first repulsion gets clamped back in bounds AND THEN still gets a
// second chance to be pushed off anything it landed on top of as a result —
// by the time the whole arrangement has converged over many passes, that
// residual is well under a pixel.
function relax<T extends Point>(
  movable: T[],
  fixed: Point[],
  passes: number,
  marginByPoint?: (p: T) => number,
) {
  function clamp() {
    if (!marginByPoint) return
    for (const m of movable) {
      const margin = marginByPoint(m)
      m.x = Math.min(VIEW_W - margin, Math.max(margin, m.x))
      m.y = Math.min(VIEW_H - margin, Math.max(margin, m.y))
    }
  }
  for (let pass = 0; pass < passes; pass++) {
    repelFromFixed(movable, fixed)
    repelPairs(movable)
    clamp()
    repelFromFixed(movable, fixed)
    repelPairs(movable)
    clamp()
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

// More variants over the same loop duration means each individual morph is
// a smaller, subtler step — which is what actually reads as continuous
// organic flow. A spline easing that decelerates into and accelerates out
// of every keyframe (the old "0.45 0 0.55 1" on each segment) makes the
// blob visibly pause at each shape before the next move starts, which is
// the "shifting between movements" feel rather than a flow. Plain linear
// interpolation at evenly spaced keyframes removes those pauses entirely —
// with enough variants, constant-velocity interpolation between similar
// neighboring shapes looks just as smooth as eased interpolation would,
// without ever stalling.
const BLOB_VARIANT_COUNT = 7
const BLOB_KEY_TIMES = Array.from({ length: BLOB_VARIANT_COUNT + 1 }, (_, i) => i / BLOB_VARIANT_COUNT).join(";")

// A plump, rounded bead (not a thin elongated teardrop) plus a tight
// specular highlight — reads as a condensed drop of water rather than a
// glowing dot or a wisp. Drawn pointing "up" by default; rotate to orient
// along its direction of travel.
function WaterDrop({ x, y, r, rotationDeg, fill }: { x: number; y: number; r: number; rotationDeg: number; fill: string }) {
  const d = `M0,${-r * 0.82} C${r * 0.52},${-r * 0.7} ${r * 0.88},${-r * 0.18} ${r * 0.8},${r * 0.18} C${r * 0.72},${r * 0.62} ${r * 0.38},${r * 0.88} 0,${r * 0.88} C${-r * 0.38},${r * 0.88} ${-r * 0.72},${r * 0.62} ${-r * 0.8},${r * 0.18} C${-r * 0.88},${-r * 0.18} ${-r * 0.52},${-r * 0.7} 0,${-r * 0.82} Z`
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotationDeg})`}>
      <path d={d} fill={fill} />
      <ellipse cx={-r * 0.22} cy={-r * 0.22} rx={r * 0.22} ry={r * 0.15} fill={WATER_SHINE} opacity={0.85} />
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
              r={2.1 + pseudoRandom(s, 2) * 1.5}
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
//
// Positioned ENTIRELY outside React's render cycle: each droplet's per-frame
// transform is written straight to its <g> via a ref, never through state.
// Driving this through setState (re-rendering the whole picker 60x/sec) was
// the source of the "laggy bits" — every other moving piece (the active
// blobs, the orbiting tag pills) was also waiting on that same React commit,
// so they all stuttered together instead of updating smoothly each frame.
interface OrbitDropletParams {
  speed: number
  radius: number
  squash: number
  phase: number
  size: number
  fill: string
}

function useOrbitDropletParams(seed: number, count: number): OrbitDropletParams[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const s = seed + i * 19
        return {
          speed: 0.7 + pseudoRandom(s, 1) * 0.7,
          radius: 22 + pseudoRandom(s, 2) * 16,
          squash: 0.55 + pseudoRandom(s, 3) * 0.3,
          phase: pseudoRandom(s, 4) * Math.PI * 2,
          size: 2.1 + pseudoRandom(s, 5) * 1.5,
          fill: pseudoRandom(s, 6) > 0.5 ? WATER_AQUA : WATER_SHINE,
        }
      }),
    [seed, count],
  )
}

function OrbitDroplets({
  params,
  groupRefs,
}: {
  params: OrbitDropletParams[]
  groupRefs: React.MutableRefObject<(SVGGElement | null)[]>
}) {
  return (
    <>
      {params.map((p, i) => (
        <g
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el
          }}
        >
          <WaterDrop x={0} y={0} r={p.size} rotationDeg={0} fill={p.fill} />
        </g>
      ))}
    </>
  )
}

// Computes one orbit droplet's transform for the given anchor/time and
// writes it straight to the DOM — called every frame from the rAF loop.
function updateOrbitDroplet(el: SVGGElement | null, p: OrbitDropletParams, anchor: { x: number; y: number }, t: number) {
  if (!el) return
  const angle = p.phase + t * p.speed
  const x = anchor.x + p.radius * Math.cos(angle)
  const y = anchor.y + p.radius * Math.sin(angle) * p.squash
  const tx = -p.radius * Math.sin(angle)
  const ty = p.radius * Math.cos(angle) * p.squash
  const rotationDeg = (Math.atan2(ty, tx) * 180) / Math.PI + 90
  el.setAttribute("transform", `translate(${x} ${y}) rotate(${rotationDeg})`)
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
  const variants = useMemo(
    () => Array.from({ length: BLOB_VARIANT_COUNT }, (_, v) => blobPath(0, 0, REF_R, seed, v)),
    [seed],
  )
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
            calcMode="linear"
            dur="14s"
            repeatCount="indefinite"
          />
        </path>
        <path d={variants[0]} fill={`url(#${gradId})`} className="water-blob-body">
          <animate
            attributeName="d"
            values={values}
            keyTimes={BLOB_KEY_TIMES}
            calcMode="linear"
            dur="10.5s"
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
  formUntil: number
  // Set the instant a tag settles into the whirlpool — its own engulfing
  // blob fades out over this window rather than vanishing immediately,
  // since by then it's deep inside the central blob's own body anyway.
  mergeFadeUntil?: number
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
        x: CENTER_X + radius * ELLIPSE_X * Math.cos(angle),
        y: CENTER_Y + radius * Math.sin(angle),
        r: nodeRadius(tag),
        ampX: (pseudoRandom(i, 3) - 0.5) * 10,
        ampY: 8 + pseudoRandom(i, 4) * 6,
      }
    })
    // Margin includes the node's own pill radius AND its float amplitude —
    // without the latter, a node could rest right at the safe edge and then
    // still drift past it every time its idle animation swings outward.
    relax(points, [], 90, (p) => p.r + Math.max(Math.abs(p.ampX), p.ampY) + 4)
    return points.map((p, i) => ({
      ...p,
      duration: 5 + pseudoRandom(i, 1) * 3,
      delay: pseudoRandom(i, 2) * 4,
    }))
  }, [])

  const hasSelection = selectedTags.length > 0

  const tagSimRef = useRef<Map<FlavorTag, TagSim>>(new Map())
  // Clockwise arrival order of tags that have actually settled into the
  // whirlpool — this (not raw timing) is what assigns each one its slot
  // around the circle, so they're always evenly spaced no matter when they
  // happened to arrive.
  const settledOrderRef = useRef<FlavorTag[]>([])
  // Slowly rotates the whole ring of slots together, so the formation as a
  // unit drifts clockwise even though each tag holds its own spot in line.
  const whirlPhaseRef = useRef(0)

  // Seeded synchronously during render (not in a useEffect) so a freshly
  // picked tag's simulation exists from its very first paint — waiting a
  // render for an effect left a one-frame window where the blob/pill had no
  // simulated position yet, which is what made a freshly picked tag's blob
  // flash at the SVG's coordinate origin (top-left) before snapping to the
  // right spot.
  for (const tag of selectedTags) {
    if (tagSimRef.current.has(tag)) continue
    const start = nodes.find((n) => n.tag === tag)
    tagSimRef.current.set(tag, {
      x: start?.x ?? CENTER_X,
      y: start?.y ?? CENTER_Y,
      angle: 0,
      settled: false,
      formUntil: performance.now() + 1400,
    })
  }
  for (const tag of Array.from(tagSimRef.current.keys())) {
    if (!selectedTags.includes(tag)) {
      tagSimRef.current.delete(tag)
      const idx = settledOrderRef.current.indexOf(tag)
      if (idx !== -1) settledOrderRef.current.splice(idx, 1)
    }
  }

  // The blob only swells once a picked tag has actually arrived and merged
  // in — not the instant it's clicked — so growth reads as "absorbing" each
  // one rather than jumping ahead of the animation. It also grows with the
  // widest currently-selected label, so the whirlpool ring (sized off this
  // same radius below) always has room for every pill's full text without
  // any of them poking past the blob's own edge.
  const tagSimSnapshot = tagSimRef.current
  const mergedCount = selectedTags.filter((tag) => tagSimSnapshot.get(tag)?.settled).length
  const maxTagRadius = selectedTags.length > 0 ? Math.max(...selectedTags.map(nodeRadius)) : 0
  const blobRadius = Math.min(34 + mergedCount * 7 + maxTagRadius * 0.7, 120)
  // How far out the whirlpool sits — comfortably inside the blob's own
  // radius (and well clear of its edge), so swirling tags never read as
  // floating past its bounds.
  const whirlRadius = blobRadius * 0.46

  // The central blob is a fixed obstacle for the resting layout below —
  // this is what stops idle tags from ever drifting near it or the selected
  // tags swirling inside it. A generous margin (not just the bare radius)
  // keeps a real gap rather than letting idle tags rest right up against
  // its edge.
  const blobObstacle: Point = { x: CENTER_X, y: CENTER_Y, r: blobRadius + 30 }

  const restingPositions = useMemo(() => {
    const inactive = nodes
      .filter((n) => !selectedTags.includes(n.tag))
      .map((n) => ({ tag: n.tag, x: n.x, y: n.y, r: n.r, ampX: n.ampX, ampY: n.ampY }))
    relax(inactive, [blobObstacle], 90, (p) => p.r + Math.max(Math.abs(p.ampX), p.ampY) + 4)
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

  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<{ x: number; y: number } | null>(null)
  const orbitRef = useRef({ x: CENTER_X, y: CENTER_Y, t: 0 })
  const orbitDropletParams = useOrbitDropletParams(11, 5)
  const orbitDropletRefs = useRef<(SVGGElement | null)[]>([])
  const blobGroupRefs = useRef<Map<FlavorTag, SVGGElement>>(new Map())
  const pillRefs = useRef<Map<FlavorTag, HTMLDivElement>>(new Map())

  // Forces a render only when a tag actually finishes its journey into the
  // whirlpool (the central blob grows a notch) — every other frame's motion
  // below is written straight to the DOM via refs, never through setState,
  // so it can never be held up by (or stutter against) a React commit. That
  // per-frame setState was the actual source of the "lagging bits": it
  // forced the WHOLE picker — every blob path, every droplet, every idle
  // tag — to re-render 60 times a second just to move one number.
  const [, forceMergeRender] = useState(0)
  const lastSettledCountRef = useRef(mergedCount)

  // One shared animation loop: the orbit-droplet anchor eases toward the
  // cursor (or back to the blob's center), AND every picked tag gets pulled
  // in by the blob's "gravity" until it's close enough to peel off into a
  // clockwise orbit of its own — a whirlpool. Every position is committed
  // directly to its DOM node each frame for buttery, uninterrupted motion.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const target = cursorRef.current ?? { x: CENTER_X, y: CENTER_Y }
      const orbitEase = 1 - Math.pow(0.0008, dt)
      const orbit = orbitRef.current
      orbit.x += (target.x - orbit.x) * orbitEase
      orbit.y += (target.y - orbit.y) * orbitEase
      orbit.t += dt

      orbitDropletParams.forEach((p, i) => updateOrbitDroplet(orbitDropletRefs.current[i], p, orbit, orbit.t))

      // The whole ring of whirlpool "slots" drifts clockwise together,
      // nice and slowly — each settled tag eases toward its own slot in
      // this ring rather than spinning freely, which is what keeps them
      // evenly spaced (never overlapping) no matter when each one arrived.
      whirlPhaseRef.current += dt * 0.22

      const whirlR = whirlRadiusRef.current
      for (const tag of selectedTagsRef.current) {
        const sim = tagSimRef.current.get(tag)
        if (!sim) continue

        // Let the blob visibly finish forming around the label before
        // gravity has any pull at all.
        if (now < sim.formUntil) continue

        if (!sim.settled) {
          const dx = CENTER_X - sim.x
          const dy = CENTER_Y - sim.y
          const dist = Math.hypot(dx, dy)
          if (dist <= whirlR * 1.15) {
            sim.settled = true
            // Start the whirlpool angle from wherever the tag actually just
            // arrived, not the simulation's stale initial 0 — without this,
            // the very first whirlpool frame targets whatever point angle 0
            // maps to, which is usually nowhere near the arrival point, and
            // the easing then visibly snaps/redirects toward it. That snap
            // is what reads as a "choppy" stutter right at the merge.
            sim.angle = Math.atan2(sim.y - CENTER_Y, sim.x - CENTER_X)
            // Once a tag is this deep inside the central blob, its own
            // engulfing blob is just a second, independently-animated body
            // overlapping the central one under the same goo filter — two
            // separately sloshing surfaces never line up frame to frame,
            // which is what reads as a jolt at each of the merge points.
            // Fading it out (rather than cutting it instantly) leaves the
            // central blob as the only thing visibly moving there.
            sim.mergeFadeUntil = now + 700
            settledOrderRef.current.push(tag)
          } else {
            // Gravity: a slow, steady ease in toward the core — this is the
            // "gradually pulled in" leg of the journey. A much gentler decay
            // than before, so the pull reads as a slow current, not a snap.
            const pull = 1 - Math.pow(0.55, dt)
            sim.x += dx * pull
            sim.y += dy * pull
          }
        } else {
          // Whirlpool: each settled tag holds an evenly spaced slot around
          // the ring (its index among all settled tags), so N tags are
          // always 360/N degrees apart — never bunched together — while the
          // whole ring slowly rotates clockwise via whirlPhaseRef.
          const slot = settledOrderRef.current.indexOf(tag)
          const count = settledOrderRef.current.length
          const targetAngle =
            whirlPhaseRef.current + (slot >= 0 ? (slot / Math.max(count, 1)) * Math.PI * 2 : 0)
          // Shortest-path angular easing — without normalizing into [-π, π]
          // first, a tag could spin the long way round whenever the target
          // wraps past 2π, which reads as a jolt rather than a smooth glide.
          let delta = ((targetAngle - sim.angle + Math.PI) % (Math.PI * 2)) - Math.PI
          if (delta < -Math.PI) delta += Math.PI * 2
          const angleEase = 1 - Math.pow(0.12, dt)
          sim.angle += delta * angleEase

          const spacedRadius = whirlR + Math.min(count, 6) * 4
          const tx = CENTER_X + spacedRadius * Math.cos(sim.angle)
          const ty = CENTER_Y + spacedRadius * Math.sin(sim.angle)
          const ease = 1 - Math.pow(0.12, dt)
          sim.x += (tx - sim.x) * ease
          sim.y += (ty - sim.y) * ease
        }

        const blobEl = blobGroupRefs.current.get(tag)
        if (blobEl) {
          blobEl.setAttribute("transform", `translate(${sim.x} ${sim.y})`)
          if (sim.mergeFadeUntil !== undefined) {
            const remaining = sim.mergeFadeUntil - now
            blobEl.style.opacity = String(Math.max(0, Math.min(1, remaining / 700)))
          }
        }
        const pillEl = pillRefs.current.get(tag)
        if (pillEl) {
          pillEl.style.left = `${(sim.x / VIEW_W) * 100}%`
          pillEl.style.top = `${(sim.y / VIEW_H) * 100}%`
        }
      }

      const settledCount = selectedTagsRef.current.filter((t) => tagSimRef.current.get(t)?.settled).length
      if (settledCount !== lastSettledCountRef.current) {
        lastSettledCountRef.current = settledCount
        forceMergeRender((v) => v + 1)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    cursorRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    }
  }

  // Skip the position CSS-transition for the first beat after mount —
  // without this, every node's left/top appears to animate in from the
  // default (top-left) corner, which is the "jitters to the left" jolt. A
  // single rAF wasn't enough: late web-font swaps or a scrollbar appearing
  // can still nudge layout (and so the % position's resolved pixels) a
  // moment later, which a transition would then visibly animate. Half a
  // second covers that settling window.
  const [settledIn, setSettledIn] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setSettledIn(true), 500)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        cursorRef.current = null
      }}
      className="relative mx-auto mb-6 aspect-[2/1] w-full overflow-visible"
    >
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full overflow-visible">
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
        <OrbitDroplets params={orbitDropletParams} groupRefs={orbitDropletRefs} />

        {/* Every blob shape (core + one per picked tag) shares this filter,
            so anything close enough pools into the central body via surface
            tension rather than being linked by a drawn connector. */}
        <g filter={`url(#${GOO_FILTER_ID})`}>
          <WaterBlobShape cx={CENTER_X} cy={CENTER_Y} radius={blobRadius} seed={7} active={hasSelection} />
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
              // Position lives on this OUTER group only — the inner group
              // below carries the "blob-pop-in" scale-in animation, which
              // drives the CSS `transform` property. Putting both on the
              // SAME element was the actual bug: CSS `transform` overrides
              // the SVG `transform` ATTRIBUTE entirely for the duration of
              // that animation, which silently dropped this translate and
              // left the blob sitting at the SVG's raw origin (top-left)
              // every time a tag was freshly picked.
              <g
                key={`node-blob-${tag}`}
                ref={(el) => {
                  if (el) blobGroupRefs.current.set(tag, el)
                  else blobGroupRefs.current.delete(tag)
                }}
                transform={`translate(${sim.x} ${sim.y})`}
              >
                <g className="blob-pop-in">
                  <WaterBlobShape cx={0} cy={0} radius={18} seed={tagSeed} active sweep stretchX={stretchX} />
                </g>
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
              x={CENTER_X + r * Math.cos(angle)}
              y={CENTER_Y + r * Math.sin(angle)}
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
            ref={(el) => {
              if (!isActive) return
              if (el) pillRefs.current.set(tag, el)
              else pillRefs.current.delete(tag)
            }}
            style={
              {
                left: `${(pos.x / VIEW_W) * 100}%`,
                top: `${(pos.y / VIEW_H) * 100}%`,
                transition,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--ampx": `${ampX}px`,
                "--ampy": `${ampY}px`,
              } as React.CSSProperties
            }
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${isActive ? "" : "neuron-float"}`}
          >
            <button
              type="button"
              onClick={() => onToggle(tag)}
              style={
                isActive
                  ? ({ filter: "drop-shadow(0 0 3px #f2dd72) drop-shadow(0 0 7px #f2dd72)" } as React.CSSProperties)
                  : undefined
              }
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out hover:scale-125 ${
                isActive
                  ? "text-[#0a1f3d]"
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
