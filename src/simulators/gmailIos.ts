import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForGmailIos, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isBorderProp, isTextProp } from '../utils/htmlTransform'
import { stripCspMetaTags, stripDarkMediaRules } from '../utils/cssParser'

// Gmail iOS: selective colour remapping producing lighter dark surfaces
// with a subtle cool blue tint, matching real Gmail iOS dark mode.
// Gmail iOS ignores prefers-color-scheme — strip dark media rules.
export const gmailIosSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const strippedHtml = stripDarkMediaRules(rawHtml)
    const doc = parseHtmlToDom(strippedHtml)
    stripCspMetaTags(doc)

    transformInlineStyles(doc, (prop, value, el) => {
      if (isBackgroundProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          // Thin divider elements (height ≤ 2px) should be treated as borders
          const style = el?.getAttribute('style') || ''
          const hMatch = style.match(/height:\s*(\d+)px/)
          const wMatch = style.match(/width:\s*(\d+)px/)
          const isDivider = (hMatch && parseInt(hMatch[1]) <= 2) || (wMatch && parseInt(wMatch[1]) <= 2)
          const role = isDivider ? 'border' as const : 'background' as const
          return value.replace(colorPart, transformColorForGmailIos(colorPart, role))
        }
      }
      if (isBorderProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return value.replace(colorPart, transformColorForGmailIos(colorPart, 'border'))
        }
      }
      if (isTextProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return transformColorForGmailIos(colorPart, 'text')
        }
      }
      return value
    })

    transformAttributeColors(doc, v => transformColorForGmailIos(v, 'background'))

    // Image handling — same heuristics as Android:
    // small icons get full inversion, logos blend naturally, photos untouched
    doc.querySelectorAll('img').forEach(img => {
      const w = parseInt(img.getAttribute('width') || '0', 10)
      const h = parseInt(img.getAttribute('height') || '0', 10)
      const src = (img.getAttribute('src') || '').toLowerCase()

      const isLikelyPhoto = /\.jpe?g(\?|$)/.test(src)
      const isLarge = w > 200 && h > 200

      if (isLikelyPhoto || isLarge) return

      const existing = img.getAttribute('style') || ''
      const maxDim = Math.max(w, h)

      // Gmail iOS does not bitmap-invert small icons — leave them as-is.
      // Logos with white bg use blend mode for natural appearance.
      const effect = 'mix-blend-mode: normal'

      img.setAttribute('style', existing ? `${existing}; ${effect}` : effect)
    })

    const injectedStyles = `
html {
  color-scheme: light !important;
}
html, body {
  background-color: #313439 !important;
  color: #e5e5ea !important;
}`.trim()

    return { html: serializeDom(doc), injectedStyles }
  },
}
