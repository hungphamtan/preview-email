// Named color lookup table for common email-safe colors
const NAMED_COLORS: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', gray: '#808080', grey: '#808080',
  silver: '#c0c0c0', navy: '#000080', maroon: '#800000', purple: '#800080',
  fuchsia: '#ff00ff', magenta: '#ff00ff', lime: '#00ff00', aqua: '#00ffff',
  cyan: '#00ffff', teal: '#008080', olive: '#808000', orange: '#ffa500',
  coral: '#ff7f50', salmon: '#fa8072', gold: '#ffd700', khaki: '#f0e68c',
  beige: '#f5f5dc', ivory: '#fffff0', lavender: '#e6e6fa', pink: '#ffc0cb',
}

const PASSTHROUGH = new Set(['transparent', 'inherit', 'currentcolor', 'currentColor', 'none', 'initial', 'unset'])

// ── Converters ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return [r, g, b]
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
  }
  return null
}

function rgbStringToRgba(value: string): [number, number, number, number] | null {
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (!m) return null
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), m[4] !== undefined ? parseFloat(m[4]) : 1]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [
    Math.round(hue2rgb(hn + 1 / 3) * 255),
    Math.round(hue2rgb(hn) * 255),
    Math.round(hue2rgb(hn - 1 / 3) * 255),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

// ── Parser ──────────────────────────────────────────────────────────────────

function parseColor(value: string): { r: number; g: number; b: number; a: number } | null {
  const v = value.trim().toLowerCase()
  if (NAMED_COLORS[v]) {
    const rgb = hexToRgb(NAMED_COLORS[v])
    if (rgb) return { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 }
  }
  if (v.startsWith('#')) {
    const rgb = hexToRgb(v)
    if (rgb) return { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 }
  }
  if (v.startsWith('rgb')) {
    const rgba = rgbStringToRgba(v)
    if (rgba) return { r: rgba[0], g: rgba[1], b: rgba[2], a: rgba[3] }
  }
  return null
}

/**
 * Extracts the color substring from a CSS value that may contain other parts
 * e.g. "#fff url(...) no-repeat" → "#fff"
 */
export function parseColorValue(value: string): string | null {
  const v = value.trim()
  // Try the whole value first
  if (parseColor(v)) return v
  // Try extracting a hex or rgb() token
  const hexMatch = v.match(/#[0-9a-fA-F]{3,6}\b/)
  if (hexMatch) return hexMatch[0]
  const rgbMatch = v.match(/rgba?\([^)]+\)/)
  if (rgbMatch) return rgbMatch[0]
  // Named color as first token
  const firstToken = v.split(/\s+/)[0].toLowerCase()
  if (NAMED_COLORS[firstToken]) return firstToken
  return null
}

// ── Outlook full-inversion transform ───────────────────────────────────────

export function transformColorForOutlook(
  colorStr: string,
  property: 'background' | 'text'
): string {
  const v = colorStr.trim()
  if (PASSTHROUGH.has(v.toLowerCase())) return v

  const parsed = parseColor(v)
  if (!parsed) return v

  const [h, s, l] = rgbToHsl(parsed.r, parsed.g, parsed.b)

  let newL: number, newS: number

  if (property === 'background') {
    if (l > 0.70) {
      newL = 0.10 + (1 - l) * 0.15
      newS = s * 0.75
    } else if (l >= 0.30) {
      newL = l * 0.6
      newS = s
    } else {
      return v // already dark
    }
  } else {
    // text
    if (l < 0.30) {
      newL = 0.75 + l * 0.15
      newS = s * 0.90
    } else if (l <= 0.70) {
      newL = 0.40 + (1 - l) * 0.45
      newS = s
    } else {
      return v // already light
    }
  }

  // Clamp S — grayscale stays grayscale
  newS = s < 0.05 ? 0 : Math.min(1, Math.max(0, newS))
  newL = Math.min(1, Math.max(0, newL))

  const [nr, ng, nb] = hslToRgb(h, newS, newL)
  const hex = rgbToHex(nr, ng, nb)
  return parsed.a < 1 ? hex.replace('#', 'rgba(') + `,${parsed.a})` : hex
}

// ── Gmail Android smart-inversion transform ─────────────────────────────────

export function transformColorForGmailAndroid(
  colorStr: string,
  property: 'background' | 'text'
): string {
  const v = colorStr.trim()
  if (PASSTHROUGH.has(v.toLowerCase())) return v

  const parsed = parseColor(v)
  if (!parsed) return v

  const [h, s, l] = rgbToHsl(parsed.r, parsed.g, parsed.b)

  let newL: number, newS: number

  if (property === 'background') {
    // Gmail Android only transforms neutral/low-saturation backgrounds.
    // Saturated (colored) backgrounds — buttons, badges, accent cells — are preserved.
    // Threshold 0.25 catches near-neutral dark blues/grays (e.g. #272e3a s≈0.20).
    if (s > 0.25) return v

    if (l > 0.80) {
      // Near-white / white → Gmail Android Material Dark surface (~#121212)
      newL = 0.07
      newS = 0
    } else if (l > 0.50) {
      // Light gray → proportionally darker
      newL = l * 0.15
      newS = 0
    } else if (l > 0.30) {
      // Medium-light gray → moderately darkened
      newL = l * 0.25
      newS = 0
    } else {
      return v // already dark
    }
  } else {
    // text — Gmail Android lightens dark text for readability on dark backgrounds.
    // Neutral text is fully inverted; saturated text gets a lightness boost
    // to maintain contrast while preserving hue.
    if (s > 0.35) {
      // Colored text: boost lightness if too dark for dark background
      if (l < 0.45) {
        const boosted = 0.45 + (0.45 - l) * 0.4
        const [cr, cg, cb] = hslToRgb(h, s, Math.min(0.75, boosted))
        const hex = rgbToHex(cr, cg, cb)
        return parsed.a < 1 ? hex.replace('#', 'rgba(') + `,${parsed.a})` : hex
      }
      return v
    }

    if (l < 0.30) {
      // Dark/black text → near-white
      newL = 0.87
      newS = 0
    } else if (l < 0.55) {
      // Mid-gray text → lightened enough to be visible on dark background
      newL = 0.55 + (0.55 - l) * 0.35
      newS = 0
    } else {
      return v // already light
    }
  }

  newS = Math.min(1, Math.max(0, newS))
  newL = Math.min(1, Math.max(0, newL))

  const [nr, ng, nb] = hslToRgb(h, newS, newL)
  const hex = rgbToHex(nr, ng, nb)
  return parsed.a < 1 ? hex.replace('#', 'rgba(') + `,${parsed.a})` : hex
}
