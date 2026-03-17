import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForGmailAndroid, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isTextProp } from '../utils/htmlTransform'
import { stripCspMetaTags, stripDarkMediaRules } from '../utils/cssParser'

// Gmail Android: partial/smart inversion — lighter than iOS full inversion.
// Remaps light backgrounds and dark text; small/icon images are bitmap-inverted.
export const gmailAndroidSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    // Gmail Android ignores prefers-color-scheme entirely — strip dark media
    // rules so the browser iframe doesn't activate them and override transforms
    const strippedHtml = stripDarkMediaRules(rawHtml)
    const doc = parseHtmlToDom(strippedHtml)
    stripCspMetaTags(doc)

    // Gmail Android partial inversion: darkens ALL light backgrounds (including
    // behind images) and lightens dark text.  Small/icon images are bitmap-
    // inverted (matching Android Force Dark on WebView), but photos and large
    // images are left untouched.
    transformInlineStyles(doc, (prop, value) => {
      if (isBackgroundProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return value.replace(colorPart, transformColorForGmailAndroid(colorPart, 'background'))
        }
      }
      if (isTextProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return transformColorForGmailAndroid(colorPart, 'text')
        }
      }
      return value
    })

    transformAttributeColors(doc, v => transformColorForGmailAndroid(v, 'background'))

    // Android Force Dark bitmap-inverts small/icon-like images (logos, icons)
    // but preserves photos and large complex images.  The visual effect is
    // equivalent to CSS `filter: invert(1) hue-rotate(180deg)`.
    doc.querySelectorAll('img').forEach(img => {
      const w = parseInt(img.getAttribute('width') || '0', 10)
      const h = parseInt(img.getAttribute('height') || '0', 10)
      const src = (img.getAttribute('src') || '').toLowerCase()

      const isLikelyPhoto = /\.jpe?g(\?|$)/.test(src)
      const isLarge = w > 200 && h > 200

      if (!isLikelyPhoto && !isLarge) {
        const existing = img.getAttribute('style') || ''
        const filter = 'filter: invert(1) hue-rotate(180deg)'
        img.setAttribute('style', existing ? `${existing}; ${filter}` : filter)
      }
    })

    // color-scheme: light prevents the browser from applying its own auto-dark-mode
    // to CSS <style> block colours (e.g. link colours) — Gmail Android ignores
    // prefers-color-scheme entirely, so the iframe must also render in light mode context.
    const injectedStyles = `
html {
  color-scheme: light !important;
}
html, body {
  background-color: #1c1c1e !important;
  color: #e5e5ea !important;
}`.trim()

    return { html: serializeDom(doc), injectedStyles }
  },
}
