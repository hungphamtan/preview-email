# Email Template Preview Tool — Implementation Plan

## Project Goal

A React + Vite + TypeScript single-page application that lets users paste or upload an HTML email template and preview how it renders across major email clients in both **light** and **dark** mode, with desktop and mobile device frames.

Fully client-side. No backend. Deploy to free static hosting (Netlify recommended).

---

## Reference Sources

- https://dev.to/mailpeek/the-complete-guide-to-email-client-rendering-differences-in-2026-243f
- https://mailpeek.dev/blog/dark-mode-email-rendering.html

---

## Supported Email Clients

| ID | Client | Platform |
|---|---|---|
| `gmail-web` | Gmail Web | Browser (desktop) |
| `gmail-ios` | Gmail iOS App | iPhone/iPad |
| `gmail-android` | Gmail Android App | Android phone/tablet |
| `outlook-desktop` | Outlook Desktop (Windows, Word engine) | Desktop app |
| `outlook-com` | Outlook.com / New Outlook | Browser |
| `outlook-mobile` | Outlook Mobile (iOS + Android) | Phone/tablet app |
| `apple-mail` | Apple Mail | macOS + iOS |
| `outlook-mac` | Outlook Mac | macOS app |
| `yahoo-mail` | Yahoo Mail | Browser |

---

## Dark Mode Behavior Matrix

This drives every simulator's transformation logic.

| Client | Dark Mode Strategy | Transforms Backgrounds | Transforms Text | Transforms Images | Respects `prefers-color-scheme` | Respects `color-scheme` meta | Developer Control |
|---|---|---|---|---|---|---|---|
| Gmail Web | **None** | No | No | No | No | No | High (nothing happens) |
| Gmail iOS | **Full inversion** | Yes (inverted) | Yes (inverted) | Yes (inverts then re-inverts) | No | No | None |
| Gmail Android | **Partial inversion** | Yes (smart invert) | Yes (smart invert) | No | No | No | None |
| Outlook Desktop | **Full auto-inversion + `!important` overrides** | Yes (replaced) | Yes (replaced) | No | No | No | None |
| Outlook.com | **Partial inversion + injected overrides** | Yes (remapped) | Yes (remapped) | No | Partial | Partial | Low |
| Outlook Mobile | **None / CSS-based** | No | No | No | Yes | Yes | Full |
| Apple Mail | **CSS-based (partial inversion as fallback)** | Yes (replaced or CSS) | Yes (replaced or CSS) | No | Yes | Yes | Full |
| Outlook Mac | **CSS-based** | No | No | No | Yes | Yes | Full |
| Yahoo Mail | **None** | No | No | No | No | No | High (nothing happens) |

### Critical Insights from Research (2026)

- **Gmail Android differs from Gmail iOS**: iOS does full inversion, Android does partial/smart inversion. Both ignore developer CSS dark mode controls entirely.
- **Outlook Desktop is more aggressive than expected**: Uses `!important` overrides that can defeat developer inline styles — unlike Outlook.com which only partially overrides.
- **Outlook Mobile is the opposite of Outlook Desktop**: The mobile app respects `prefers-color-scheme` and `color-scheme` meta fully — behaves like a standards-compliant browser.
- **Apple Mail is the gold standard**: Full developer control via CSS media queries.
- **Gmail Web does nothing**: The email renders exactly as authored. Highest predictability.
- **Yahoo Mail does nothing**: Same as Gmail Web — no transformation.

### Crucial Requirements for Dark Mode Compatible Templates

To survive across all clients an email must:
1. Always declare `<meta name="color-scheme" content="light dark">` in `<head>`
2. Set explicit `background-color` and `color` on all elements — never rely on inheritance
3. Use off-white (`#FAFAFA`) instead of pure `#FFFFFF` and dark-grey (`#222222`) instead of `#000000` to reduce aggressive inversion artifacts in Gmail/Outlook Desktop
4. Wrap dark mode CSS in `@media (prefers-color-scheme: dark) { ... }` for clients that support it
5. Keep images on non-transparent colored backgrounds to prevent inversion artifacts in Gmail Android

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Vite + React + TypeScript | App framework |
| `@uiw/react-codemirror` | HTML code editor |
| `@codemirror/lang-html` | HTML syntax highlighting |
| `@codemirror/theme-one-dark` | Editor dark theme |
| CSS Modules | App styling (no UI framework) |
| Vitest | Unit tests for util functions |

