import { useEffect, useRef } from "react"

// ── 3-D math ─────────────────────────────────────────────────────────────────
type V3 = [number, number, number]
const rxv = ([x,y,z]: V3, a: number): V3 => { const c=Math.cos(a),s=Math.sin(a); return [x,y*c-z*s,y*s+z*c] }
const ryv = ([x,y,z]: V3, a: number): V3 => { const c=Math.cos(a),s=Math.sin(a); return [x*c+z*s,y,-x*s+z*c] }
const rzv = ([x,y,z]: V3, a: number): V3 => { const c=Math.cos(a),s=Math.sin(a); return [x*c-y*s,x*s+y*c,z] }
const rot3 = (v: V3, ax: number, ay: number, az: number): V3 => rzv(ryv(rxv(v,ax),ay),az)
const add3 = (a: V3, b: V3): V3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]]
const mul3 = (v: V3, s: number): V3 => [v[0]*s,v[1]*s,v[2]*s]
const dot3 = (a: V3, b: V3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const pr3 = ([x,y,z]: V3, f: number, cx: number, cy: number): [number,number] => {
  const s=f/(z+f); return [cx+x*s,cy+y*s]
}

// ── Die geometry ──────────────────────────────────────────────────────────────
const HS = 10
const FACE_DEFS: { n: V3; u: V3; v: V3; pips: number }[] = [
  { n:[0,0,1],  u:[1,0,0],   v:[0,-1,0],  pips:1 },
  { n:[0,0,-1], u:[-1,0,0],  v:[0,-1,0],  pips:6 },
  { n:[0,-1,0], u:[1,0,0],   v:[0,0,1],   pips:2 },
  { n:[0,1,0],  u:[1,0,0],   v:[0,0,-1],  pips:5 },
  { n:[-1,0,0], u:[0,0,1],   v:[0,-1,0],  pips:3 },
  { n:[1,0,0],  u:[0,0,-1],  v:[0,-1,0],  pips:4 },
]
const PIP_POS: [number,number][][] = [
  [[0,0]],
  [[-3.5,-3.5],[3.5,3.5]],
  [[-3.5,-3.5],[0,0],[3.5,3.5]],
  [[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]],
  [[-3.5,-3.5],[3.5,-3.5],[0,0],[-3.5,3.5],[3.5,3.5]],
  [[-3.5,-3.5],[3.5,-3.5],[-3.5,0],[3.5,0],[-3.5,3.5],[3.5,3.5]],
]
const LIGHT_N: V3 = (([x,y,z]) => { const l=Math.sqrt(x*x+y*y+z*z); return [x/l,y/l,z/l] as V3 })([-0.4,-0.8,0.5])

function drawDie(ctx: CanvasRenderingContext2D, cx: number, cy: number, ax: number, ay: number, az: number, fov: number, faceColor: string, dotColor: string) {
  const faces = FACE_DEFS.map(f => {
    const rn = rot3(f.n, ax, ay, az)
    if (rn[2] <= 0) return null
    const shade = Math.max(0.18, dot3(rn, LIGHT_N))
    const c3 = mul3(f.n, HS)
    const verts = [
      add3(add3(c3,mul3(f.u,-HS)),mul3(f.v,-HS)),
      add3(add3(c3,mul3(f.u, HS)),mul3(f.v,-HS)),
      add3(add3(c3,mul3(f.u, HS)),mul3(f.v, HS)),
      add3(add3(c3,mul3(f.u,-HS)),mul3(f.v, HS)),
    ].map(v => rot3(v,ax,ay,az))
    const depth = verts.reduce((s,v)=>s+v[2],0)/4
    const pv = verts.map(v=>pr3(v,fov,cx,cy))
    const pipPts = PIP_POS[f.pips-1].map(([pu,pv_]) =>
      pr3(rot3(add3(add3(mul3(f.n,HS+0.5),mul3(f.u,pu)),mul3(f.v,pv_)),ax,ay,az),fov,cx,cy)
    )
    return { depth, shade, pv, pipPts }
  }).filter(Boolean).sort((a,b)=>a!.depth-b!.depth)

  for (const f of faces) {
    if (!f) continue
    ctx.beginPath()
    ctx.moveTo(f.pv[0][0],f.pv[0][1])
    f.pv.slice(1).forEach(([x,y])=>ctx.lineTo(x,y))
    ctx.closePath()
    ctx.fillStyle = faceColor
    ctx.fill()
    ctx.fillStyle = `rgba(0,0,0,${(1-f.shade)*0.72})`
    ctx.fill()
    if (f.shade > 0.55) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
    ctx.fillStyle = dotColor
    for (const [px,py] of f.pipPts) {
      ctx.beginPath(); ctx.arc(px,py,2.1,0,Math.PI*2); ctx.fill()
    }
  }
}

// ── Glass drawing ─────────────────────────────────────────────────────────────
function drawGlass(ctx: CanvasRenderingContext2D, cx: number, liqPhase: number, liqAlpha: number) {
  const rimY=62, rimRX=68, rimRY=20
  const tipY=148, botY=172, bRX=24, bRY=7
  const lY=77, lRX=58, lRY=17

  // Liquid fill
  if (liqAlpha > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx,tipY)
    ctx.bezierCurveTo(cx+4,tipY-12,cx+rimRX,rimY+30,cx+rimRX,rimY)
    ctx.lineTo(cx-rimRX,rimY)
    ctx.bezierCurveTo(cx-rimRX,rimY+30,cx-4,tipY-12,cx,tipY)
    ctx.clip()
    const sway = Math.sin(liqPhase)*2
    ctx.beginPath()
    ctx.moveTo(cx+lRX, lY+sway)
    ctx.bezierCurveTo(cx+lRX,lY+28,cx+4,tipY-10,cx,tipY)
    ctx.bezierCurveTo(cx-4,tipY-10,cx-lRX,lY+28,cx-lRX,lY+sway)
    ctx.ellipse(cx,lY+sway,lRX,lRY,0,Math.PI,0)
    const lg=ctx.createLinearGradient(cx,lY,cx,tipY)
    lg.addColorStop(0,`rgba(195,158,42,${liqAlpha*0.52})`)
    lg.addColorStop(1,`rgba(130,95,10,${liqAlpha*0.82})`)
    ctx.fillStyle=lg; ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx,lY+sway,lRX,lRY,0,0,Math.PI*2)
    ctx.fillStyle=`rgba(210,178,62,${liqAlpha*0.42})`; ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx-lRX*0.25,lY-lRY*0.25+sway,lRX*0.42,lRY*0.32,0,0,Math.PI*2)
    ctx.fillStyle=`rgba(255,245,170,${liqAlpha*0.38})`; ctx.fill()
    ctx.restore()
  }

  // Glass tint
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx,tipY)
  ctx.bezierCurveTo(cx+4,tipY-12,cx+rimRX,rimY+30,cx+rimRX,rimY)
  ctx.lineTo(cx-rimRX,rimY)
  ctx.bezierCurveTo(cx-rimRX,rimY+30,cx-4,tipY-12,cx,tipY)
  ctx.clip()
  const bg=ctx.createLinearGradient(cx-rimRX,rimY,cx+rimRX,rimY)
  bg.addColorStop(0,'rgba(120,225,215,0.13)')
  bg.addColorStop(0.5,'rgba(120,225,215,0.02)')
  bg.addColorStop(1,'rgba(120,225,215,0.13)')
  ctx.fillStyle=bg; ctx.fillRect(cx-rimRX,rimY,rimRX*2,tipY-rimY)
  ctx.restore()

  // Walls
  ctx.lineCap='round'; ctx.lineJoin='round'
  for (const side of [-1,1]) {
    ctx.beginPath()
    ctx.moveTo(cx+side*rimRX,rimY)
    ctx.bezierCurveTo(cx+side*rimRX,rimY+30,cx+side*4,tipY-12,cx,tipY)
    ctx.strokeStyle='rgba(120,225,215,0.72)'; ctx.lineWidth=2; ctx.stroke()
  }
  // Left inner highlight
  ctx.beginPath()
  ctx.moveTo(cx-rimRX+5,rimY+8)
  ctx.bezierCurveTo(cx-rimRX+7,rimY+30,cx-7,tipY-18,cx-3,tipY-5)
  ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=3.5; ctx.stroke()

  // Rim back half (dim)
  ctx.beginPath(); ctx.ellipse(cx,rimY,rimRX,rimRY,0,0,Math.PI)
  ctx.strokeStyle='rgba(100,200,195,0.38)'; ctx.lineWidth=1.5; ctx.stroke()
  // Rim front half (bright)
  ctx.beginPath(); ctx.ellipse(cx,rimY,rimRX,rimRY,0,Math.PI,Math.PI*2)
  ctx.strokeStyle='rgba(180,240,235,0.88)'; ctx.lineWidth=2; ctx.stroke()
  // Rim sparkle
  ctx.beginPath(); ctx.ellipse(cx-rimRX*0.3,rimY-rimRY*0.55,rimRX*0.16,rimRY*0.28,0,0,Math.PI*2)
  ctx.fillStyle='rgba(255,255,255,0.48)'; ctx.fill()

  // Stem + base
  ctx.beginPath(); ctx.moveTo(cx,tipY); ctx.lineTo(cx,botY)
  ctx.strokeStyle='rgba(100,215,205,0.6)'; ctx.lineWidth=2.2; ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx,botY,bRX,bRY,0,0,Math.PI*2)
  ctx.strokeStyle='rgba(100,215,205,0.55)'; ctx.lineWidth=1.8; ctx.stroke()
  ctx.fillStyle='rgba(80,180,170,0.1)'; ctx.fill()
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Die { ax:number; ay:number; az:number; rax:number; ray:number; raz:number; orbit:number; x:number; y:number; vx:number; vy:number }
interface Drop { x:number; y:number; vx:number; vy:number; life:number; r:number; frozen:boolean }
interface Anim { phase:'idle'|'throw'|'air'; t:number; dice:[Die,Die]; drops:Drop[]; splashR:number; frozenDrops:Drop[] }

