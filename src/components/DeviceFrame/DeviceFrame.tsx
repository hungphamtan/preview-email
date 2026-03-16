import type { ReactNode } from 'react'
import type { EmailClient, SystemMode, DeviceMode } from '../../types'
import styles from './DeviceFrame.module.css'

interface Props {
  client: EmailClient
  systemMode: SystemMode
  deviceMode: DeviceMode
  children: ReactNode
}

function getThemeClass(client: EmailClient, systemMode: SystemMode): string {
  const mode = systemMode === 'dark' ? 'dark' : 'light'
  if (client === 'gmail-web' || client === 'gmail-ios' || client === 'gmail-android') {
    return styles[`theme-gmail-${mode}`]
  }
  if (client === 'outlook-desktop' || client === 'outlook-com' || client === 'outlook-mobile' || client === 'outlook-mac') {
    return styles[`theme-outlook-${mode}`]
  }
  if (client === 'apple-mail') {
    return styles[`theme-apple-${mode}`]
  }
  if (client === 'yahoo-mail') {
    return styles[`theme-yahoo-${mode}`]
  }
  return styles[`theme-gmail-${mode}`]
}

function getClientLabel(client: EmailClient): string {
  const labels: Record<EmailClient, string> = {
    'gmail-web': 'Gmail',
    'gmail-ios': 'Gmail',
    'gmail-android': 'Gmail',
    'outlook-desktop': 'Outlook',
    'outlook-com': 'Outlook',
    'outlook-mobile': 'Outlook',
    'apple-mail': 'Mail',
    'outlook-mac': 'Outlook',
    'yahoo-mail': 'Yahoo Mail',
  }
  return labels[client]
}

export function DeviceFrame({ client, systemMode, deviceMode, children }: Props) {
  const themeClass = getThemeClass(client, systemMode)

  if (deviceMode === 'mobile') {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.mobile} ${themeClass}`} data-testid="device-frame-mobile">
          <div className={styles.mobileNotch}>
            <div className={styles.mobilePill} />
          </div>
          <div className={styles.mobileStatusBar}>
            <span className={styles.mobileTime}>9:41</span>
            <div className={styles.mobileIcons}>
              <div className={styles.mobileIcon} />
              <div className={styles.mobileIcon} />
              <div className={styles.mobileIcon} />
            </div>
          </div>
          <div className={styles.mobileEmailChrome}>
            <div className={styles.mobileFromLine}>Acme &lt;hello@acme.com&gt;</div>
            <div className={styles.mobileSubjectLine}>Welcome to Acme!</div>
          </div>
          <div className={styles.mobileContent}>
            {children}
          </div>
          <div className={styles.mobileHomeBar}>
            <div className={styles.homeBarPill} />
          </div>
        </div>
      </div>
    )
  }

  // Desktop frame
  return (
    <div className={`${styles.wrapper} ${styles.wrapperDesktop}`}>
      <div className={`${styles.desktop} ${themeClass}`} data-testid="device-frame-desktop">
        <div className={styles.desktopTitleBar}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.desktopAddressBar} />
        </div>
        <div className={styles.desktopToolbar}>
          <div className={styles.toolbarBtn} style={{ width: 48 }} />
          <div className={styles.toolbarBtn} style={{ width: 80 }} />
          <div className={styles.toolbarBtn} style={{ width: 64 }} />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, opacity: 0.6, lineHeight: '20px', color: 'var(--frame-toolbar-text)' }}>
            {getClientLabel(client)}
          </div>
        </div>
        <div className={styles.desktopContent}>
          {children}
        </div>
      </div>
    </div>
  )
}