No CSS framework. No color library. No CSS parser library. All transformation logic built from browser APIs.

---

## Project Structure

```
preview-email/
├── public/
├── src/
│   ├── types/
│   │   └── index.ts              # EmailClient, SystemMode, DeviceMode, PreviewConfig
│   ├── simulators/
│   │   ├── types.ts              # Simulator interface contract
│   │   ├── gmailWeb.ts
│   │   ├── gmailIos.ts
│   │   ├── gmailAndroid.ts       # NEW
│   │   ├── outlookDesktop.ts
│   │   ├── outlookCom.ts
│   │   ├── outlookMobile.ts      # NEW
│   │   ├── appleMail.ts
│   │   ├── outlookMac.ts         # NEW
│   │   ├── yahooMail.ts          # NEW
│   │   └── index.ts              # Registry map
│   ├── utils/
│   │   ├── colorTransform.ts     # HSL color math + Outlook/Gmail transforms
│   │   ├── cssParser.ts          # CSSOM dark media rule extractor
│   │   └── htmlTransform.ts      # DOM walk, inline style rewriter
│   ├── components/
│   │   ├── Toolbar/
│   │   │   └── Toolbar.tsx       # Client selector, mode toggle, device toggle
│   │   ├── Editor/
│   │   │   └── Editor.tsx        # CodeMirror + file upload + sample button
│   │   ├── PreviewPane/
│   │   │   └── PreviewPane.tsx   # iframe orchestrator
│   │   ├── DeviceFrame/
│   │   │   └── DeviceFrame.tsx   # Phone / desktop CSS chrome
│   │   └── ClientBadge/
│   │       └── ClientBadge.tsx   # Icon + label per client
│   ├── assets/
│   │   └── sampleEmail.ts        # Built-in demo HTML email
│   ├── App.tsx
│   └── main.tsx
├── netlify.toml
├── vite.config.ts
└── plan.md
```

---

## Core Types (`src/types/index.ts`)

```typescript
export type EmailClient =
  | 'gmail-web'
  | 'gmail-ios'
  | 'gmail-android'
  | 'outlook-desktop'
  | 'outlook-com'
  | 'outlook-mobile'
  | 'apple-mail'
  | 'outlook-mac'
  | 'yahoo-mail';

export type SystemMode = 'light' | 'dark';
export type DeviceMode = 'desktop' | 'mobile';

export interface PreviewConfig {
  client: EmailClient;
  systemMode: SystemMode;
  deviceMode: DeviceMode;
}

export interface SimulatorResult {
  html: string;           // Full transformed HTML string
  injectedStyles: string; // Extra CSS to inject as last <style> in <head>
}

export interface ClientMeta {
  id: EmailClient;
  label: string;
  platform: 'web' | 'ios' | 'android' | 'desktop' | 'macos';
  defaultDevice: DeviceMode;
}
```

## Simulator Interface (`src/simulators/types.ts`)

```typescript
export interface Simulator {
  transform(rawHtml: string, config: PreviewConfig): SimulatorResult;
}
```

---

## Implementation Phases

### Phase 1 — Project Scaffold

1. `npm create vite@latest preview-email -- --template react-ts`
2. Install deps: `@uiw/react-codemirror @codemirror/lang-html @codemirror/theme-one-dark`
3. Dev deps: `vitest @vitest/ui gh-pages`
4. `vite.config.ts`: set `base: './'`
5. Create full folder structure
6. Add `netlify.toml`

### Phase 2 — Types and Simulator Contract

Write `src/types/index.ts` and `src/simulators/types.ts` first. Everything else depends on these.

### Phase 3 — Utility Functions

Build in this order (no dependencies between them):

#### `src/utils/colorTransform.ts`

**Parsers** (handle all common email color formats):
- `hexToRgb(hex)` — handles `#rrggbb` and `#rgb`
- `rgbStringToRgb(rgb)` — handles `rgb(r,g,b)` and `rgba(r,g,b,a)`
- Named color lookup table: white, black, red, green, blue, yellow, gray, silver, navy, maroon, purple, fuchsia, lime, aqua, teal, olive, orange (min 20 entries)
- `parseAnyColor(value)` — tries all parsers, returns `[r,g,b,alpha]|null`

**Converters**:
- `rgbToHsl(r,g,b)` → `[h,s,l]` — H in [0,360], S/L in [0,1]
- `hslToRgb(h,s,l)` → `[r,g,b]`
- `rgbToHex(r,g,b)` → `#rrggbb`

