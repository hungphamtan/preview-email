import { useState, useMemo } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Editor } from './components/Editor/Editor'
import { PreviewPane } from './components/PreviewPane/PreviewPane'
import { sampleEmail } from './assets/sampleEmail'
import type { PreviewConfig } from './types'
import styles from './App.module.css'

const defaultConfig: PreviewConfig = {
  client: 'gmail-web',
  systemMode: 'light',
  deviceMode: 'desktop',
}

function App() {
  const [config, setConfig] = useState<PreviewConfig>(defaultConfig)
  const [rawHtml, setRawHtml] = useState<string>(sampleEmail)
  const [debouncedHtml, setDebouncedHtml] = useState<string>(sampleEmail)
  const [editorOpen, setEditorOpen] = useState<boolean>(true)

  const debounceRef = useMemo(() => ({ timer: 0 }), [])

  function handleHtmlChange(value: string) {
    setRawHtml(value)
    clearTimeout(debounceRef.timer)
    debounceRef.timer = window.setTimeout(() => setDebouncedHtml(value), 300)
  }

  return (
    <div className={styles.app}>
      <Toolbar config={config} onChange={setConfig} />
      <div className={styles.bodyRelative}>

        {/* Editor panel */}
        <div className={`${styles.editorPanel} ${editorOpen ? '' : styles.collapsed}`}>
          <Editor value={rawHtml} onChange={handleHtmlChange} />
        </div>

        {/* Collapse/expand toggle */}
        <button
          className={styles.toggleBtn}
          onClick={() => setEditorOpen(o => !o)}
          aria-label={editorOpen ? 'Collapse editor' : 'Expand editor'}
          title={editorOpen ? 'Collapse editor' : 'Expand editor'}
        >
          {editorOpen ? '◀' : '▶'}
        </button>

        {/* Preview panel */}
        <div className={styles.previewPanel}>
          <PreviewPane rawHtml={debouncedHtml} config={config} />
        </div>

      </div>
    </div>
  )
}

export default App
