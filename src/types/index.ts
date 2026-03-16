export type EmailClient =
  | 'gmail-web'
  | 'gmail-ios'
  | 'gmail-android'
  | 'outlook-desktop'
  | 'outlook-com'
  | 'outlook-mobile'
  | 'apple-mail'
  | 'outlook-mac'
  | 'yahoo-mail'

export type SystemMode = 'light' | 'dark'
export type DeviceMode = 'desktop' | 'mobile'

export interface PreviewConfig {
  client: EmailClient
  systemMode: SystemMode
  deviceMode: DeviceMode
}

export interface SimulatorResult {
  /** Full transformed HTML string to inject into iframe srcdoc */
  html: string
  /** Extra CSS injected as the last <style> in <head> — wins specificity */
  injectedStyles: string
}

export interface ClientMeta {
  id: EmailClient
  label: string
  platform: 'web' | 'ios' | 'android' | 'desktop' | 'macos'
  defaultDevice: DeviceMode
}

export const CLIENT_META: ClientMeta[] = [
  { id: 'gmail-web',        label: 'Gmail Web',       platform: 'web',     defaultDevice: 'desktop' },
  { id: 'gmail-ios',        label: 'Gmail iOS',        platform: 'ios',     defaultDevice: 'mobile'  },
  { id: 'gmail-android',    label: 'Gmail Android',    platform: 'android', defaultDevice: 'mobile'  },
  { id: 'outlook-desktop',  label: 'Outlook Desktop',  platform: 'desktop', defaultDevice: 'desktop' },
  { id: 'outlook-com',      label: 'Outlook.com',      platform: 'web',     defaultDevice: 'desktop' },
  { id: 'outlook-mobile',   label: 'Outlook Mobile',   platform: 'ios',     defaultDevice: 'mobile'  },
  { id: 'apple-mail',       label: 'Apple Mail',       platform: 'macos',   defaultDevice: 'desktop' },
  { id: 'outlook-mac',      label: 'Outlook Mac',      platform: 'macos',   defaultDevice: 'desktop' },
  { id: 'yahoo-mail',       label: 'Yahoo Mail',       platform: 'web',     defaultDevice: 'desktop' },
]

export const CLIENT_DEFAULT_DEVICE: Record<EmailClient, DeviceMode> = Object.fromEntries(
  CLIENT_META.map(c => [c.id, c.defaultDevice])
) as Record<EmailClient, DeviceMode>
