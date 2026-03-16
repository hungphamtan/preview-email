import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
import { stripDarkMediaRules } from '../utils/cssParser'

// Yahoo Mail never transforms email content and ignores prefers-color-scheme.
// Strip dark media rules so the iframe browser doesn't activate them.
export const yahooMailSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    if (config.systemMode === 'light') return { html: rawHtml, injectedStyles: '' }
    const html = stripDarkMediaRules(rawHtml)
    const injectedStyles = 'html { color-scheme: light !important; }'
    return { html, injectedStyles }
  },
}