interface Props { onClick:()=>void; disabled?:boolean; spinning?:boolean }

// ── Component ─────────────────────────────────────────────────────────────────
export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const anim = useRef<Anim>({
    phase:'idle', t:0, splashR:0, drops:[], frozenDrops:[],
    dice:[
      { ax:0,   ay:0,   az:0,   rax:0.021, ray:0.034, raz:0.017, orbit:0,        x:100, y:108, vx:0, vy:0 },
      { ax:1.2, ay:0.8, az:0.5, rax:0.017, ray:0.027, raz:0.023, orbit:Math.PI,  x:100, y:108, vx:0, vy:0 },
    ],
  })
  const frameRef = useRef(0)
  const prevSpinning = useRef(false)
  const liqPhase = useRef(0)

  useEffect(() => {
    const was = prevSpinning.current
    prevSpinning.current = !!spinning
    const st = anim.current
    if (spinning && !was) {
      st.phase = 'throw'; st.t = 0; st.drops = []; st.frozenDrops = []; st.splashR = 0
      st.dice[0].vx = -2.4; st.dice[0].vy = -5.2
      st.dice[1].vx =  2.9; st.dice[1].vy = -6.0
    }
    if (!spinning && was) {
      st.phase = 'idle'; st.drops = []; st.frozenDrops = []; st.splashR = 0
    }
  }, [spinning])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const CX = W / 2
    const FOV = 160
    const ORBIT_CX=CX, ORBIT_CY=108, ORBIT_RX=24, ORBIT_RY=8

    function tick() {
      const st = anim.current
      liqPhase.current += 0.04
      ctx.clearRect(0,0,W,H)

      const spd = st.phase === 'idle' ? 1 : 2.5
      for (const d of st.dice) { d.ax += d.rax*spd; d.ay += d.ray*spd; d.az += d.raz*spd }

      if (st.phase === 'idle') {
        for (const [i,d] of st.dice.entries()) {
          d.orbit += 0.018
          const a = d.orbit + i * Math.PI
          d.x = ORBIT_CX + Math.cos(a)*ORBIT_RX
          d.y = ORBIT_CY + Math.sin(a)*ORBIT_RY
        }
        drawGlass(ctx, CX, liqPhase.current, 1)
        const order = [0,1].sort((a,b)=>st.dice[a].y - st.dice[b].y)
        for (const i of order)
          drawDie(ctx,st.dice[i].x,st.dice[i].y,st.dice[i].ax,st.dice[i].ay,st.dice[i].az,FOV,
            i===0?'rgba(220,185,70,0.95)':'rgba(75,200,192,0.95)',
            i===0?'rgba(40,20,0,0.9)':'rgba(0,45,55,0.9)')

      } else if (st.phase === 'throw') {
        st.t += 1/60
        const tN = Math.min(1, st.t / 0.7)
        for (const d of st.dice) { d.x += d.vx; d.y += d.vy; d.vy += 0.12 }
        // Spawn drops
        if (tN < 0.45) {
          for (let i=0;i<2;i++) st.drops.push({
            x:CX+(Math.random()-0.5)*50, y:80+(Math.random()-0.5)*25,
            vx:(Math.random()-0.5)*5, vy:-2.5-Math.random()*3.5,
            life:1, r:2+Math.random()*3.5, frozen:false,
          })
        }
        st.drops = st.drops.filter(d=>{ d.x+=d.vx; d.y+=d.vy; d.vy+=0.13; d.life-=0.025; return d.life>0 })

        const liqAlpha = Math.max(0, 1 - tN*2.8)
        drawGlass(ctx, CX, liqPhase.current, liqAlpha)
        for (const drop of st.drops) {
          ctx.beginPath(); ctx.arc(drop.x,drop.y,drop.r*drop.life,0,Math.PI*2)
          ctx.fillStyle=`rgba(200,162,45,${drop.life*0.82})`; ctx.fill()
        }
        for (let i=0;i<2;i++)
          drawDie(ctx,st.dice[i].x,st.dice[i].y,st.dice[i].ax,st.dice[i].ay,st.dice[i].az,FOV,
            i===0?'rgba(220,185,70,0.95)':'rgba(75,200,192,0.95)',
            i===0?'rgba(40,20,0,0.9)':'rgba(0,45,55,0.9)')

        if (tN >= 1) {
          // Freeze drops & transition
          st.frozenDrops = st.drops.map(d=>({...d, frozen:true}))
          st.drops = []
          st.dice[0].x=CX-44; st.dice[0].y=48; st.dice[0].vx=0; st.dice[0].vy=0
          st.dice[1].x=CX+44; st.dice[1].y=36; st.dice[1].vx=0; st.dice[1].vy=0
          st.phase='air'
        }

      } else { // air
        st.t += 1/60
        st.splashR = Math.min(145, st.splashR + 5)
        st.dice[0].y = 48 + Math.sin(st.t*1.4)*3.5
        st.dice[1].y = 36 + Math.sin(st.t*1.4+1.2)*3.5

        // Splash background
        const sg = ctx.createRadialGradient(CX,H*0.76,0,CX,H*0.76,st.splashR)
        sg.addColorStop(0,'rgba(200,162,45,0.45)')
        sg.addColorStop(0.45,'rgba(75,200,192,0.25)')
        sg.addColorStop(1,'rgba(75,200,192,0)')
        ctx.save()
        ctx.beginPath(); ctx.ellipse(CX,H*0.76,st.splashR,st.splashR*0.38,0,0,Math.PI*2)
        ctx.fillStyle=sg; ctx.fill()
        // Splash spikes
        for (let i=0;i<8;i++) {
          const angle = (i/8)*Math.PI*2
          const len = st.splashR*(0.7+0.3*Math.sin(st.t*3+i))
          ctx.beginPath()
          ctx.moveTo(CX+Math.cos(angle)*st.splashR*0.4, H*0.76+Math.sin(angle)*st.splashR*0.15)
          ctx.lineTo(CX+Math.cos(angle)*len*0.9, H*0.76+Math.sin(angle)*len*0.36)
          ctx.strokeStyle=`rgba(200,162,45,${0.22*Math.sin(st.t*2+i*0.7+1)})`
          ctx.lineWidth=2+Math.sin(st.t*2+i)*1.5; ctx.stroke()
        }
        ctx.restore()

        // Frozen drops
        for (const drop of st.frozenDrops) {
          ctx.beginPath(); ctx.arc(drop.x,drop.y,drop.r*drop.life,0,Math.PI*2)
          ctx.fillStyle=`rgba(200,162,45,${drop.life*0.5})`; ctx.fill()
        }

        drawGlass(ctx, CX, liqPhase.current, 0)
        for (let i=0;i<2;i++)
          drawDie(ctx,st.dice[i].x,st.dice[i].y,st.dice[i].ax,st.dice[i].ay,st.dice[i].az,FOV,
            i===0?'rgba(220,185,70,0.95)':'rgba(75,200,192,0.95)',
            i===0?'rgba(40,20,0,0.9)':'rgba(0,45,55,0.9)')

        // Rolling text
        ctx.textAlign='center'; ctx.font='bold 12px system-ui,sans-serif'
        ctx.fillStyle='rgba(200,162,45,0.9)'
        ctx.fillText('Rolling…', CX, H-10)
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
      style={{ background:'none', border:'none', padding:0, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, display:'flex', flexDirection:'column', alignItems:'center' }}
      className="group active:scale-95 transition-transform duration-150"
    >
      <canvas ref={canvasRef} width={200} height={220} style={{ display:'block' }} />
      {!spinning && (
        <span className="mt-1 text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
          Feeling Lucky?
        </span>
      )}
    </button>
  )
}
