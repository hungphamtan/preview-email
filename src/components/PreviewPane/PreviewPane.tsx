import { useMemo } from 'react'
import type { PreviewConfig } from '../../types'
import { SIMULATORS } from '../../simulators'
import { DeviceFrame } from '../DeviceFrame/DeviceFrame'
import styles from './PreviewPane.module.css'

interface Props {
  rawHtml: string
  config: PreviewConfig
}

function buildSrcdoc(html: string, injectedStyles: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  if (injectedStyles.trim()) {
    const styleEl = doc.createElement('style')
    styleEl.setAttribute('data-preview-injected', 'true')
    styleEl.textContent = injectedStyles
    doc.head.appendChild(styleEl)
  }

  return '<!DOCTYPE html>' + doc.documentElement.outerHTML
}

export function PreviewPane({ rawHtml, config }: Props) {
  const srcdoc = useMemo(() => {
    if (!rawHtml.trim()) return '<html><body></body></html>'
    const simulator = SIMULATORS[config.client]
    const result = simulator.transform(rawHtml, config)
    return buildSrcdoc(result.html, result.injectedStyles)
  }, [rawHtml, config])

  return (
    <div className={styles.container}>
      <DeviceFrame
        client={config.client}
        systemMode={config.systemMode}
        deviceMode={config.deviceMode}
      >
        <iframe
          srcDoc={srcdoc}
          sandbox="allow-same-origin"
          title={`Email preview — ${config.client}`}
          className={styles.iframe}
        />
      </DeviceFrame>
    </div>
  )
}
