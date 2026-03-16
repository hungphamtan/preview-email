import { describe, it, expect } from 'vitest'
import { extractDarkMediaRules, stripDarkMediaRules, filterColorOnlyRules, stripCspMetaTags } from './cssParser'

const htmlWithDarkMedia = `
<html><head>
<style>
  body { background: #fff; color: #000; }
  @media (prefers-color-scheme: dark) {
    body { background: #1a1a1a; color: #e5e5e5; }
    a { color: #6db3f2; }
  }
</style>
</head><body></body></html>
`

const htmlNoDarkMedia = `
<html><head>
<style>
  body { background: #fff; color: #000; }
</style>
</head><body></body></html>
`

const htmlMultipleDarkMedia = `
<html><head>
<style>
  @media (prefers-color-scheme: dark) { .btn { background: #333; } }
</style>
<style>
  @media (prefers-color-scheme: dark) { .header { color: #ccc; } }
</style>
</head><body></body></html>
`

describe('extractDarkMediaRules', () => {
  it('extracts inner rules from @media (prefers-color-scheme: dark)', () => {
    const result = extractDarkMediaRules(htmlWithDarkMedia)
    expect(result).toContain('background')
    // CSSOM normalises hex to rgb() — check for the RGB equivalent of #1a1a1a
    expect(result).toMatch(/rgb\(26,\s*26,\s*26\)|#1a1a1a/)
  })

  it('returns empty string when no dark media query present', () => {
    const result = extractDarkMediaRules(htmlNoDarkMedia)
    expect(result.trim()).toBe('')
  })

  it('extracts from multiple <style> blocks', () => {
    const result = extractDarkMediaRules(htmlMultipleDarkMedia)
    expect(result).toContain('.btn')
    expect(result).toContain('.header')
  })

  it('does NOT include the @media wrapper itself in output', () => {
    const result = extractDarkMediaRules(htmlWithDarkMedia)
    expect(result).not.toContain('@media')
  })
})

describe('stripDarkMediaRules', () => {
  it('removes @media (prefers-color-scheme: dark) blocks from HTML', () => {
    const result = stripDarkMediaRules(htmlWithDarkMedia)
    expect(result).not.toContain('prefers-color-scheme')
    expect(result).not.toContain('#1a1a1a')
  })

  it('preserves other CSS when stripping', () => {
    const result = stripDarkMediaRules(htmlWithDarkMedia)
    expect(result).toContain('body')
    expect(result).toContain('#fff')
  })

  it('returns HTML unchanged when no dark media present', () => {
    const result = stripDarkMediaRules(htmlNoDarkMedia)
    expect(result).toContain('#fff')
  })
})

describe('filterColorOnlyRules', () => {
  it('keeps color declarations', () => {
    const css = 'body { color: #fff; font-size: 16px; background-color: #000; }'
    const result = filterColorOnlyRules(css)
    expect(result).toContain('color')
    expect(result).toContain('background-color')
  })

  it('strips non-color declarations', () => {
    const css = 'body { color: #fff; font-size: 16px; padding: 10px; margin: 0; }'
    const result = filterColorOnlyRules(css)
    expect(result).not.toContain('font-size')
    expect(result).not.toContain('padding')
    expect(result).not.toContain('margin')
  })

  it('returns empty string for rule with only non-color props', () => {
    const css = 'body { padding: 10px; margin: 0; font-size: 16px; }'
    const result = filterColorOnlyRules(css)
    expect(result.trim()).toBe('')
  })
})

describe('stripCspMetaTags', () => {
  it('removes Content-Security-Policy meta tags from a Document', () => {
    const doc = new DOMParser().parseFromString(
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src self"></head></html>',
      'text/html'
    )
    expect(doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length).toBe(1)
    stripCspMetaTags(doc)
    expect(doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length).toBe(0)
  })

  it('leaves non-CSP meta tags untouched', () => {
    const doc = new DOMParser().parseFromString(
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head></html>',
      'text/html'
    )
    stripCspMetaTags(doc)
    expect(doc.querySelectorAll('meta').length).toBe(2)
  })
})
