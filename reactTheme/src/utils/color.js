// Shared color helpers used across the admin UI (theming, charts, badges).

export function parseHexColor(hex) {
  const normalized = hex.replace('#', '')

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

export function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = parseHexColor(hex)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mixHex(hex, mixWith, amount) {
  const base = parseHexColor(hex)
  const target = parseHexColor(mixWith)
  const channel = (key) =>
    Math.round(base[key] + (target[key] - base[key]) * amount)
  const toHex = (value) => value.toString(16).padStart(2, '0')

  return `#${toHex(channel('r'))}${toHex(channel('g'))}${toHex(channel('b'))}`
}

// Build a tonal palette around the primary color — used to color chart series
// so pies/columns automatically follow the active brand color.
export function buildThemeColorPalette(primaryColor, count = 4) {
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
