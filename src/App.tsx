import { useState } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#18181b' }}>
      <Toolbar config={config} onChange={setConfig} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PreviewPane rawHtml={sampleEmail} config={config} />
      </div>
    </div>
  )
}

export default App
