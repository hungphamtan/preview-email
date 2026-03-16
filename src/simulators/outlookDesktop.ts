import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { transformColorForOutlook, parseColorValue } from '../utils/colorTransform'
import { parseHtmlToDom, serializeDom, transformInlineStyles, transformAttributeColors, isBackgroundProp, isTextProp } from '../utils/htmlTransform'
import { stripCspMetaTags } from '../utils/cssParser'

// Outlook Desktop (Word engine): full auto-inversion with !important overrides.
// Also rewrites colors in embedded <style> blocks.
// Strips @media (prefers-color-scheme: dark) entirely — Outlook ignores it.
export const outlookDesktopSimulator: Simulator = {
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

    // Step 3: Transform colors inside embedded <style> blocks
    doc.querySelectorAll('style').forEach(styleEl => {
      let css = styleEl.textContent ?? ''
      // Strip dark media query blocks — Outlook ignores them
      css = css.replace(
        /@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/gi,
        ''
      )
      // Replace hex and rgb color values for background/color properties
      css = css.replace(
        /(background(?:-color)?|border(?:-\w+)?|color)\s*:\s*([^;}"']+)/gi,
        (match, prop, value) => {
          const colorPart = parseColorValue(value.trim())
          if (!colorPart) return match
          const propLower = prop.toLowerCase().trim()
          const transformed =
            propLower === 'color'
              ? transformColorForOutlook(colorPart, 'text')
              : transformColorForOutlook(colorPart, 'background')
          return `${prop}: ${value.replace(colorPart, transformed)}`
        }
      )
      styleEl.textContent = css
    })

    const injectedStyles = `
html, body {
  background-color: #1a1a1a !important;
  color: #d4d4d4 !important;
}`.trim()

    return { html: serializeDom(doc), injectedStyles }
  },
}
