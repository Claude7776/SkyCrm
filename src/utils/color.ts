export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "")
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean
  const num = parseInt(value, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function pickForeground(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)"
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function mixWithWhite(hex: string, amount: number): string {
  const channels = hexToRgb(hex).map((c) => Math.round(c + (255 - c) * amount))
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

/** Lightens a dark accent just enough to stay visible on a dark background. */
export function readableOnDark(hex: string): string {
  let amount = 0
  let result = hex
  while (luminance(result) < 0.45 && amount < 1) {
    amount += 0.05
    result = mixWithWhite(hex, amount)
  }
  return result
}
