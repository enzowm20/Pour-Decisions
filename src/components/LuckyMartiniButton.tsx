import { useEffect, useRef } from "react"

// ── Pip positions (normalised -1 to 1) ────────────────────────────────────────
const PIPS_2D: [number,number][][] = [
  [[0,0]],
  [[-1,-1],[1,1]],
  [[-1,-1],[0,0],[1,1]],
  [[-1,-1],[1,-1],[-1,1],[1,1]],
  [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
  [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],
]

// ── Draw a flat illustrated die ───────────────────────────────────────────────
function drawFlatDie(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, half: number, angle: number,
  pipColor: string, pips: number,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)

  const h = half, r = h * 0.18

  // Drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 3
  ctx.beginPath()
  ctx.moveTo(-h+r,-h); ctx.lineTo(h-r,-h); ctx.quadraticCurveTo(h,-h,h,-h+r)
  ctx.lineTo(h,h-r);   ctx.quadraticCurveTo(h,h,h-r,h)
  ctx.lineTo(-h+r,h);  ctx.quadraticCurveTo(-h,h,-h,h-r)
  ctx.lineTo(-h,-h+r); ctx.quadraticCurveTo(-h,-h,-h+r,-h)
  ctx.closePath()
  // Illustrated face gradient — lighter top-left, darker bottom-right
  const fg = ctx.createLinearGradient(-h,-h,h,h)
  fg.addColorStop(0,'#f7f2e8')
  fg.addColorStop(1,'#d6cdb5')
  ctx.fillStyle = fg
  ctx.fill()
  ctx.restore()

  // Redraw path without shadow for stroke
  ctx.beginPath()
  ctx.moveTo(-h+r,-h); ctx.lineTo(h-r,-h); ctx.quadraticCurveTo(h,-h,h,-h+r)
  ctx.lineTo(h,h-r);   ctx.quadraticCurveTo(h,h,h-r,h)
  ctx.lineTo(-h+r,h);  ctx.quadraticCurveTo(-h,h,-h,h-r)
  ctx.lineTo(-h,-h+r); ctx.quadraticCurveTo(-h,-h,-h+r,-h)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(90,70,30,0.28)'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Top-left bright edge highlight
  ctx.beginPath()
  ctx.moveTo(-h+r,-h); ctx.lineTo(h-r,-h)
  ctx.moveTo(-h,-h+r); ctx.lineTo(-h,h-r)
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Pips
  ctx.fillStyle = pipColor
  for (const [px,py] of (PIPS_2D[pips-1] ?? [])) {
    ctx.beginPath()
    ctx.arc(px*h*0.54, py*h*0.54, h*0.14, 0, Math.PI*2)
    ctx.fill()
  }

  ctx.restore()
}