**Core transformation — Outlook full inversion** (`transformColorForOutlook`):

```
Background colors (property = background/background-color/border-color):
  L > 0.70 (light): newL = 0.10 + (1 - L) × 0.15, newS = S × 0.75
  0.30 ≤ L ≤ 0.70 (mid): newL = L × 0.6
  L < 0.30 (dark): unchanged

Text colors (property = color):
  L < 0.30 (dark text): newL = 0.75 + L × 0.15, newS = S × 0.90
  0.30 ≤ L ≤ 0.70 (mid): newL = 0.40 + (1 - L) × 0.45
  L > 0.70 (light text): unchanged
```

Pass-through values: `transparent`, `inherit`, `currentColor`, `none`.
Preserve alpha channel from `rgba()` in output.

**Gmail Android smart inversion** (`transformColorForGmailAndroid`):

Gmail Android uses a "smart" partial inversion — lighter than full inversion, more like a luminance-aware mapping:

```
Background colors:
  L > 0.85 (near-white): newL = 0.12, newS = S × 0.8
  0.60 < L ≤ 0.85: newL = L × 0.35
  0.40 ≤ L ≤ 0.60 (mid): newL = L × 0.55 (partial darkening)
  L < 0.40 (already dark): unchanged

Text colors:
  L < 0.20 (near-black): newL = 0.88, newS = S × 0.85
  0.20 ≤ L < 0.45: newL = 0.60 + (0.45 - L) × 0.5
  L ≥ 0.45: unchanged
```

Images are NOT inverted by Gmail Android (unlike Gmail iOS).

#### `src/utils/cssParser.ts`

**`extractDarkMediaRules(html: string): string`**

Uses CSSOM (not regex) to safely extract dark mode CSS rules:
1. `DOMParser().parseFromString(html, 'text/html')` — get style elements
2. For each `<style>`, clone into live `document.head`, read `.sheet.cssRules`
3. Filter `CSSMediaRule` where `conditionText` includes `prefers-color-scheme` + `dark`
4. Extract inner `cssText` strings, remove cloned style, concatenate results
5. Fallback regex for `SecurityError` (nested brace counter algorithm)

**`filterColorOnlyRules(css: string): string`**

Strips non-color CSS declarations (layout, spacing, typography) for Outlook.com partial support approximation. Keeps only: `color`, `background-color`, `background`, `border-color`, `outline-color`.

**`stripDarkMediaRules(html: string): string`**

Returns HTML with `@media (prefers-color-scheme: dark) { ... }` blocks removed from `<style>` tags. Used to prevent double-application in Apple Mail simulator.

**`stripCspMetaTags(doc: Document): void`**

Removes `<meta http-equiv="Content-Security-Policy">` — prevents injected styles from being blocked inside the iframe.

#### `src/utils/htmlTransform.ts`

- `parseHtmlToDom(html)` → `Document` via `DOMParser`
- `serializeDom(doc)` → `string` via `XMLSerializer`
- `transformInlineStyles(doc, transformer)` — walk all elements, parse style attribute, apply `transformer(prop, value)` per property, write back
- `transformAttributeColors(doc, transformer)` — walk all elements for `bgcolor`, `color` (on `<font>`,`<td>`,`<table>`), `background` attributes

Background-type properties: `background`, `background-color`, `border`, `border-color`, `border-top`, `border-bottom`, `border-left`, `border-right`, `outline-color`
Text-type properties: `color`

---

### Phase 4 — Simulators

Build in this order (simplest first, validates the pipeline):

#### `gmailWeb.ts` and `yahooMail.ts`

Both return `{ html: rawHtml, injectedStyles: '' }` in all modes.
Gmail Web and Yahoo Mail never transform email content regardless of system mode.
The device frame's background color reflects the client's dark/light UI chrome, but iframe content is always unchanged.

#### `outlookMac.ts`

Behaves identically to Apple Mail — full developer control via `prefers-color-scheme`. Delegates to the same extraction logic as Apple Mail simulator.

```
Light mode: pass through
Dark mode:
  - extractDarkMediaRules(rawHtml) → inject as unconditional styles
  - check color-scheme meta → if present, set color-scheme: dark on <html>
  - DO NOT transform inline styles
```

#### `outlookMobile.ts`

Same behavior as Outlook Mac / Apple Mail — respects `prefers-color-scheme` fully. The Outlook mobile app uses a modern rendering engine (not the Word engine), so it behaves like a standards-compliant browser.

