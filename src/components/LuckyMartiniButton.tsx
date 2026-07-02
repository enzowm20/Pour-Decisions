import { useEffect, useRef } from "react"
import * as gifuct from "gifuct-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { parseGIF, decompressFrames } = gifuct as any
import gifSrc from "../assets/winegif.gif"

// ── HSL helpers ───────────────────────────────────────────────────────────────
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
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [Math.round(hue2(h + 1 / 3) * 255), Math.round(hue2(h) * 255), Math.round(hue2(h - 1 / 3) * 255)]
}

// ── Pixel recolour on the already-scaled small frame ─────────────────────────
// Remove dark maroon bg → transparent; shift remaining hues +210° (red→sapphire)
function recolor(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (data[i + 3] < 10) continue
    // Background: dark + red-dominant
    const lum = r * 0.299 + g * 0.587 + b * 0.114
    if (lum < 68 && r > g && r > b) { data[i + 3] = 0; continue }
    // Hue shift +210° → sapphire blue palette
    const [h, s, l] = rgbToHsl(r, g, b)
    const [nr, ng, nb] = hslToRgb((h + 210) % 360, s, l)
    data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

const DISPLAY_W = 220

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<Array<{ id: ImageData; delay: number }>>([])
  const animRef = useRef({ idx: 0, last: 0 })
  const rafRef = useRef(0)
  const dimsRef = useRef({ w: DISPLAY_W, h: DISPLAY_W })

  // Decode GIF once, scale down, recolour each frame
  useEffect(() => {
    fetch(gifSrc)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const gif = parseGIF(buf)
        const rawFrames: unknown[] = decompressFrames(gif, true)

        const GW: number = (gif as { lsd: { width: number; height: number } }).lsd.width
        const GH: number = (gif as { lsd: { width: number; height: number } }).lsd.height
        const DH = Math.round(GH * DISPLAY_W / GW)
        dimsRef.current = { w: DISPLAY_W, h: DH }

        // Offscreen canvases — full size for compositing, small for storage
        const full = Object.assign(document.createElement("canvas"), { width: GW, height: GH })
        const fullCtx = full.getContext("2d")!
        const small = Object.assign(document.createElement("canvas"), { width: DISPLAY_W, height: DH })
        const smallCtx = small.getContext("2d")!

        const processed: Array<{ id: ImageData; delay: number }> = []

        for (const raw of rawFrames) {
          const f = raw as { patch: ArrayLike<number>; delay: number }
          try {
            // Write full-size frame
            const patchArr = Array.isArray(f.patch) ? f.patch : Array.from(f.patch as ArrayLike<number>)
            const patch = new Uint8ClampedArray(patchArr)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fullCtx.putImageData(new ImageData(patch as any, GW, GH), 0, 0)

            // Scale down to display size
            smallCtx.clearRect(0, 0, DISPLAY_W, DH)
            smallCtx.drawImage(full, 0, 0, DISPLAY_W, DH)

            // Get small pixels, recolour in-place
            const id = smallCtx.getImageData(0, 0, DISPLAY_W, DH)
            recolor(id.data)

            processed.push({ id, delay: Math.max(60, (f.delay || 8) * 10 * 3) })
          } catch {
            // skip bad frame
          }
        }

        framesRef.current = processed

        // Resize visible canvas to match aspect ratio
        const canvas = canvasRef.current
        if (canvas) { canvas.width = DISPLAY_W; canvas.height = DH }
      })
      .catch(console.error)
  }, [])

  // Animation loop — rebuilds when spinning changes so text renders immediately
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function tick(now: number) {
      const frames = framesRef.current
      if (frames.length > 0) {
        const st = animRef.current
        const frame = frames[st.idx]
        if (now - st.last >= frame.delay) {
          // Sync canvas size in case it was resized after load
          const { w, h } = dimsRef.current
          const cv = canvasRef.current
          if (!cv) { rafRef.current = requestAnimationFrame(tick); return }
          if (cv.width !== w || cv.height !== h) {
            cv.width = w; cv.height = h
          }
          const cvCtx = cv.getContext("2d")!
          cvCtx.putImageData(frame.id, 0, 0)
          if (spinning) {
            cvCtx.textAlign = "center"
            cvCtx.font = "bold 11px system-ui,sans-serif"
            cvCtx.fillStyle = "rgba(100,185,235,0.92)"
            cvCtx.fillText("Rolling the Dice…", w / 2, h - 10)
          }
          st.idx = (st.idx + 1) % frames.length
          st.last = now
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
