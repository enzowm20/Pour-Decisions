import { useEffect, useRef } from "react"

// ── Pip positions (normalised -1..1) ─────────────────────────────────────────
const PIPS: [number,number][][] = [
  [[0,0]],
  [[-1,-1],[1,1]],
  [[-1,-1],[0,0],[1,1]],
  [[-1,-1],[1,-1],[-1,1],[1,1]],
  [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
  [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],
]

// ── Flat illustrated die ──────────────────────────────────────────────────────
function drawFlatDie(ctx: CanvasRenderingContext2D, cx: number, cy: number, half: number, angle: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  const h = half, r = h * 0.18
  // Rounded rect face
  ctx.beginPath()
  ctx.moveTo(-h+r,-h); ctx.lineTo(h-r,-h); ctx.quadraticCurveTo(h,-h,h,-h+r)
  ctx.lineTo(h,h-r);   ctx.quadraticCurveTo(h,h,h-r,h)
  ctx.lineTo(-h+r,h);  ctx.quadraticCurveTo(-h,h,-h,h-r)
  ctx.lineTo(-h,-h+r); ctx.quadraticCurveTo(-h,-h,-h+r,-h)
  ctx.closePath()
  const fg = ctx.createLinearGradient(-h,-h,h*0.6,h*0.6)
  fg.addColorStop(0,'#f8f3e8'); fg.addColorStop(1,'#d8d0b8')
  ctx.fillStyle = fg; ctx.fill()
  ctx.strokeStyle = 'rgba(80,60,20,0.22)'; ctx.lineWidth = 1.1; ctx.stroke()
  // Top-left edge highlight
  ctx.beginPath()
  ctx.moveTo(-h+r,-h); ctx.lineTo(h*0.4,-h)
  ctx.moveTo(-h,-h+r); ctx.lineTo(-h,h*0.4)
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.8; ctx.stroke()
  // Shadow edge bottom-right
  ctx.beginPath()
  ctx.moveTo(h*0.5,h); ctx.lineTo(h-r,h)
  ctx.moveTo(h,h*0.5); ctx.lineTo(h,h-r)
  ctx.strokeStyle = 'rgba(80,60,20,0.18)'; ctx.lineWidth = 1.5; ctx.stroke()
  // Pips — use face 5 (always)
  ctx.fillStyle = 'rgba(45,80,78,0.88)'
  for (const [px,py] of PIPS[4]) {
    ctx.beginPath(); ctx.arc(px*h*0.52, py*h*0.52, h*0.13, 0, Math.PI*2); ctx.fill()
  }
  ctx.restore()
}

// ── Wine glass path helper ────────────────────────────────────────────────────
function glassPath(ctx: CanvasRenderingContext2D, cx: number) {
  const rimY=38, rimRX=40
  const wideY=128, wideRX=64
  const neckY=192, neckRX=9
  ctx.beginPath()
  ctx.moveTo(cx-rimRX, rimY)
  ctx.bezierCurveTo(cx-rimRX-10,rimY+30, cx-wideRX,wideY-32, cx-wideRX,wideY)
  ctx.bezierCurveTo(cx-wideRX,wideY+44, cx-neckRX-7,neckY-16, cx-neckRX,neckY)
  ctx.lineTo(cx+neckRX, neckY)
  ctx.bezierCurveTo(cx+neckRX+7,neckY-16, cx+wideRX,wideY+44, cx+wideRX,wideY)
  ctx.bezierCurveTo(cx+wideRX,wideY-32, cx+rimRX+10,rimY+30, cx+rimRX,rimY)
  ctx.closePath()
}

// ── Main glass draw ───────────────────────────────────────────────────────────
function drawWineGlass(ctx: CanvasRenderingContext2D, cx: number, liqPhase: number) {
  const rimY=38, rimRX=40
  const wideY=128, wideRX=64
  const neckY=192, neckRX=9
  const stemBot=252, baseRX=28, baseRY=7

  // Liquid surface position — gentle sloshing
  const swayY = Math.sin(liqPhase * 0.6) * 5
  const swayX = Math.cos(liqPhase * 0.45) * 6
  const liqSurfY = 90  // how high liquid is in glass

  // ── Liquid fill ──
  ctx.save()
  glassPath(ctx, cx)
  ctx.clip()

  // Full bowl fill with gold liquid
  const lg = ctx.createLinearGradient(cx-wideRX, liqSurfY, cx+wideRX, neckY)
  lg.addColorStop(0, 'rgba(240,215,65,0.92)')
  lg.addColorStop(0.5,'rgba(215,178,40,0.96)')
  lg.addColorStop(1, 'rgba(175,138,22,0.98)')
  ctx.fillStyle = lg
  ctx.beginPath()
  // Liquid surface wave (bezier so it curves naturally)
  ctx.moveTo(cx-60+swayX, liqSurfY+swayY)
  ctx.bezierCurveTo(cx-20+swayX, liqSurfY-6+swayY, cx+20+swayX, liqSurfY+4+swayY, cx+60+swayX, liqSurfY+swayY)
  // Down the right wall to neck
  ctx.bezierCurveTo(cx+wideRX,wideY+44, cx+neckRX+7,neckY-16, cx+neckRX,neckY)
  ctx.lineTo(cx-neckRX, neckY)
  ctx.bezierCurveTo(cx-neckRX-7,neckY-16, cx-wideRX,wideY+44, cx-wideRX,liqSurfY+20)
  ctx.closePath()
  ctx.fill()

  // Liquid inner glow / highlight blob
  ctx.beginPath()
  ctx.ellipse(cx+swayX*0.5-8, liqSurfY+22+swayY*0.5, 24, 16, -0.3, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,248,160,0.38)'; ctx.fill()
  // Second small highlight
  ctx.beginPath()
  ctx.ellipse(cx+swayX*0.3+10, liqSurfY+40+swayY*0.3, 12, 8, 0.2, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,248,180,0.25)'; ctx.fill()

  // ── Empty glass region above liquid ──
  ctx.fillStyle = 'rgba(175,220,218,0.18)'
  ctx.fillRect(cx-wideRX-2, rimY, (wideRX+2)*2, liqSurfY+swayY - rimY + 2)

  ctx.restore()

  // ── Glass walls (drawn on top so they frame everything) ──
  ctx.save()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  // Left wall
  ctx.beginPath()
  ctx.moveTo(cx-rimRX, rimY)
  ctx.bezierCurveTo(cx-rimRX-10,rimY+30, cx-wideRX,wideY-32, cx-wideRX,wideY)
  ctx.bezierCurveTo(cx-wideRX,wideY+44, cx-neckRX-7,neckY-16, cx-neckRX,neckY)
  ctx.strokeStyle = 'rgba(195,232,230,0.78)'; ctx.lineWidth = 2.8; ctx.stroke()
  // Right wall
  ctx.beginPath()
  ctx.moveTo(cx+rimRX, rimY)
  ctx.bezierCurveTo(cx+rimRX+10,rimY+30, cx+wideRX,wideY-32, cx+wideRX,wideY)
  ctx.bezierCurveTo(cx+wideRX,wideY+44, cx+neckRX+7,neckY-16, cx+neckRX,neckY)
  ctx.strokeStyle = 'rgba(195,232,230,0.78)'; ctx.lineWidth = 2.8; ctx.stroke()

  // Glass body fill (very faint teal tint on the walls, not the liquid area)
  glassPath(ctx, cx)
  ctx.save()
  ctx.clip()
  const gt = ctx.createLinearGradient(cx-wideRX, rimY, cx+wideRX, rimY)
  gt.addColorStop(0,'rgba(150,225,220,0.1)')
  gt.addColorStop(0.5,'rgba(150,225,220,0.01)')
  gt.addColorStop(1,'rgba(150,225,220,0.1)')
  ctx.fillStyle = gt
  ctx.fillRect(cx-wideRX-2, rimY, (wideRX+2)*2, neckY-rimY)
  ctx.restore()

  // Left reflection stripe (matches reference style — white streak on bowl)
  ctx.save()
  glassPath(ctx, cx)
  ctx.clip()
  ctx.beginPath()
  ctx.moveTo(cx-rimRX+8, rimY+10)
  ctx.bezierCurveTo(cx-rimRX+12, rimY+40, cx-wideRX+12, wideY-10, cx-wideRX+14, wideY+40)
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 8; ctx.stroke()
  ctx.restore()

  // Rim opening — thin ellipse to show the glass lip
  ctx.beginPath()
  ctx.ellipse(cx, rimY, rimRX, rimRX*0.22, 0, 0, Math.PI*2)
  ctx.strokeStyle = 'rgba(195,232,230,0.6)'; ctx.lineWidth = 2; ctx.stroke()
  // Rim highlight
  ctx.beginPath()
  ctx.ellipse(cx-rimRX*0.25, rimY-rimRX*0.1, rimRX*0.32, rimRX*0.1, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill()

  // Stem
  ctx.beginPath(); ctx.moveTo(cx, neckY); ctx.lineTo(cx, stemBot)
  const sg = ctx.createLinearGradient(cx-4, neckY, cx+4, neckY)
  sg.addColorStop(0,'rgba(175,228,224,0.5)'); sg.addColorStop(1,'rgba(155,215,210,0.7)')
  ctx.strokeStyle = 'rgba(190,230,227,0.68)'; ctx.lineWidth = 5; ctx.stroke()

  // Base
  ctx.beginPath(); ctx.ellipse(cx, stemBot, baseRX, baseRY, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(160,225,220,0.18)'; ctx.fill()
  ctx.strokeStyle = 'rgba(185,230,227,0.58)'; ctx.lineWidth = 2; ctx.stroke()
  // Base highlight
  ctx.beginPath(); ctx.ellipse(cx-baseRX*0.3, stemBot-baseRY*0.4, baseRX*0.4, baseRY*0.5, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill()

  ctx.restore()
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phase = useRef(0)
  const dieAngle = useRef(0)
  const dieOrbit = useRef(0)
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const CX = W / 2

    // Die orbits inside the liquid region of the wine glass
    const ORBIT_CX = CX, ORBIT_CY = 148, ORBIT_RX = 22, ORBIT_RY = 10

    function tick() {
      // Slow everything down — gentle gif-like pace
      phase.current    += 0.022
      dieOrbit.current += 0.016
      dieAngle.current += 0.018

      ctx.clearRect(0, 0, W, H)

      // Draw the glass
      drawWineGlass(ctx, CX, phase.current)

      // Die swirls inside the liquid — clip to glass bowl so it stays inside
      const dieX = ORBIT_CX + Math.cos(dieOrbit.current) * ORBIT_RX
      const dieY = ORBIT_CY + Math.sin(dieOrbit.current) * ORBIT_RY
      ctx.save()
      glassPath(ctx, CX)
      ctx.clip()
      drawFlatDie(ctx, dieX, dieY, 12, dieAngle.current)
      ctx.restore()

      // "Rolling the Dice" text while thinking
      if (spinning) {
        ctx.textAlign = 'center'
        ctx.font = 'bold 11px system-ui,sans-serif'
        ctx.fillStyle = 'rgba(215,178,40,0.92)'
        ctx.fillText('Rolling the Dice…', CX, H - 8)
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [spinning])

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
      <canvas ref={canvasRef} width={200} height={290} style={{ display: 'block' }} />
      {!spinning && (
        <span className="mt-0.5 text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
          Feeling Lucky?
        </span>
      )}
    </button>
  )
}
