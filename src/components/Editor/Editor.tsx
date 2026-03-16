import { useCallback, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorSelection } from '@uiw/react-codemirror'
import type { ViewUpdate } from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { sampleEmail } from '../../assets/sampleEmail'
import styles from './Editor.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
}

interface ActiveColor {
  from: number
  to: number
  raw: string
  hex: string
}

interface ActiveImage {
  tagFrom: number
  tagTo: number
  srcFrom: number | null
  srcTo: number | null
  src: string
}

const COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g

function rgbStringToHex(value: string): string | null {
  const match = value.match(/\d+(\.\d+)?/g)
  if (!match || match.length < 3) return null
  const [r, g, b] = match.slice(0, 3).map((part) => {
    const numeric = Number(part)
    return Math.max(0, Math.min(255, Math.round(numeric)))
  })
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function normalizeColorToHex(value: string): string | null {
  const trimmed = value.trim()

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase()
    }
    return trimmed.toLowerCase()
  }

  const probe = document.createElement('span')
  probe.style.color = ''
  probe.style.color = trimmed
  if (!probe.style.color) return null

  return rgbStringToHex(probe.style.color)
}

function findActiveColor(source: string, from: number, to: number): ActiveColor | null {
  COLOR_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null = COLOR_PATTERN.exec(source)

  while (match) {
    const raw = match[0]
    const matchFrom = match.index
    const matchTo = matchFrom + raw.length
    const overlapsSelection = from === to
      ? from >= matchFrom && from <= matchTo
      : from < matchTo && to > matchFrom

    if (overlapsSelection) {
      const hex = normalizeColorToHex(raw)
      if (hex) {
        return {
          from: matchFrom,
          to: matchTo,
          raw,
          hex,
        }
      }
    }

    match = COLOR_PATTERN.exec(source)
  }

  return null
}

function findActiveImage(source: string, from: number, to: number): ActiveImage | null {
  const imgPattern = /<img\b[^>]*>/gi
  let match: RegExpExecArray | null = imgPattern.exec(source)

  while (match) {
    const rawTag = match[0]
    const tagFrom = match.index
    const tagTo = tagFrom + rawTag.length
    const overlapsSelection = from === to
      ? from >= tagFrom && from <= tagTo
      : from < tagTo && to > tagFrom

    if (overlapsSelection) {
      const srcMatch = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawTag)

      if (!srcMatch) {
        return {
          tagFrom,
          tagTo,
          srcFrom: null,
          srcTo: null,
          src: '',
        }
      }

      const attrOffset = srcMatch.index ?? 0
      const attrText = srcMatch[0]
      const value = srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? ''
      const valueIndexInAttr = attrText.indexOf(value)

      return {
        tagFrom,
        tagTo,
        srcFrom: tagFrom + attrOffset + valueIndexInAttr,
        srcTo: tagFrom + attrOffset + valueIndexInAttr + value.length,
        src: value,
      }
    }

    match = imgPattern.exec(source)
  }

  return null
}

