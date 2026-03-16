import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { extractDarkMediaRules, stripCspMetaTags } from '../utils/cssParser'
import { parseHtmlToDom, serializeDom } from '../utils/htmlTransform'

// Apple Mail: full developer control via prefers-color-scheme + color-scheme meta.
// In dark mode: extract @media (prefers-color-scheme: dark) rules and inject them
// unconditionally. Respect <meta name="color-scheme"> for UA dark background.
export const appleMailSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const darkCss = extractDarkMediaRules(rawHtml)

    const doc = parseHtmlToDom(rawHtml)
    stripCspMetaTags(doc)

    const colorSchemeMeta = doc.querySelector('meta[name="color-scheme"]')
    const supportsColorScheme =
      colorSchemeMeta?.getAttribute('content')?.toLowerCase().includes('dark') ?? false

    if (supportsColorScheme) {
      doc.documentElement.style.colorScheme = 'dark'
    }

    const injectedStyles = [
      darkCss,
      supportsColorScheme
        ? 'html { color-scheme: dark; background-color: canvas; }'
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    return { html: serializeDom(doc), injectedStyles }
  },
}
