import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForGmailAndroid, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isTextProp } from '../utils/htmlTransform'
import { stripCspMetaTags, stripDarkMediaRules } from '../utils/cssParser'

// Gmail Android: partial/smart inversion — lighter than iOS full inversion.
// Remaps light backgrounds and dark text; images are NOT inverted.
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
    // behind images) and lightens dark text.  Images themselves are untouched,
    // but their container backgrounds ARE transformed — dark logos on transparent
    // PNGs become invisible, matching real Gmail Android behaviour.
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
