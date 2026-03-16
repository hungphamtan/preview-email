import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForOutlook, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isTextProp } from '../utils/htmlTransform'
import { extractDarkMediaRules, filterColorOnlyRules, stripCspMetaTags } from '../utils/cssParser'

// Outlook.com / New Outlook: partial inversion + limited @media dark support.
// Same inline color transforms as Outlook Desktop, but also injects
// filtered dark media query rules (color-only declarations).
export const outlookComSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const doc = parseHtmlToDom(rawHtml)
    stripCspMetaTags(doc)

    // Step 1: Transform inline styles
    transformInlineStyles(doc, (prop, value) => {
      if (isBackgroundProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return value.replace(colorPart, transformColorForOutlook(colorPart, 'background'))
        }
      }
      if (isTextProp(prop)) {
        const colorPart = parseColorValue(value)
        if (colorPart) {
          return transformColorForOutlook(colorPart, 'text')
        }
      }
      return value
    })

    // Step 2: Transform HTML attribute colors
    transformAttributeColors(doc, v => transformColorForOutlook(v, 'background'))

    // Step 3: Extract + filter dark media CSS (partial prefers-color-scheme support)
    const darkCss = extractDarkMediaRules(rawHtml)
    const filteredDarkCss = filterColorOnlyRules(darkCss)

    const injectedStyles = [
      `html, body { background-color: #1c1c1c !important; color: #cccccc !important; }`,
      filteredDarkCss,
    ]
      .filter(Boolean)
      .join('\n')

    return { html: serializeDom(doc), injectedStyles }
  },
}
