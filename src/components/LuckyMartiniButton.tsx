import { useEffect, useRef } from "react"
import * as gifuct from "gifuct-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { parseGIF, decompressFrames } = gifuct as any
import gifSrc from "../assets/swirl.gif"

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

const DISPLAY_W = 220

// ── Minimal HSL helpers (only used on already-scaled small frames) ────────────
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
  return [
    Math.round(hue2(h + 1 / 3) * 255),
    Math.round(hue2(h) * 255),
    Math.round(hue2(h - 1 / 3) * 255),
  ]
}

// White/near-white → transparent; red liquid → yellow via +60° hue shift
function recolor(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (data[i + 3] < 10) continue
    // Remove white background (all channels near 255)
    if (r > 220 && g > 220 && b > 220) { data[i + 3] = 0; continue }
    // Shift hue +60°: red (0°) → yellow-gold (60°)
    // Low-saturation (glass/grey) pixels are unaffected since hue shift has no visible effect
    const [h, s, l] = rgbToHsl(r, g, b)
    const [nr, ng, nb] = hslToRgb((h + 60) % 360, s, l)
    data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
  }
}

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<Array<{ id: ImageData; delay: number }>>([])
  const animRef = useRef({ idx: 0, last: 0 })
  const rafRef = useRef(0)
  const displayHRef = useRef(DISPLAY_W)

  useEffect(() => {
    fetch(gifSrc)
      .then(r => r.arrayBuffer())
      .then(buf => {
        const gif = parseGIF(buf)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any[] = decompressFrames(gif, true)
        const GW: number = gif.lsd.width
        const GH: number = gif.lsd.height
        const DH = Math.round(GH * DISPLAY_W / GW)
        displayHRef.current = DH

        // Offscreen at native GIF size for compositing
        const full = document.createElement("canvas")
        full.width = GW; full.height = GH
        const fullCtx = full.getContext("2d")!

        // Scaled-down offscreen for pixel storage
        const small = document.createElement("canvas")
        small.width = DISPLAY_W; small.height = DH
        const smallCtx = small.getContext("2d")!
        smallCtx.imageSmoothingEnabled = true
        smallCtx.imageSmoothingQuality = "high"

        const processed: Array<{ id: ImageData; delay: number }> = []

        for (const f of raw) {
          try {
            // Copy patch into a fresh ArrayBuffer-backed array (ImageData requires ArrayBuffer, not SharedArrayBuffer)
            const patch = new Uint8ClampedArray(f.patch as Uint8ClampedArray)
            fullCtx.putImageData(new ImageData(patch, GW, GH), 0, 0)

            smallCtx.clearRect(0, 0, DISPLAY_W, DH)
            smallCtx.drawImage(full, 0, 0, DISPLAY_W, DH)

            const id = smallCtx.getImageData(0, 0, DISPLAY_W, DH)
            recolor(id.data)
            // 3× slower than native GIF speed
            processed.push({ id, delay: Math.max(60, (f.delay || 5) * 10 * 3) })
          } catch {
            // skip malformed frames
          }
        }

        framesRef.current = processed

        const canvas = canvasRef.current
        if (canvas) { canvas.width = DISPLAY_W; canvas.height = DH }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function tick(now: number) {
      const frames = framesRef.current
      if (frames.length > 0) {
        const st = animRef.current
        const frame = frames[st.idx]
        if (now - st.last >= frame.delay) {
          const cv = canvasRef.current
          if (!cv) { rafRef.current = requestAnimationFrame(tick); return }
          // Sync dimensions in case canvas was resized after GIF loaded
          const dh = displayHRef.current
          if (cv.width !== DISPLAY_W || cv.height !== dh) {
            cv.width = DISPLAY_W; cv.height = dh
          }
          const ctx = cv.getContext("2d")!
          ctx.putImageData(frame.id, 0, 0)
          if (spinning) {
            ctx.textAlign = "center"
            ctx.font = "bold 11px system-ui,sans-serif"
            ctx.fillStyle = "rgba(255,220,80,0.9)"
            ctx.fillText("Rolling the Dice…", DISPLAY_W / 2, dh - 10)
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
