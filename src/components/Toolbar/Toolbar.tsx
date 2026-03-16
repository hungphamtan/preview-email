import type { EmailClient, SystemMode, DeviceMode, PreviewConfig } from '../../types'
import { CLIENT_META } from '../../types'
import styles from './Toolbar.module.css'

interface Props {
  config: PreviewConfig
  onChange: (config: PreviewConfig) => void
}

const DESKTOP_CLIENTS: EmailClient[] = [
  'gmail-web', 'outlook-desktop', 'outlook-com', 'apple-mail', 'outlook-mac', 'yahoo-mail',
]
const MOBILE_CLIENTS: EmailClient[] = [
  'gmail-ios', 'gmail-android', 'outlook-mobile',
]

const CLIENT_LABELS: Record<EmailClient, string> = Object.fromEntries(
  CLIENT_META.map(c => [c.id, c.label])
) as Record<EmailClient, string>

export function Toolbar({ config, onChange }: Props) {
  const visibleClients = config.deviceMode === 'desktop' ? DESKTOP_CLIENTS : MOBILE_CLIENTS

  function setClient(client: EmailClient) {
    onChange({ ...config, client })
  }

  function setMode(systemMode: SystemMode) {
    onChange({ ...config, systemMode })
  }

  function setDevice(deviceMode: DeviceMode) {
    const clients = deviceMode === 'desktop' ? DESKTOP_CLIENTS : MOBILE_CLIENTS
    const client = clients.includes(config.client) ? config.client : clients[0]
    onChange({ ...config, deviceMode, client })
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Preview controls">

      {/* Client selector — filtered by device mode */}
      <div className={styles.clientGroup} role="group" aria-label="Email client">
        {visibleClients.map(id => (
          <button
            key={id}
            className={`${styles.clientBtn} ${config.client === id ? styles.active : ''}`}
            onClick={() => setClient(id)}
            aria-pressed={config.client === id}
          >
            {CLIENT_LABELS[id]}
          </button>
        ))}
      </div>

      <div className={styles.spacer} />

      {/* Device toggle */}
      <div className={styles.controlGroup} role="group" aria-label="Device mode">
        <button
          className={`${styles.controlBtn} ${config.deviceMode === 'desktop' ? styles.active : ''}`}
          onClick={() => setDevice('desktop')}
          aria-pressed={config.deviceMode === 'desktop'}
        >
          Desktop
        </button>
        <button
          className={`${styles.controlBtn} ${config.deviceMode === 'mobile' ? styles.active : ''}`}
          onClick={() => setDevice('mobile')}
          aria-pressed={config.deviceMode === 'mobile'}
        >
          Mobile
        </button>
      </div>

      <div className={styles.divider} />

      {/* System mode toggle */}
      <div className={styles.controlGroup} role="group" aria-label="System mode">
        <button
          className={`${styles.controlBtn} ${config.systemMode === 'light' ? styles.active : ''}`}
          onClick={() => setMode('light')}
          aria-pressed={config.systemMode === 'light'}
        >
          Light
        </button>
        <button
          className={`${styles.controlBtn} ${config.systemMode === 'dark' ? styles.active : ''}`}
          onClick={() => setMode('dark')}
          aria-pressed={config.systemMode === 'dark'}
        >
          Dark
        </button>
      </div>

    </div>
  )
}
