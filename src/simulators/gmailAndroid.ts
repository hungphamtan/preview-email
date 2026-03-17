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

    // Android Force Dark handles images differently based on size/type:
    // - Small square icons (≤50px): bitmap-inverted (app icons with dark bg)
    // - Larger small images (logos with white bg): blended via mix-blend-mode
    //   so the white background merges with the dark container
    // - Photos (.jpg) and large images: left untouched
    doc.querySelectorAll('img').forEach(img => {
      const w = parseInt(img.getAttribute('width') || '0', 10)
      const h = parseInt(img.getAttribute('height') || '0', 10)
      const src = (img.getAttribute('src') || '').toLowerCase()

      const isLikelyPhoto = /\.jpe?g(\?|$)/.test(src)
      const isLarge = w > 200 && h > 200

      if (isLikelyPhoto || isLarge) return

      const existing = img.getAttribute('style') || ''
      const maxDim = Math.max(w, h)

      // Small square-ish icons (app icons): full inversion
      // Larger logos/banners with white bg: multiply blend to darken white bg
      const isDarkBgIcon = maxDim > 0 && maxDim <= 50
      const effect = isDarkBgIcon
        ? 'filter: invert(1) hue-rotate(180deg)'
        : 'mix-blend-mode: normal'

      img.setAttribute('style', existing ? `${existing}; ${effect}` : effect)
    })

    // color-scheme: light prevents the browser from applying its own auto-dark-mode
    // to CSS <style> block colours (e.g. link colours) — Gmail Android ignores
    // prefers-color-scheme entirely, so the iframe must also render in light mode context.
    const injectedStyles = `
html {
  color-scheme: light !important;
}
html, body {
  background-color: #121212 !important;
  color: #e5e5ea !important;
}`.trim()

    return { html: serializeDom(doc), injectedStyles }
  },
}