```
Light mode: pass through
Dark mode:
  - extractDarkMediaRules(rawHtml) → inject as unconditional styles
  - respect color-scheme meta
  - DO NOT transform inline styles
  - Set color-scheme: dark on html if meta is present
```

#### `appleMail.ts`

```
Light mode: pass through
Dark mode:
  - extractDarkMediaRules(rawHtml)
  - stripDarkMediaRules: NOT needed (browser handles native media queries)
  - Instead inject extracted dark rules as unconditional styles
  - Detect <meta name="color-scheme" content="...dark...">
  - If found: add html { color-scheme: dark } to injectedStyles
  - Apple Mail may also apply its own partial inversion as a fallback
    when no dark CSS exists — simulate by injecting:
    html { color-scheme: dark; background-color: canvas; }
  - DO NOT transform inline styles
```

#### `gmailIos.ts`

```
Light mode: pass through
Dark mode:
  - injectedStyles:
      body, [data-ogsc] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      img, [data-ogsc] img {
        filter: invert(1) hue-rotate(180deg) !important;
      }
  - rawHtml unchanged (no DOM manipulation needed — pure CSS filter)
```

The double inversion on images cancels out: mathematically identity, but images appear normal while backgrounds/text are inverted.

#### `gmailAndroid.ts`

Gmail Android differs from iOS: partial/smart inversion, NOT full inversion. Backgrounds and text are remapped using the luminance-aware algorithm. Images are NOT inverted.

```
Light mode: pass through
Dark mode:
  - doc = parseHtmlToDom(rawHtml)
  - transformInlineStyles(doc, (prop, value) => {
      if (isBackgroundProp(prop)) return transformColorForGmailAndroid(value, 'background')
      if (isTextProp(prop)) return transformColorForGmailAndroid(value, 'text')
      return value
    })
  - transformAttributeColors(doc, v => transformColorForGmailAndroid(v, 'background'))
  - injectedStyles: html, body { background-color: #1c1c1e !important; color: #e5e5ea !important; }
  - Images: NO filter applied (Gmail Android preserves images)
```

#### `outlookDesktop.ts`

The most aggressive simulator. Outlook Desktop uses `!important` overrides with its Word rendering engine — it replaces both inline styles AND embedded `<style>` CSS color rules.

```
Light mode: pass through
Dark mode:
  - doc = parseHtmlToDom(rawHtml)
  - stripCspMetaTags(doc)

  Step 1: Transform inline styles (same as before)
  - transformInlineStyles(doc, (prop, value) => {
      if (isBackgroundProp(prop)) transformColorForOutlook(value, 'background')
      if (isTextProp(prop)) transformColorForOutlook(value, 'text')
      return value
    })

  Step 2: Transform HTML attribute colors
  - transformAttributeColors(doc, v => transformColorForOutlook(v, 'background'))

  Step 3: Strip @media (prefers-color-scheme: dark) blocks entirely
  - Outlook Desktop ignores these — strip to avoid accidental override

  Step 4: Also transform colors in embedded <style> blocks
  - Walk doc.querySelectorAll('style')
  - For each rule in .sheet.cssRules, transform color declarations
  - This simulates Outlook's !important override behavior

  - injectedStyles:
      html, body {
        background-color: #1a1a1a !important;
        color: #d4d4d4 !important;
      }
```

#### `outlookCom.ts`

Partial inversion with injected overrides. Similar to Outlook Desktop but:
- Uses partial (not full) inline style transformation
- Also injects filtered dark media query CSS (partial `prefers-color-scheme` support)

```
Light mode: pass through
Dark mode:
  - doc = parseHtmlToDom(rawHtml)
  - transformInlineStyles (same algorithm as outlookDesktop)
  - transformAttributeColors (same)
  - darkCss = extractDarkMediaRules(rawHtml)
  - filteredDarkCss = filterColorOnlyRules(darkCss)
  - injectedStyles:
      html, body { background-color: #1c1c1c !important; color: #cccccc !important; }
      [filtered dark rules from @media blocks]
```

---

### Phase 5 — PreviewPane Component

**`src/components/PreviewPane/PreviewPane.tsx`**

