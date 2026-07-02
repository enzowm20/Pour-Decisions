import { useEffect, useRef } from "react"
import gifSrc from "../assets/winegif.gif"

// gifuct-js ships without bundled types
import * as gifuct from "gifuct-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { parseGIF, decompressFrames } = gifuct as any

// ── HSL ↔ RGB ─────────────────────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2 = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  return [Math.round(hue2(h + 1/3) * 255), Math.round(hue2(h) * 255), Math.round(hue2(h - 1/3) * 255)]
}

// ── Per-frame pixel recoloring ────────────────────────────────────────────────
// 1. Remove dark maroon background → transparent
// 2. Shift all remaining hues +210° (red→sapphire blue, pink/mauve→teal-blue)
function recolorPixels(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 10) continue

    // Background: dark, red-dominant, low saturation overall
    const lum = r * 0.299 + g * 0.587 + b * 0.114
    if (lum < 72 && r >= g && r >= b) {
      data[i + 3] = 0
      continue
    }

    // Hue-shift remaining pixels +210°
    const [h, s, l] = rgbToHsl(r, g, b)
    const [nr, ng, nb] = hslToRgb((h + 210) % 360, s, l)
    data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface GifFrame { imageData: ImageData; delay: number }
interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

const DISPLAY_W = 220  // render at this width, maintain aspect ratio

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<GifFrame[]>([])
  const animRef = useRef({ idx: 0, lastTime: 0 })
  const rafRef = useRef(0)
  const gifDimsRef = useRef({ w: 1, h: 1 })

  // Load + decode GIF once on mount
  useEffect(() => {
    fetch(gifSrc)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const gif = parseGIF(buf)
        const rawFrames = decompressFrames(gif, true)

        const GW: number = gif.lsd.width
        const GH: number = gif.lsd.height
        gifDimsRef.current = { w: GW, h: GH }

        // Offscreen canvas for compositing
        const off = document.createElement("canvas")
        off.width = GW; off.height = GH
        offscreenRef.current = off

        framesRef.current = rawFrames.map((f: { patch: Uint8ClampedArray; dims: { width: number; height: number }; delay: number }) => {
          // Build full-size ImageData from patch
          const id = new ImageData(new Uint8ClampedArray(f.patch), GW, GH)
          recolorPixels(id.data)
          return {
            imageData: id,
            // delay is in centiseconds → ms, multiply by 3 to slow to ~1/3 speed
            delay: Math.max(50, (f.delay || 8) * 10 * 3),
          }
        })

        // Resize visible canvas now we know the GIF's aspect ratio
        if (canvasRef.current) {
          const scale = DISPLAY_W / GW
          canvasRef.current.width = DISPLAY_W
          canvasRef.current.height = Math.round(GH * scale)
        }
      })
  }, [])

  // Animation loop — restarts when spinning changes so text renders correctly
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const W = canvas.width, H = canvas.height

    function tick(now: number) {
      const frames = framesRef.current
      if (frames.length > 0) {
        const st = animRef.current
        const frame = frames[st.idx]

        if (now - st.lastTime >= frame.delay) {
          const cw = canvasRef.current?.width ?? W
          const ch = canvasRef.current?.height ?? H
          ctx.clearRect(0, 0, cw, ch)

          // Draw frame scaled to display size
          const off = offscreenRef.current!
          const offCtx = off.getContext("2d")!
          offCtx.putImageData(frame.imageData, 0, 0)
          ctx.drawImage(off, 0, 0, cw, ch)

          // "Rolling the Dice…" overlay when thinking
          if (spinning) {
            ctx.textAlign = "center"
            ctx.font = "bold 11px system-ui,sans-serif"
            ctx.fillStyle = "rgba(100,180,230,0.92)"
            ctx.fillText("Rolling the Dice…", cw / 2, ch - 10)
          }

          st.idx = (st.idx + 1) % frames.length
          st.lastTime = now
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinning])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Generate a random cocktail"
      style={{
        background: "none", border: "none", padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}
      className="group active:scale-95 transition-transform duration-150"
    >
      <canvas ref={canvasRef} width={DISPLAY_W} height={DISPLAY_W} style={{ display: "block" }} />
      {!spinning && (
        <span className="mt-0.5 text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
          Feeling Lucky?
        </span>
      )}
    </button>
  )
}
