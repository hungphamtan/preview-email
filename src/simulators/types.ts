import type { PreviewConfig, SimulatorResult } from '../types'

export interface Simulator {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult
}