```typescript
// Simulator registry
const SIMULATORS: Record<EmailClient, Simulator> = {
  'gmail-web': gmailWebSimulator,
  'gmail-ios': gmailIosSimulator,
  'gmail-android': gmailAndroidSimulator,
  'outlook-desktop': outlookDesktopSimulator,
  'outlook-com': outlookComSimulator,
  'outlook-mobile': outlookMobileSimulator,
  'apple-mail': appleMailSimulator,
  'outlook-mac': outlookMacSimulator,
  'yahoo-mail': yahooMailSimulator,
}
```

**`buildSrcdoc(result: SimulatorResult): string`**:
1. Parse `result.html` with DOMParser
2. Create `<style data-preview-injected>` element with `result.injectedStyles`
3. Append as LAST child of `<head>` (wins specificity)
4. Return `'<!DOCTYPE html>' + doc.documentElement.outerHTML`

**Iframe**:
```tsx
<iframe
  srcDoc={srcdoc}
  sandbox="allow-same-origin"   // NEVER add allow-scripts
  title={`Preview: ${config.client}`}
  style={{ width: '100%', height: '100%', border: 'none' }}
/>
```

**Performance**: Wrap the transform call in `useMemo([rawHtml, config])`. For emails > 100KB, debounce `rawHtml` by 300ms before passing to PreviewPane.

---

### Phase 6 — DeviceFrame Component

**`src/components/DeviceFrame/DeviceFrame.tsx`**

CSS-only frames — no images or SVGs needed.

**Desktop frame**: Simulated email client window with:
- Title bar with three dots (red/yellow/green) as CSS circles
- Fake toolbar with search bar shape
- Scrollable content area

**Mobile frame**: Phone mockup with:
- Rounded rectangle outline (CSS border-radius ~40px)
- Top notch/pill camera indicator
- Side button indicators
- Inner viewport: 390px wide (iPhone 14 width) or 360px (Android)
- Content scrolls inside the frame

