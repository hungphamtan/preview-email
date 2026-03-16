import { useState, useMemo } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Editor } from './components/Editor/Editor'
import { PreviewPane } from './components/PreviewPane/PreviewPane'
import { sampleEmail } from './assets/sampleEmail'
import type { PreviewConfig } from './types'

const defaultConfig: PreviewConfig = {
  client: 'gmail-web',
  systemMode: 'light',
  deviceMode: 'desktop',
}

function App() {
  const [config, setConfig] = useState<PreviewConfig>(defaultConfig)
  const [rawHtml, setRawHtml] = useState<string>(sampleEmail)

  // Debounce rawHtml by 300ms for large emails
  const [debouncedHtml, setDebouncedHtml] = useState<string>(sampleEmail)
  const debounceRef = useMemo(() => ({ timer: 0 }), [])

  function handleHtmlChange(value: string) {
    setRawHtml(value)
    clearTimeout(debounceRef.timer)
    debounceRef.timer = window.setTimeout(() => setDebouncedHtml(value), 300)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: '#18181b',
      overflow: 'hidden',
    }}>
      <Toolbar config={config} onChange={setConfig} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: '40%', minWidth: 280, maxWidth: 560, overflow: 'hidden' }}>
          <Editor value={rawHtml} onChange={handleHtmlChange} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PreviewPane rawHtml={debouncedHtml} config={config} />
        </div>
      </div>
    </div>
  )
}

export default App
