import { useRef, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { sampleEmail } from '../../assets/sampleEmail'
import styles from './Editor.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function Editor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') onChange(text)
    }
    reader.readAsText(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }, [onChange])

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <span className={styles.editorTitle}>HTML Source</span>
        <div className={styles.editorActions}>
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => onChange(sampleEmail)}
            title="Load the built-in sample email"
          >
            Load Sample
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Upload an .html file"
          >
            📂 Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            className={styles.fileInput}
            onChange={handleFileUpload}
            data-testid="file-input"
          />
        </div>
      </div>

      <div className={styles.codemirrorWrap}>
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[html()]}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
        />
      </div>
    </div>
  )
}
