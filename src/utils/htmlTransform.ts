import { parseColorValue } from './colorTransform'

export function parseHtmlToDom(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

export function serializeDom(doc: Document): string {
  return '<!DOCTYPE html>' + doc.documentElement.outerHTML
}

// Properties treated as "background" for color transform purposes
const BACKGROUND_PROPS = new Set([
  'background', 'background-color', 'border-color',
  'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'border', 'border-top', 'border-bottom', 'border-left', 'border-right',
  'outline-color', 'outline',
])

// Properties treated as "text"
const TEXT_PROPS = new Set(['color'])

export function isBackgroundProp(prop: string): boolean {
  return BACKGROUND_PROPS.has(prop.toLowerCase())
}

export function isTextProp(prop: string): boolean {
  return TEXT_PROPS.has(prop.toLowerCase())
}

/**
 * Walk every element in the document and transform each inline style property
 * through the provided transformer function.
 */
export function transformInlineStyles(
  doc: Document,
  transformer: (prop: string, value: string) => string
): Document {
  doc.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    const style = el.getAttribute('style') ?? ''
    const transformed = style
      .split(';')
      .map(decl => {
        const sep = decl.indexOf(':')
        if (sep === -1) return decl
        const prop = decl.slice(0, sep).trim()
        const value = decl.slice(sep + 1).trim()
        if (!prop || !value) return decl
        const newValue = transformer(prop, value)
        return `${prop}: ${newValue}`
      })
      .join('; ')
    el.setAttribute('style', transformed)
  })
  return doc
}

/**
 * Walk all elements that carry legacy HTML color attributes
 * (bgcolor, color on <font>/<td>/<table>, background) and transform them.
 */
export function transformAttributeColors(
  doc: Document,
  transformer: (value: string) => string
): Document {
  // bgcolor on any element
  doc.querySelectorAll('[bgcolor]').forEach(el => {
    const val = el.getAttribute('bgcolor') ?? ''
    const colorPart = parseColorValue(val)
    if (colorPart) el.setAttribute('bgcolor', transformer(colorPart))
  })

  // color attribute on <font>, <th>, <td>
  doc.querySelectorAll('font[color], th[color], td[color]').forEach(el => {
    const val = el.getAttribute('color') ?? ''
    const colorPart = parseColorValue(val)
    if (colorPart) el.setAttribute('color', transformer(colorPart))
  })

  // background attribute (legacy table background images — extract color part only)
  doc.querySelectorAll('[background]').forEach(el => {
    const val = el.getAttribute('background') ?? ''
    // Only transform if it looks like a color, not a URL
    if (!val.startsWith('http') && !val.startsWith('/') && !val.endsWith('.jpg') && !val.endsWith('.png')) {
      const colorPart = parseColorValue(val)
      if (colorPart) el.setAttribute('background', transformer(colorPart))
    }
  })

  return doc
}
