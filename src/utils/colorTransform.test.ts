import { describe, it, expect } from 'vitest'
import { transformColorForOutlook, transformColorForGmailAndroid, parseColorValue } from './colorTransform'

// Helper: parse hex → HSL lightness
function hexL(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2
}

describe('transformColorForOutlook — background', () => {
  it('maps white (#ffffff) to a dark color (L < 0.20)', () => {
    const result = transformColorForOutlook('#ffffff', 'background')
    expect(hexL(result)).toBeLessThan(0.20)
  })

  it('maps near-white (#f5f5f5) to dark (L < 0.20)', () => {
    const result = transformColorForOutlook('#f5f5f5', 'background')
    expect(hexL(result)).toBeLessThan(0.20)
  })

  it('maps mid-tone (#888888) to darker', () => {
    const before = hexL('#888888')
    const result = transformColorForOutlook('#888888', 'background')
    expect(hexL(result)).toBeLessThan(before)
  })

  it('leaves dark background (#1a1a1a) unchanged', () => {
    expect(transformColorForOutlook('#1a1a1a', 'background')).toBe('#1a1a1a')
  })

  it('maps named color "white" to a dark hex', () => {
    const result = transformColorForOutlook('white', 'background')
    expect(result).toMatch(/^#/)
    expect(hexL(result)).toBeLessThan(0.20)
  })
})

describe('transformColorForOutlook — text', () => {
  it('maps black (#000000) to a light color (L > 0.70)', () => {
    const result = transformColorForOutlook('#000000', 'text')
    expect(hexL(result)).toBeGreaterThan(0.70)
  })

  it('maps dark text (#222222) to light (L > 0.70)', () => {
    const result = transformColorForOutlook('#222222', 'text')
    expect(hexL(result)).toBeGreaterThan(0.70)
  })

  it('leaves light text (#eeeeee) unchanged', () => {
    expect(transformColorForOutlook('#eeeeee', 'text')).toBe('#eeeeee')
  })

  it('maps named color "black" to a light hex', () => {
    const result = transformColorForOutlook('black', 'text')
    expect(result).toMatch(/^#/)
    expect(hexL(result)).toBeGreaterThan(0.70)
  })
})

describe('transformColorForOutlook — pass-throughs', () => {
  it('passes through "transparent"', () => {
    expect(transformColorForOutlook('transparent', 'background')).toBe('transparent')
  })
  it('passes through "inherit"', () => {
    expect(transformColorForOutlook('inherit', 'text')).toBe('inherit')
  })
  it('passes through "currentColor"', () => {
    expect(transformColorForOutlook('currentColor', 'text')).toBe('currentColor')
  })
  it('returns original for unknown value', () => {
    expect(transformColorForOutlook('notacolor', 'background')).toBe('notacolor')
  })
})

describe('transformColorForGmailAndroid — background', () => {
  it('maps white (#ffffff) to dark (L < 0.20)', () => {
    const result = transformColorForGmailAndroid('#ffffff', 'background')
    expect(hexL(result)).toBeLessThan(0.20)
  })

  it('maps near-white (#fafafa) to dark', () => {
    const result = transformColorForGmailAndroid('#fafafa', 'background')
    expect(hexL(result)).toBeLessThan(0.20)
  })

  it('leaves dark background (#1c1c1e) unchanged', () => {
    expect(transformColorForGmailAndroid('#1c1c1e', 'background')).toBe('#1c1c1e')
  })
})

describe('transformColorForGmailAndroid — text', () => {
  it('maps black (#000000) to very light (L > 0.80)', () => {
    const result = transformColorForGmailAndroid('#000000', 'text')
    expect(hexL(result)).toBeGreaterThan(0.80)
  })

  it('leaves light text (#e5e5ea) unchanged', () => {
    expect(transformColorForGmailAndroid('#e5e5ea', 'text')).toBe('#e5e5ea')
  })
})

describe('parseColorValue', () => {
  it('extracts hex from background shorthand', () => {
    expect(parseColorValue('#fff url(img.png) no-repeat')).toBe('#fff')
  })
  it('returns whole value when it is a plain hex', () => {
    expect(parseColorValue('#ff0000')).toBe('#ff0000')
  })
  it('returns whole value for rgb()', () => {
    expect(parseColorValue('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)')
  })
  it('returns null for unrecognised strings', () => {
    expect(parseColorValue('url(image.png)')).toBeNull()
  })
})
