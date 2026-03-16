import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
// Outlook Mac uses the same modern rendering engine as Apple Mail —
// full prefers-color-scheme support. Delegate to the same logic.
import { appleMailSimulator } from './appleMail'

export const outlookMacSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    return appleMailSimulator.transform(rawHtml, config)
  },
}
