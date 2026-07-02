import { useEffect, useRef } from "react"
import * as gifuct from "gifuct-js"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { parseGIF, decompressFrames } = gifuct as any
import gifSrc from "../assets/winegif.gif"

interface Props { onClick: () => void; disabled?: boolean; spinning?: boolean }

const DISPLAY_W = 220

export default function LuckyMartiniButton({ onClick, disabled, spinning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<Array<{ id: ImageData; delay: number }>>([])
  const animRef = useRef({ idx: 0, last: 0 })
  const rafRef = useRef(0)

  // Decode GIF once on mount — scale each frame down to display size, no pixel manipulation
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

        // Full-size canvas for compositing raw gifuct frames
        const full = document.createElement("canvas")
        full.width = GW; full.height = GH
        const fullCtx = full.getContext("2d")!

        // Small canvas for scaled-down storage
        const small = document.createElement("canvas")
        small.width = DISPLAY_W; small.height = DH
        const smallCtx = small.getContext("2d")!
        smallCtx.imageSmoothingEnabled = true
        smallCtx.imageSmoothingQuality = "high"

        const processed: Array<{ id: ImageData; delay: number }> = []

        for (const f of raw) {
          try {
            // Copy into a fresh ArrayBuffer-backed Uint8ClampedArray (TS requires ArrayBuffer, not SharedArrayBuffer)
            const copy = new Uint8ClampedArray(f.patch as Uint8ClampedArray)
            fullCtx.putImageData(new ImageData(copy, GW, GH), 0, 0)

            // Scale down to display size
            smallCtx.clearRect(0, 0, DISPLAY_W, DH)
            smallCtx.drawImage(full, 0, 0, DISPLAY_W, DH)

            const id = smallCtx.getImageData(0, 0, DISPLAY_W, DH)
            // 3× slower: multiply each frame delay by 3
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

  // Animation loop
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
          const ctx = cv.getContext("2d")!
          ctx.putImageData(frame.id, 0, 0)
          if (spinning) {
            ctx.textAlign = "center"
            ctx.font = "bold 11px system-ui,sans-serif"
            ctx.fillStyle = "rgba(255,255,255,0.85)"
            ctx.fillText("Rolling the Dice…", DISPLAY_W / 2, frame.id.height - 10)
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
      {/* CSS hue-rotate shifts reds → sapphire blue; dark bg becomes dark navy, blends with app */}
      <canvas
        ref={canvasRef}
        width={DISPLAY_W}
        height={DISPLAY_W}
        style={{ display: "block", filter: "hue-rotate(210deg) saturate(1.1)" }}
      />
      {!spinning && (
        <span className="mt-0.5 text-xs font-medium tracking-wide text-[var(--teal)] group-hover:text-[var(--cream)] transition-colors duration-200">
          Feeling Lucky?
        </span>
      )}
    </button>
  )
}
