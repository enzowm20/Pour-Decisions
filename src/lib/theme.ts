export type ThemeName = "aperol" | "chambord" | "bombay" | "jager" | "gordons"

export function themeForPath(pathname: string): ThemeName {
  if (pathname.startsWith("/venues")) return "chambord"
  if (pathname.startsWith("/lab")) return "bombay"
  if (pathname.startsWith("/archive")) return "jager"
  if (pathname.startsWith("/menu")) return "gordons"
  return "aperol"
}

// Shared per-layer shape (wavelength variant, scroll speed, vertical jitter) —
// only the actual liquid colour changes between themes, so the desync
// behaviour from layer to layer stays consistent across pages.
const LAYER_SHAPE = [
  { peek: 9, variant: 2, speed: 0.18, jitterAmp: 3.2, jitterPeriod: 260, phase: 0 },
  { peek: 6.5, variant: 0, speed: 0.32, jitterAmp: 2.4, jitterPeriod: 190, phase: 1.4 },
  { peek: 4, variant: 1, speed: 0.46, jitterAmp: 3.6, jitterPeriod: 330, phase: 2.7 },
  { peek: 1.5, variant: 2, speed: 0.62, jitterAmp: 1.8, jitterPeriod: 150, phase: 4.1 },
  { peek: 0, variant: 0, speed: 0.8, jitterAmp: 2.6, jitterPeriod: 220, phase: 5.5 },
]

// Five shades per spirit, darkest/back to the true bottle-liquid colour up
// front — what's fully visible when the page is unscrolled.
const LIQUID_COLORS: Record<ThemeName, string[]> = {
  aperol: ["#7A2409", "#A6330F", "#F9C08C", "#F2945B", "#E8531B"],
  chambord: ["#1F0712", "#3A0E22", "#8C3F66", "#5C1638", "#5A1235"],
  bombay: ["#0B2A4A", "#123F6E", "#6FA8DC", "#1C5C9E", "#1768AD"],
  jager: ["#1A0E08", "#2E1810", "#6E3A1E", "#3F2012", "#2B160C"],
  gordons: ["#4A1228", "#7A1F45", "#F2C2D9", "#D9447D", "#E87FAE"],
}

export interface LiquidLayer {
  color: string
  peek: number
  variant: number
  speed: number
  jitterAmp: number
  jitterPeriod: number
  phase: number
}

export function liquidLayersForTheme(theme: ThemeName): LiquidLayer[] {
  const colors = LIQUID_COLORS[theme]
  return LAYER_SHAPE.map((shape, i) => ({ ...shape, color: colors[i] }))
}
