import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { stripDarkMediaRules } from '../utils/cssParser'

// Gmail iOS: full colour inversion via CSS filter on the body.
// Images are counter-inverted so they appear normal.
// Gmail iOS ignores prefers-color-scheme — strip dark media rules so the
// browser doesn't activate them before the CSS filter is applied.
export const gmailIosSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const html = stripDarkMediaRules(rawHtml)

    const injectedStyles = `
/* Prevent browser auto-dark-mode from transforming CSS colours before the filter */
html { color-scheme: light !important; }
/* Gmail iOS dark mode: full inversion on body */
body, [data-ogsc] {
  filter: invert(1) hue-rotate(180deg) !important;
}
/* Re-invert images so they appear correct */
img, [data-ogsc] img {
  filter: invert(1) hue-rotate(180deg) !important;
}
/* Re-invert background images on table cells */
td[background], th[background] {
  filter: invert(1) hue-rotate(180deg) !important;
}`.trim()

    return { html, injectedStyles }
  },
}
