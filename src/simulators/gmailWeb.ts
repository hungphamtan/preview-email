import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'

// Gmail Web never transforms email content regardless of system mode.
// High predictability — renders exactly as authored.
export const gmailWebSimulator: Simulator = {
  transform(rawHtml: string, _config: PreviewConfig): SimulatorResult {
    return { html: rawHtml, injectedStyles: '' }
  },
}