export function Editor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const [activeColor, setActiveColor] = useState<ActiveColor | null>(null)
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState<string>('')

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

  const syncSelectionState = useCallback((view: EditorView) => {
    const selection = view.state.selection.main
    const source = view.state.doc.toString()
    const nextActiveImage = findActiveImage(source, selection.from, selection.to)
    setActiveColor(findActiveColor(source, selection.from, selection.to))
    setActiveImage(nextActiveImage)
    setImageUrlInput(nextActiveImage?.src ?? '')
  }, [])

  const handleCreateEditor = useCallback((view: EditorView) => {
    editorViewRef.current = view
    syncSelectionState(view)
  }, [syncSelectionState])

  const handleUpdate = useCallback((update: ViewUpdate) => {
    if (update.selectionSet || update.docChanged) {
      syncSelectionState(update.view)
    }
  }, [syncSelectionState])

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editorViewRef.current || !activeColor) return

    const nextColor = e.target.value.toLowerCase()
    const currentDoc = editorViewRef.current.state.doc.toString()
    const nextValue = `${currentDoc.slice(0, activeColor.from)}${nextColor}${currentDoc.slice(activeColor.to)}`

    onChange(nextValue)

    requestAnimationFrame(() => {
      const view = editorViewRef.current
      if (!view) return

      const nextTo = activeColor.from + nextColor.length
      view.dispatch({
        selection: EditorSelection.range(activeColor.from, nextTo),
        effects: EditorView.scrollIntoView(activeColor.from, { y: 'center' }),
      })
      view.focus()
      setActiveColor({
        from: activeColor.from,
        to: nextTo,
        raw: nextColor,
        hex: nextColor,
      })
    })
  }, [activeColor, onChange])

  const replaceActiveImageSrc = useCallback((nextSrc: string) => {
    if (!editorViewRef.current || !activeImage) return

    const currentDoc = editorViewRef.current.state.doc.toString()
    let nextValue = currentDoc
    let selectionFrom = activeImage.tagFrom
    let selectionTo = activeImage.tagTo

    if (activeImage.srcFrom !== null && activeImage.srcTo !== null) {
      nextValue = `${currentDoc.slice(0, activeImage.srcFrom)}${nextSrc}${currentDoc.slice(activeImage.srcTo)}`
      selectionFrom = activeImage.srcFrom
      selectionTo = activeImage.srcFrom + nextSrc.length
    } else {
      const insertionPoint = activeImage.tagTo - 1
      const injected = ` src="${nextSrc}"`
      nextValue = `${currentDoc.slice(0, insertionPoint)}${injected}${currentDoc.slice(insertionPoint)}`
      selectionFrom = insertionPoint + 6
      selectionTo = selectionFrom + nextSrc.length
    }

    onChange(nextValue)
    setImageUrlInput(nextSrc)

    requestAnimationFrame(() => {
      const view = editorViewRef.current
      if (!view) return

      view.dispatch({
        selection: EditorSelection.range(selectionFrom, selectionTo),
        effects: EditorView.scrollIntoView(selectionFrom, { y: 'center' }),
      })
      view.focus()
      setActiveImage(findActiveImage(nextValue, selectionFrom, selectionTo))
    })
  }, [activeImage, onChange])

  const handleImageFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        replaceActiveImageSrc(result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [replaceActiveImageSrc])

  const handleImageUrlApply = useCallback(() => {
    const trimmed = imageUrlInput.trim()
    if (!trimmed) return
    replaceActiveImageSrc(trimmed)
  }, [imageUrlInput, replaceActiveImageSrc])

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <div className={styles.headerMeta}>
          <span className={styles.editorTitle}>HTML Source</span>
          <span className={styles.editorHint}>Select color codes or image tags to edit inline.</span>
        </div>
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

      <div className={styles.editorTools}>
        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Color</span>
          <div className={`${styles.toolSlot} ${activeColor ? styles.toolSlotActive : ''}`}>
            {activeColor ? (
              <label className={styles.colorControl}>
                <input
                  type="color"
                  value={activeColor.hex}
                  onChange={handleColorChange}
                  aria-label={`Edit color ${activeColor.raw}`}
                  className={styles.colorInput}
                />
                <span className={styles.colorValue}>{activeColor.raw}</span>
              </label>
            ) : null}
          </div>
        </div>

        <div className={styles.toolRow}>
          <span className={styles.toolLabel}>Image</span>
          <div className={`${styles.toolSlot} ${styles.imageSlot} ${activeImage ? styles.toolSlotActive : ''}`}>
            {activeImage ? (
              <div className={styles.imageControls}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Upload Image
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleImageFileUpload}
                />
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste remote image URL"
                  className={styles.imageUrlInput}
                />
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleImageUrlApply}
                >
                  Apply URL
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.codemirrorWrap}>
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[html()]}
          onChange={onChange}
          onCreateEditor={handleCreateEditor}
          onUpdate={handleUpdate}
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