// ── Draw the flat illustrated martini glass ───────────────────────────────────
function drawGlass(ctx: CanvasRenderingContext2D, cx: number, pivotY: number, liqAlpha: number, liqPhase: number) {
  const rimY = pivotY - 85, rimRX = 66, rimRY = 18
  const tipY = pivotY - 5
  const stemBot = pivotY + 22, baseRX = 22, baseRY = 6
  const liqY = rimY + 20, liqRX = 56, liqRY = 14

  // ── Liquid fill ──
  if (liqAlpha > 0) {
    ctx.save()
    // Clip to glass bowl
    ctx.beginPath()
    ctx.moveTo(cx, tipY)
    ctx.bezierCurveTo(cx+3, tipY-10, cx+rimRX, rimY+22, cx+rimRX, rimY)
    ctx.lineTo(cx-rimRX, rimY)
    ctx.bezierCurveTo(cx-rimRX, rimY+22, cx-3, tipY-10, cx, tipY)
    ctx.clip()
    const sway = Math.sin(liqPhase) * 2.5
    // Body
    ctx.beginPath()
    ctx.moveTo(cx+liqRX, liqY+sway)
    ctx.bezierCurveTo(cx+liqRX, liqY+32, cx+3, tipY-8, cx, tipY)
    ctx.bezierCurveTo(cx-3, tipY-8, cx-liqRX, liqY+32, cx-liqRX, liqY+sway)
    ctx.ellipse(cx, liqY+sway, liqRX, liqRY, 0, Math.PI, 0)
    const lg = ctx.createLinearGradient(cx-liqRX, liqY, cx+liqRX, liqY+40)
    lg.addColorStop(0, `rgba(100,210,205,${liqAlpha*0.72})`)
    lg.addColorStop(1, `rgba(55,165,158,${liqAlpha*0.88})`)
    ctx.fillStyle = lg; ctx.fill()
    // Surface ellipse
    ctx.beginPath()
    ctx.ellipse(cx, liqY+sway, liqRX, liqRY, 0, 0, Math.PI*2)
    ctx.fillStyle = `rgba(140,225,220,${liqAlpha*0.55})`; ctx.fill()
    // Surface highlight blob
    ctx.beginPath()
    ctx.ellipse(cx-liqRX*0.2, liqY-liqRY*0.3+sway, liqRX*0.48, liqRY*0.38, 0, 0, Math.PI*2)
    ctx.fillStyle = `rgba(255,255,255,${liqAlpha*0.7})`; ctx.fill()
    ctx.restore()
  }

  // ── Glass bowl fill (very subtle glass tint) ──
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, tipY)
  ctx.bezierCurveTo(cx+3, tipY-10, cx+rimRX, rimY+22, cx+rimRX, rimY)
  ctx.lineTo(cx-rimRX, rimY)
  ctx.bezierCurveTo(cx-rimRX, rimY+22, cx-3, tipY-10, cx, tipY)
  ctx.clip()
  const gt = ctx.createLinearGradient(cx-rimRX, rimY, cx+rimRX, rimY)
  gt.addColorStop(0,'rgba(160,235,230,0.12)')
  gt.addColorStop(0.5,'rgba(160,235,230,0.02)')
  gt.addColorStop(1,'rgba(160,235,230,0.12)')
  ctx.fillStyle = gt
  ctx.fillRect(cx-rimRX, rimY, rimRX*2, tipY-rimY)
  // Left glass reflection stripe
  ctx.beginPath()
  ctx.moveTo(cx-rimRX+9, rimY+6)
  ctx.bezierCurveTo(cx-rimRX+14, rimY+22, cx-rimRX+8, tipY-28, cx-14, tipY-8)
  ctx.strokeStyle = 'rgba(255,255,255,0.32)'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // ── Glass walls ──
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const side of [-1,1]) {
    ctx.beginPath()
    ctx.moveTo(cx+side*rimRX, rimY)
    ctx.bezierCurveTo(cx+side*rimRX, rimY+22, cx+side*3, tipY-10, cx, tipY)
    ctx.strokeStyle = 'rgba(230,250,250,0.88)'
    ctx.lineWidth = 2.2; ctx.stroke()
  }

  // ── Rim ──
  // Back half (darker, recedes)
  ctx.beginPath()
  ctx.ellipse(cx, rimY, rimRX, rimRY, 0, 0, Math.PI)
  ctx.strokeStyle = 'rgba(165,130,25,0.55)'; ctx.lineWidth = 3.5; ctx.stroke()
  // Front half (gold)
  ctx.beginPath()
  ctx.ellipse(cx, rimY, rimRX, rimRY, 0, Math.PI, Math.PI*2)
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 5; ctx.stroke()
  // Highlight stripe on rim
  ctx.beginPath()
  ctx.ellipse(cx-rimRX*0.22, rimY-rimRY*0.52, rimRX*0.32, rimRY*0.45, 0.1, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fill()

  // ── Stem ──
  ctx.beginPath(); ctx.moveTo(cx, tipY); ctx.lineTo(cx, stemBot)
  ctx.strokeStyle = 'rgba(210,240,238,0.72)'; ctx.lineWidth = 2.2; ctx.stroke()

  // ── Base ──
  ctx.beginPath(); ctx.ellipse(cx, stemBot, baseRX, baseRY, 0, 0, Math.PI*2)
  ctx.strokeStyle = 'rgba(175,228,224,0.65)'; ctx.lineWidth = 1.8; ctx.stroke()
  const bfg = ctx.createRadialGradient(cx-baseRX*0.3, stemBot-baseRY*0.5, 0, cx, stemBot, baseRX)
  bfg.addColorStop(0,'rgba(160,225,220,0.22)'); bfg.addColorStop(1,'rgba(80,170,165,0.06)')
  ctx.fillStyle = bfg; ctx.fill()
}

