import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'

// Gmail iOS: full colour inversion via CSS filter on the body.
// Images are counter-inverted so they appear normal.
export const gmailIosSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') {
      return { html: rawHtml, injectedStyles: '' }
    }

    const injectedStyles = `
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

    return { html: rawHtml, injectedStyles }
  },
}
