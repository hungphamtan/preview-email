import { useState } from 'react'
import { PreviewPane } from './components/PreviewPane/PreviewPane'
import { sampleEmail } from './assets/sampleEmail'
import type { PreviewConfig } from './types'

const defaultConfig: PreviewConfig = {
  client: 'gmail-ios',
  systemMode: 'dark',
  deviceMode: 'mobile',
}

function App() {
  const [config] = useState<PreviewConfig>(defaultConfig)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#18181b' }}>
      <PreviewPane rawHtml={sampleEmail} config={config} />
    </div>
  )
}

export default App