// ── Draw the liquid blob splash ───────────────────────────────────────────────
function drawBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, sc: number) {
  if (sc <= 0) return
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(sc, sc)

  // Main blob path (organic liquid splash shape, inspired by the second reference)
  ctx.beginPath()
  ctx.moveTo(0,-68)
  ctx.bezierCurveTo(18,-85, 55,-72, 70,-48)   // upper right finger
  ctx.bezierCurveTo(88,-28, 95,5, 82,32)
  ctx.bezierCurveTo(68,58, 35,62, 12,72)       // lower right
  ctx.bezierCurveTo(-8,82, -28,72, -32,52)
  ctx.bezierCurveTo(-38,30, -22,8, -38,-8)
  ctx.bezierCurveTo(-52,-22, -82,-12, -78,-44) // left finger
  ctx.bezierCurveTo(-74,-72, -22,-80, 0,-68)
  ctx.closePath()

  const bg = ctx.createRadialGradient(-10,-20,5, 0,0, 88)
  bg.addColorStop(0,'rgba(215,178,55,0.92)')
  bg.addColorStop(0.55,'rgba(200,162,45,0.82)')
  bg.addColorStop(1,'rgba(168,132,28,0.68)')
  ctx.fillStyle = bg; ctx.fill()

  // Inner highlight
  ctx.beginPath()
  ctx.ellipse(-18,-28, 26,14,-0.4, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,248,190,0.5)'; ctx.fill()

  // Satellite drops
  for (const [sx,sy,sr] of [[88,-42,8],[108,-4,5],[65,-80,6],[-88,-35,7],[22,82,5],[-30,78,6],[100,18,4],[42,-88,5],[-55,55,4]] as [number,number,number][]) {
    ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2)
    ctx.fillStyle = 'rgba(205,165,42,0.82)'; ctx.fill()
    // Tiny highlight
    ctx.beginPath(); ctx.arc(sx-sr*0.3,sy-sr*0.35,sr*0.3,0,Math.PI*2)
    ctx.fillStyle = 'rgba(255,245,180,0.55)'; ctx.fill()
  }

  ctx.restore()
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Die { orbitAngle: number; spin: number; x: number; y: number; vx: number; vy: number; frozen: boolean }
interface AnimState {
  phase: 'idle' | 'throw' | 'air'
  t: number
  glassAngle: number
  blobScale: number
  liqAlpha: number
  dice: [Die, Die]
}

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

