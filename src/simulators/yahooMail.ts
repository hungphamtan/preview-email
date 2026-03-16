import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'

// Yahoo Mail never transforms email content — same behaviour as Gmail Web.
export const yahooMailSimulator: Simulator = {
  transform(rawHtml: string, _config: PreviewConfig): SimulatorResult {
    return { html: rawHtml, injectedStyles: '' }
  },
}
