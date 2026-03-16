import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForGmailAndroid, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isTextProp } from '../utils/htmlTransform'
import { stripCspMetaTags } from '../utils/cssParser'

// Gmail Android: partial/smart inversion — lighter than iOS full inversion.
// Remaps light backgrounds and dark text; images are NOT inverted.
export const gmailAndroidSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const doc = parseHtmlToDom(rawHtml)
    stripCspMetaTags(doc)

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

    const injectedStyles = `
html, body {
  background-color: #1c1c1e !important;
  color: #e5e5ea !important;
}`.trim()

    return { html: serializeDom(doc), injectedStyles }
  },
}
