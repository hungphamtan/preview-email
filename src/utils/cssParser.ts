/**
 * Extract the inner CSS rules from all @media (prefers-color-scheme: dark) blocks
 * in the <style> tags of an HTML string. Uses CSSOM where possible, with a
 * regex fallback for SecurityError cases.
 */
export function extractDarkMediaRules(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const styleEls = Array.from(doc.querySelectorAll('style'))
  const extracted: string[] = []

  for (const styleEl of styleEls) {
    const css = styleEl.textContent ?? ''
    if (!css.includes('prefers-color-scheme')) continue

    // Try CSSOM first
    const clone = document.createElement('style')
    clone.textContent = css
    document.head.appendChild(clone)

    try {
      const sheet = clone.sheet as CSSStyleSheet
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule) {
          const condition = rule.conditionText || rule.media.mediaText
          if (
            condition.includes('prefers-color-scheme') &&
            condition.includes('dark')
          ) {
            for (const inner of Array.from(rule.cssRules)) {
              extracted.push(inner.cssText)
            }
          }
        }
      }
    } catch {
      // CSSOM unavailable — fall back to regex
      extracted.push(extractDarkRulesRegex(css))
    } finally {
      document.head.removeChild(clone)
    }
  }

  return extracted.join('\n')
}

/**
 * Regex fallback: extract inner CSS from @media (prefers-color-scheme: dark) blocks.
 * Handles single-level nesting using a brace counter.
 */
function extractDarkRulesRegex(css: string): string {
  const result: string[] = []
  const mediaRegex = /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/gi
  let match: RegExpExecArray | null

  while ((match = mediaRegex.exec(css)) !== null) {
    const start = match.index + match[0].length
    let depth = 1
    let i = start
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    result.push(css.slice(start, i - 1).trim())
  }

  return result.join('\n')
}

/**
 * Strip all @media (prefers-color-scheme: dark) { ... } blocks from the
 * <style> tags in an HTML string. Returns the modified HTML.
 */
export function stripDarkMediaRules(html: string): string {
  return html.replace(
    /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/gi,
    ''
  )
}

/**
 * From a CSS string, keep only declarations that affect color/background.
 * Used by Outlook.com to simulate its partial @media dark support.
 */
export function filterColorOnlyRules(css: string): string {
  const COLOR_PROPS = new Set([
    'color', 'background-color', 'background',
    'border-color', 'border-top-color', 'border-bottom-color',
    'border-left-color', 'border-right-color', 'outline-color',
  ])

  // Match rule blocks: selector { ... }
  return css.replace(/([^{]+)\{([^}]*)\}/g, (_, selector, declarations) => {
    const filtered = declarations
      .split(';')
      .map((d: string) => d.trim())
      .filter((d: string) => {
        if (!d) return false
        const prop = d.split(':')[0].trim().toLowerCase()
        return COLOR_PROPS.has(prop)
      })
      .join(';\n  ')

    return filtered ? `${selector.trim()} {\n  ${filtered};\n}` : ''
  })
}

/**
 * Remove <meta http-equiv="Content-Security-Policy"> tags from a Document
 * in place — prevents injected styles from being blocked inside the iframe.
 */
export function stripCspMetaTags(doc: Document): void {
  doc.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(el => el.remove())
}