// ── Component ─────────────────────────────────────────────────────────────────
export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liqPhase = useRef(0)
  const prevSpinning = useRef(false)
  const frameRef = useRef(0)

  const st = useRef<AnimState>({
    phase: 'idle', t: 0, glassAngle: 0, blobScale: 0, liqAlpha: 1,
    dice: [
      { orbitAngle: 0,       spin: 0,   x: 0, y: 0, vx: -2.2, vy: -4.8, frozen: false },
      { orbitAngle: Math.PI, spin: 0.8, x: 0, y: 0, vx:  2.6, vy: -5.6, frozen: false },
    ],
  })

  useEffect(() => {
    const was = prevSpinning.current
    prevSpinning.current = !!spinning
    if (spinning && !was) {
      const s = st.current
      s.phase = 'throw'; s.t = 0; s.blobScale = 0; s.liqAlpha = 1
      s.dice[0].frozen = false; s.dice[1].frozen = false
    }
    if (!spinning && was) {
      const s = st.current
      s.phase = 'idle'; s.glassAngle = 0; s.blobScale = 0; s.liqAlpha = 1
      s.dice[0].orbitAngle = 0; s.dice[1].orbitAngle = Math.PI
    }
  }, [spinning])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    // Glass pivot coords (center of glass, near stem-bowl junction)
    const GCX = W / 2
    const GPIVOT_Y = 168

    // Idle orbit of dice inside glass (ellipse matching liquid surface perspective)
    const ORBIT_CX = GCX, ORBIT_CY = GPIVOT_Y - 62
    const ORBIT_RX = 22, ORBIT_RY = 7

    // Where blob renders in the air phase (upper-right area)
    const BLOB_CX = W * 0.66, BLOB_CY = H * 0.3

    // Where dice float in air phase
    const AIR_POS: [number,number][] = [[W*0.55, H*0.14], [W*0.78, H*0.2]]

    function tick() {
      const s = st.current
      liqPhase.current += 0.04
      ctx.clearRect(0, 0, W, H)

      if (s.phase === 'idle') {
        for (const [i,d] of s.dice.entries()) {
          d.orbitAngle += 0.016
          const a = d.orbitAngle + i * Math.PI
          d.x = ORBIT_CX + Math.cos(a) * ORBIT_RX
          d.y = ORBIT_CY + Math.sin(a) * ORBIT_RY
          d.spin += 0.012
        }
        s.glassAngle = 0
        s.blobScale = 0
        s.liqAlpha = 1

        drawGlass(ctx, GCX, GPIVOT_Y, 1, liqPhase.current)
        // Back die first (behind glass center)
        const order = [0,1].sort((a,b) => s.dice[a].y - s.dice[b].y)
        for (const i of order)
          drawFlatDie(ctx, s.dice[i].x, s.dice[i].y, 11, s.dice[i].spin,
            i===0 ? '#3d7a76' : '#8b6914', i===0 ? 3 : 5)

      } else if (s.phase === 'throw') {
        s.t += 1/60
        const tN = Math.min(1, s.t / 0.72)
        // ease in-out
        const ease = tN < 0.5 ? 2*tN*tN : 1-Math.pow(-2*tN+2,2)/2

        // Glass tilts clockwise (opening swings to upper-right to "throw")
        const TARGET_ANGLE = 0.9  // ~52°
        s.glassAngle = ease * TARGET_ANGLE

        // Liquid drains as glass tilts past ~30%
        s.liqAlpha = Math.max(0, 1 - (tN - 0.25) * 3.5)

        // Dice fly from orbit → air positions after ~40% tilt
        if (tN > 0.38) {
          const dT = Math.min(1, (tN-0.38)/0.62)
          for (const [,d] of s.dice.entries()) {
            if (!d.frozen) {
              d.x += d.vx; d.y += d.vy; d.vy += 0.14
              d.spin += 0.08
            }
          }
          // Check if they've reached target
          if (tN >= 1) {
            for (const [i,d] of s.dice.entries()) {
              d.x = AIR_POS[i][0]; d.y = AIR_POS[i][1]; d.frozen = true
            }
          }
          void dT
        } else {
          // Still orbiting
          for (const [i,d] of s.dice.entries()) {
            d.orbitAngle += 0.016
            const a = d.orbitAngle + i * Math.PI
            d.x = ORBIT_CX + Math.cos(a) * ORBIT_RX
            d.y = ORBIT_CY + Math.sin(a) * ORBIT_RY
            d.spin += 0.012
          }
        }

        // Blob grows in as liquid pours out
        s.blobScale = Math.max(0, (tN - 0.3) / 0.7)

        // Draw tilted glass
        ctx.save()
        ctx.translate(GCX, GPIVOT_Y)
        ctx.rotate(s.glassAngle)
        ctx.translate(-GCX, -GPIVOT_Y)
        drawGlass(ctx, GCX, GPIVOT_Y, s.liqAlpha, liqPhase.current)
        ctx.restore()

        // Blob
        drawBlob(ctx, BLOB_CX, BLOB_CY, s.blobScale)

        // Dice
        for (const [i,d] of s.dice.entries())
          drawFlatDie(ctx, d.x, d.y, 11, d.spin,
            i===0 ? '#3d7a76' : '#8b6914', i===0 ? 3 : 5)

        if (tN >= 1) s.phase = 'air'

      } else { // air
        s.t += 1/60
        // Dice bob gently
        for (const [i,d] of s.dice.entries()) {
          d.x = AIR_POS[i][0]
          d.y = AIR_POS[i][1] + Math.sin(s.t * 1.8 + i * 1.3) * 4
          d.spin += 0.022
        }

        // Blob fully shown, slight pulse
        s.blobScale = 1 + Math.sin(s.t * 2.2) * 0.02

        // Glass stays tilted
        ctx.save()
        ctx.translate(GCX, GPIVOT_Y)
        ctx.rotate(0.9)
        ctx.translate(-GCX, -GPIVOT_Y)
        drawGlass(ctx, GCX, GPIVOT_Y, 0, liqPhase.current)
        ctx.restore()

        drawBlob(ctx, BLOB_CX, BLOB_CY, s.blobScale)

        for (const [i,d] of s.dice.entries())
          drawFlatDie(ctx, d.x, d.y, 11, d.spin,
            i===0 ? '#3d7a76' : '#8b6914', i===0 ? 3 : 5)

        // Rolling text
        ctx.font = 'bold 11px system-ui,sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(200,162,45,0.92)'
        ctx.fillText('Rolling…', W/2, H - 8)
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Generate a random cocktail"
      style={{
        background: 'none', border: 'none', padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
      className="group active:scale-95 transition-transform duration-150"
    >
      <canvas ref={canvasRef} width={220} height={256} style={{ display: 'block' }} />
      {!spinning && (
        <span className="mt-0.5 text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
          Feeling Lucky?
        </span>
      )}
    </button>
  )
}
