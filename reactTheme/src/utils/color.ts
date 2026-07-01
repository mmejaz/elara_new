// Shared color helpers used across the admin UI (theming, charts, badges).

interface Rgb {
  r: number
  g: number
  b: number
}

export function parseHexColor(hex: string): Rgb {
  const normalized = hex.replace('#', '')

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export function hexToRgba(hex: string, alpha = 1): string {
  const { r, g, b } = parseHexColor(hex)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mixHex(hex: string, mixWith: string, amount: number): string {
  const base = parseHexColor(hex)
  const target = parseHexColor(mixWith)
  const channel = (key: keyof Rgb) =>
    Math.round(base[key] + (target[key] - base[key]) * amount)
  const toHex = (value: number) => value.toString(16).padStart(2, '0')

  return `#${toHex(channel('r'))}${toHex(channel('g'))}${toHex(channel('b'))}`
}

// Build a tonal palette around the primary color — used to color chart series
// so pies/columns automatically follow the active brand color.
export function buildThemeColorPalette(primaryColor: string, count = 4): string[] {
  if (count <= 1) {
    return [primaryColor]
  }

  return Array.from({ length: count }, (_, index) => {
    const position = index / (count - 1)

    if (position < 0.5) {
      return mixHex(primaryColor, '#000000', (0.5 - position) * 0.8)
    }

    return mixHex(primaryColor, '#ffffff', (position - 0.5) * 0.9)
  })
}
