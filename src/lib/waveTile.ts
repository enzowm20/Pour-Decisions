// A handful of irregular wave-tile shapes (not a uniform sine) so layers don't
// read as straight parallel lines. Each path starts/ends at matching y and
// slope, so background-repeat-x tiles cleanly while still looking organic.
const WAVE_PATHS = [
  { width: 260, height: 90, d: "M0,45 C45,10 85,10 130,45 C175,80 215,80 260,45 L260,90 L0,90 Z" },
  { width: 180, height: 60, d: "M0,30 C25,52 55,52 90,30 C125,8 155,8 180,30 L180,60 L0,60 Z" },
  {
    width: 340,
    height: 110,
    d: "M0,55 C40,15 75,15 115,55 C150,90 185,25 225,55 C265,80 300,80 340,55 L340,110 L0,110 Z",
  },
]

export function waveTile(color: string, variant: number) {
  const { width, height, d } = WAVE_PATHS[variant % WAVE_PATHS.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><path d='${d}' fill='${color}'/></svg>`
  return {
    uri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    width,
    height,
  }
}
