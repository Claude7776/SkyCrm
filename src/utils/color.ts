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
