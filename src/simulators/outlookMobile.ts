import type { Simulator } from './types'
import type { PreviewConfig, SimulatorResult } from '../types'
// Outlook Mobile (iOS + Android) uses a modern rendering engine — NOT the Word
// engine used by Outlook Desktop. It fully respects prefers-color-scheme.
import { appleMailSimulator } from './appleMail'

export const outlookMobileSimulator: Simulator = {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult {
    return appleMailSimulator.transform(rawHtml, config)
  },
}
