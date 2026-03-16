import type { EmailClient, SystemMode, DeviceMode, PreviewConfig } from '../../types'
import { CLIENT_META, CLIENT_DEFAULT_DEVICE } from '../../types'
import styles from './Toolbar.module.css'

interface Props {
  config: PreviewConfig
  onChange: (config: PreviewConfig) => void
}

const CLIENT_ICONS: Record<EmailClient, string> = {
  'gmail-web':       '🌐',
  'gmail-ios':       '📱',
  'gmail-android':   '🤖',
  'outlook-desktop': '🖥️',
  'outlook-com':     '🌐',
  'outlook-mobile':  '📱',
  'apple-mail':      '✉️',
  'outlook-mac':     '💻',
  'yahoo-mail':      '🌐',
}

export function Toolbar({ config, onChange }: Props) {
  function setClient(client: EmailClient) {
    onChange({
      ...config,
      client,
      deviceMode: CLIENT_DEFAULT_DEVICE[client],
    })
  }

  function setMode(systemMode: SystemMode) {
    onChange({ ...config, systemMode })
  }

  function setDevice(deviceMode: DeviceMode) {
    onChange({ ...config, deviceMode })
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Preview controls">

      {/* Client selector */}
      <div className={styles.clientGroup} role="group" aria-label="Email client">
        {CLIENT_META.map(client => (
          <button
            key={client.id}
            className={`${styles.clientBtn} ${config.client === client.id ? styles.active : ''}`}
            onClick={() => setClient(client.id)}
            aria-pressed={config.client === client.id}
            title={client.label}
          >
            <span className={styles.clientIcon}>{CLIENT_ICONS[client.id]}</span>
            <span>{client.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      {/* System mode toggle */}
      <div className={styles.modeToggle} role="group" aria-label="System mode">
        <button
          className={`${styles.modeBtn} ${config.systemMode === 'light' ? styles.active : ''}`}
          onClick={() => setMode('light')}
          aria-pressed={config.systemMode === 'light'}
        >
          ☀️ Light
        </button>
        <button
          className={`${styles.modeBtn} ${config.systemMode === 'dark' ? styles.active : ''}`}
          onClick={() => setMode('dark')}
          aria-pressed={config.systemMode === 'dark'}
        >
          🌙 Dark
        </button>
      </div>

      <div className={styles.divider} />

      {/* Device toggle */}
      <div className={styles.deviceToggle} role="group" aria-label="Device mode">
        <button
          className={`${styles.deviceBtn} ${config.deviceMode === 'desktop' ? styles.active : ''}`}
          onClick={() => setDevice('desktop')}
          aria-pressed={config.deviceMode === 'desktop'}
        >
          🖥️ Desktop
        </button>
        <button
          className={`${styles.deviceBtn} ${config.deviceMode === 'mobile' ? styles.active : ''}`}
          onClick={() => setDevice('mobile')}
          aria-pressed={config.deviceMode === 'mobile'}
        >
          📱 Mobile
        </button>
      </div>

    </div>
  )
}