**Client-specific UI chrome colors** (background of device frame reflects the client's actual UI):

| Client | Light UI BG | Dark UI BG |
|---|---|---|
| Gmail | `#f1f3f4` | `#202124` |
| Outlook | `#f3f2f1` | `#2b2b2b` |
| Apple Mail | `#ececec` | `#1e1e1e` |
| Yahoo Mail | `#f5f8fa` | `#1d1f21` |

---

### Phase 7 — Editor Component

**`src/components/Editor/Editor.tsx`**

- CodeMirror editor with HTML syntax highlighting
- File upload via `<input type="file" accept=".html,.htm">` + `FileReader.readAsText()`
- "Load Sample" button injects `src/assets/sampleEmail.ts` (a pre-built dark-mode-ready email template that demonstrates all techniques — color-scheme meta, prefers-color-scheme CSS, explicit colors)
- Resizable panel height

---

### Phase 8 — Toolbar Component

**`src/components/Toolbar/Toolbar.tsx`**

Three control groups:

1. **Client selector** — horizontal scrollable tab bar with client name + platform icon. On narrow viewport, collapses to `<select>` dropdown. Groups: Google (Gmail Web, iOS, Android), Microsoft (Outlook Desktop, Outlook.com, Outlook Mobile, Outlook Mac), Apple (Apple Mail), Yahoo.

2. **System mode toggle** — Light / Dark two-state toggle with sun and moon icons.

3. **Device mode toggle** — Desktop / Mobile two-button toggle. Automatically switches when client default device differs (e.g., selecting Gmail iOS auto-sets Mobile).

**Auto-device switching logic**:
```typescript
const CLIENT_DEFAULT_DEVICE: Record<EmailClient, DeviceMode> = {
  'gmail-web': 'desktop',
  'gmail-ios': 'mobile',
  'gmail-android': 'mobile',
  'outlook-desktop': 'desktop',
  'outlook-com': 'desktop',
  'outlook-mobile': 'mobile',
  'apple-mail': 'desktop',
  'outlook-mac': 'desktop',
  'yahoo-mail': 'desktop',
}
```

When client changes, suggest (but don't force) switching device to client default.

---

### Phase 9 — App Layout and State

**`src/App.tsx`**

```typescript
const [rawHtml, setRawHtml] = useState<string>(sampleEmail)
const [config, setConfig] = useState<PreviewConfig>({
  client: 'gmail-web',
  systemMode: 'light',
  deviceMode: 'desktop',
})
const [editorOpen, setEditorOpen] = useState<boolean>(true)
```

Layout: two-column (`editor | preview`) on desktop, stacked on mobile. Editor panel is collapsible.

---

### Phase 10 — Sample Email Asset

**`src/assets/sampleEmail.ts`**

A hardcoded HTML email string that demonstrates every dark mode technique:
- `<meta name="color-scheme" content="light dark">`
- Explicit inline `background-color` and `color` on all elements
- Off-white (`#FAFAFA`) background instead of `#FFFFFF`
- Off-black (`#222222`) text instead of `#000000`
- `@media (prefers-color-scheme: dark) { ... }` block with explicit dark theme colors
- A logo image with explicit background container color
- Both table-based and div-based sections to test selector coverage

This sample serves as a reference for users on best practices.

---

## Per-Task Workflow (Required for Every Task)

After completing each numbered task below, perform these steps **immediately — do not batch them**:

### 1. Self-Test with MCP Playwright

Use MCP Playwright to open the running dev server (`http://localhost:5173`) and verify the task's deliverable:

```
- playwright_navigate to http://localhost:5173
- playwright_screenshot to capture current state
- Assert the expected UI/behavior is visible (specific assertions listed per task)
- If assertion fails: fix before proceeding to stage/commit
```

Each task specifies its own Playwright assertions (see Build Order below).

### 2. Stage Changes

Stage only files modified by the current task:

```bash
git add <specific files changed by this task>
# Never use git add -A or git add . — stage files explicitly
```

### 3. Commit

```bash
git commit -m "$(cat <<'EOF'
<concise commit message for this task>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Commit immediately after the self-test passes. Do not wait until all tasks are done.

---

## Build Order (Critical Path)

Each task includes: **deliverable → Playwright self-test assertion → commit message**.

---

### Task 1 — Project Scaffold

**Files**: `package.json`, `vite.config.ts`, `tsconfig.json`, `netlify.toml`, `index.html`, `src/main.tsx`, `src/App.tsx` (stub)

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
playwright_screenshot
→ Assert: page title "Email Preview" visible, no console errors
```

**Commit**: `chore: scaffold Vite + React + TypeScript project with Netlify config`

---

### Task 2 — Core Types and Simulator Contract

**Files**: `src/types/index.ts`, `src/simulators/types.ts`

**Playwright assertion**:
```
→ Assert: `npm run build` exits 0 (TypeScript compiles without errors)
  (No visible UI change — use playwright_evaluate to check window.__BUILD_OK__ or just verify no error overlay)
```

**Commit**: `feat(types): define EmailClient, PreviewConfig, and Simulator interface`

---

### Task 3 — Color Transform Utility (+ unit tests)

**Files**: `src/utils/colorTransform.ts`, `src/utils/colorTransform.test.ts`

**Playwright assertion**:
```
→ Run: npx vitest run src/utils/colorTransform.test.ts
→ Assert: all tests pass (0 failures)
→ playwright_navigate http://localhost:5173
→ Assert: no error overlay (import of colorTransform must not crash the app)
```

Key test cases to cover:
- `transformColorForOutlook('#ffffff', 'background')` → L < 0.20
- `transformColorForOutlook('#000000', 'text')` → L > 0.70
- `transformColorForGmailAndroid('#ffffff', 'background')` → L < 0.20
- Pass-through: `transformColorForOutlook('transparent', 'background')` → `'transparent'`
- Named color: `transformColorForOutlook('white', 'background')` → dark hex

**Commit**: `feat(utils): add colorTransform with HSL-based Outlook and Gmail Android algorithms`

---

### Task 4 — CSS Parser Utility (+ unit tests)

**Files**: `src/utils/cssParser.ts`, `src/utils/cssParser.test.ts`

**Playwright assertion**:
```
→ Run: npx vitest run src/utils/cssParser.test.ts
→ Assert: all tests pass
```

Key test cases:
- `extractDarkMediaRules` on HTML with `@media (prefers-color-scheme: dark)` → returns inner CSS
- `extractDarkMediaRules` on HTML with no dark media query → returns `''`
- `filterColorOnlyRules` strips layout properties, keeps color/background

**Commit**: `feat(utils): add cssParser for CSSOM-based dark media rule extraction`

---

### Task 5 — HTML Transform Utility

**Files**: `src/utils/htmlTransform.ts`

**Playwright assertion**:
```
→ Run: npx vitest run (if test file added)
→ playwright_navigate http://localhost:5173
→ Assert: no error overlay
```

**Commit**: `feat(utils): add htmlTransform for DOM-based inline style and attribute rewriting`

---

### Task 6 — Pass-Through Simulators (Gmail Web, Yahoo Mail)

**Files**: `src/simulators/gmailWeb.ts`, `src/simulators/yahooMail.ts`, `src/simulators/index.ts` (partial registry)

**Playwright assertion**:
```
→ Requires PreviewPane wired up minimally (stub iframe)
  If not yet wired: assert TypeScript compiles only
→ playwright_navigate http://localhost:5173
→ Assert: no crash
```

**Commit**: `feat(simulators): add Gmail Web and Yahoo Mail pass-through simulators`

---

### Task 7 — CSS-Based Simulators (Apple Mail, Outlook Mac, Outlook Mobile)

**Files**: `src/simulators/appleMail.ts`, `src/simulators/outlookMac.ts`, `src/simulators/outlookMobile.ts`

**Playwright assertion** (requires PreviewPane wired up — do this after Task 11 if PreviewPane not ready yet, or wire a stub):
```
playwright_navigate http://localhost:5173
→ Switch to Apple Mail client, Dark mode
→ playwright_screenshot
→ Assert: injected dark styles visible in iframe (check via playwright_evaluate:
    document.querySelector('iframe').contentDocument
      .querySelector('[data-preview-injected]') !== null
  )
```

**Commit**: `feat(simulators): add Apple Mail, Outlook Mac, Outlook Mobile CSS-based dark mode simulators`

---

### Task 8 — Gmail iOS Simulator (Full Inversion)

**Files**: `src/simulators/gmailIos.ts`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Select Gmail iOS, Dark mode
→ playwright_screenshot
→ Assert iframe body has filter:invert CSS applied:
    playwright_evaluate:
      getComputedStyle(iframe.contentDocument.body).filter
      → contains 'invert'
```

**Commit**: `feat(simulators): add Gmail iOS full-inversion dark mode simulator`

---

### Task 9 — Gmail Android Simulator (Partial/Smart Inversion)

**Files**: `src/simulators/gmailAndroid.ts`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Select Gmail Android, Dark mode
→ playwright_screenshot
→ Assert: inline background-color on body is dark (not white):
    playwright_evaluate:
      iframe.contentDocument.body.style.backgroundColor
      → not '#ffffff' or 'white'
→ Assert: img elements do NOT have a filter applied
```

**Commit**: `feat(simulators): add Gmail Android smart-inversion dark mode simulator`

---

### Task 10 — Outlook Simulators (Desktop + Outlook.com)

**Files**: `src/simulators/outlookDesktop.ts`, `src/simulators/outlookCom.ts`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Select Outlook Desktop, Dark mode
→ playwright_screenshot
→ Assert: background color of email body in iframe is dark
→ Select Outlook.com, Dark mode
→ playwright_screenshot
→ Assert: dark background applied + injected style tag present
```

**Commit**: `feat(simulators): add Outlook Desktop and Outlook.com dark mode simulators`

---

### Task 11 — Sample Email Asset

**Files**: `src/assets/sampleEmail.ts`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Click "Load Sample" button
→ playwright_screenshot
→ Assert: preview iframe shows email content (not blank)
→ Assert: email contains color-scheme meta (check via playwright_evaluate on iframe.contentDocument)
```

**Commit**: `feat(assets): add dark-mode-ready sample email demonstrating all compatibility techniques`

---

### Task 12 — DeviceFrame Component

**Files**: `src/components/DeviceFrame/DeviceFrame.tsx`, `src/components/DeviceFrame/DeviceFrame.module.css`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Set device: Desktop → playwright_screenshot → Assert desktop chrome frame visible
→ Set device: Mobile → playwright_screenshot → Assert phone frame visible with rounded corners
→ Switch client to Gmail iOS → Assert mobile auto-selected
```

**Commit**: `feat(components): add CSS-only DeviceFrame with desktop and mobile phone mockups`

---

### Task 13 — PreviewPane Component

**Files**: `src/components/PreviewPane/PreviewPane.tsx`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Load sample email
→ Switch through at least 3 clients (Gmail Web, Gmail iOS, Apple Mail)
→ Toggle Light/Dark for each
→ playwright_screenshot each combination
→ Assert: iframe srcdoc updates on each change (no stale preview)
→ Assert: no JavaScript errors in console (playwright_evaluate: window.__errors__)
```

**Commit**: `feat(components): add PreviewPane with per-client simulator dispatch and iframe injection`

---

### Task 14 — Toolbar Component

**Files**: `src/components/Toolbar/Toolbar.tsx`, `src/components/Toolbar/Toolbar.module.css`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Assert: all 9 client tabs/buttons visible
→ Click each client tab → Assert active state changes
→ Click Dark toggle → Assert mode label changes to "Dark"
→ Click Mobile toggle → Assert device frame switches
→ playwright_screenshot of full toolbar
```

**Commit**: `feat(components): add Toolbar with client selector, mode toggle, and device toggle`

---

### Task 15 — Editor Component

**Files**: `src/components/Editor/Editor.tsx`, `src/components/Editor/Editor.module.css`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ Assert: CodeMirror editor renders with HTML syntax highlighting
→ Type "<h1>Test</h1>" into editor
→ Assert: preview iframe updates to show heading
→ Click file upload button (can't test actual file dialog via Playwright — assert button is present)
→ Click "Load Sample" → Assert editor fills with sample HTML
→ playwright_screenshot
```

**Commit**: `feat(components): add Editor with CodeMirror, file upload, and sample loader`

---

### Task 16 — App Layout and Final Wiring

**Files**: `src/App.tsx`, `src/App.module.css`

**Playwright assertion**:
```
playwright_navigate http://localhost:5173
→ playwright_screenshot at 1280x800 (desktop layout)
→ Assert: editor panel left, preview panel right, toolbar above preview
→ playwright_screenshot at 375x812 (mobile viewport)
→ Assert: stacked layout, editor toggle button visible
→ Toggle editor panel open/closed → playwright_screenshot each state
→ Full end-to-end flow:
    1. Load sample email
    2. Select Gmail Android / Dark / Mobile
    3. playwright_screenshot → Assert dark phone frame with inverted email
    4. Select Apple Mail / Dark / Desktop
    5. playwright_screenshot → Assert desktop frame with CSS-based dark mode
→ Assert: no console errors throughout
```

**Commit**: `feat: complete app layout, state wiring, and end-to-end preview flow`

---

### Task 17 — Deploy Config

**Files**: `netlify.toml`, `vite.config.ts` (final base path), `README.md` (optional)

**Playwright assertion**:
```
→ Run: npm run build
→ Assert: dist/ folder created, no build errors
→ playwright_navigate to built dist/index.html (via file:// or serve -s dist)
→ playwright_screenshot → Assert app loads correctly from built assets
```

**Commit**: `chore: finalize deploy config for Netlify static hosting`

---

## Gotchas and Edge Cases

| Issue | Solution |
|---|---|
| CSP meta tags in email block injected styles | Strip `<meta http-equiv="Content-Security-Policy">` in all simulators |
| MSO conditional comments `<!--[if mso]>` | Parse and display in Outlook Desktop simulator as visible debug content |
| `u + .body` Gmail hack selectors | Wrap body content in `<u></u><div class="body" id="body">` in Gmail simulators |
| Very large emails (500KB+) | Debounce editor onChange by 300ms; use `useMemo` for transform |
| `srcdoc` with `allow-scripts` | NEVER add — email scripts must not execute |
| CSSOM `SecurityError` on style access | Regex fallback in `cssParser.ts` |
| iframe fixed height | Provide height presets (compact/normal/full) in Toolbar |
| Grayscale colors (S=0) | In colorTransform, handle undefined H, transform only L |
| Colors near threshold boundaries | Add ±0.02 buffer zone to avoid sharp transitions at L=0.30/0.70 |
| `background` shorthand with images | `parseColorValue` must extract color from `"#fff url(...) no-repeat"` |
| Alpha in `rgba()` colors | Preserve alpha in all transform outputs |

---

## Deployment

### Netlify (recommended)

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

```typescript
// vite.config.ts
export default defineConfig({
  base: './',
  plugins: [react()],
})
```

Connect GitHub repo to Netlify. Auto-deploys on push. Free tier supports unlimited bandwidth for static sites.

### GitHub Pages (alternative)

```typescript
// vite.config.ts
base: '/preview-email/'  // must match repo name
```

```json
// package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

---

## Minimal Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@uiw/react-codemirror": "^4",
    "@codemirror/lang-html": "^6",
    "@codemirror/theme-one-dark": "^6"
  },
  "devDependencies": {
    "typescript": "^5",
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "vitest": "^1",
    "gh-pages": "^6"
  }
}
```

No CSS framework. No color library. No CSS parser library. Entire transformation engine built on browser-native `DOMParser`, `XMLSerializer`, and `CSSStyleSheet` APIs.
