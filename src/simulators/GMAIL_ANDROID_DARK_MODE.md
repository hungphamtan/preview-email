# Gmail Android Dark Mode Simulator — Logic Guide

## Overview

This simulator replicates Android WebView's **Force Dark** algorithm as used by the Gmail app on Android. Unlike iOS full inversion or Apple Mail's `prefers-color-scheme` approach, Android Force Dark performs a **partial/smart inversion** — selectively darkening light backgrounds and lightening dark text while preserving saturated colors and handling images based on size heuristics.

## Pipeline

The transform runs four passes on the parsed HTML DOM, in order:

### 1. Strip Dark Media Rules

```
stripDarkMediaRules(html)
```

Gmail Android **ignores `prefers-color-scheme` entirely**. Any `@media (prefers-color-scheme: dark)` blocks in the email's `<style>` are stripped so the browser iframe doesn't activate them and override our transforms.

CSP `<meta>` tags are also removed to prevent them from blocking injected styles.

### 2. Transform Inline Style Colors

Iterates every element with a `style` attribute and transforms color values:

#### Background Colors (`background`, `background-color`, `bgcolor`)

- **Saturation check (s > 0.25)**: Saturated/colored backgrounds (buttons, badges, accent cells) are **preserved unchanged**. The threshold of 0.25 catches near-neutral dark blues/grays that should still be darkened.
- **Near-white (L > 0.80)** → Material Dark surface `L = 0.07` (~`#121212`)
- **Light gray (L > 0.50)** → `L = original × 0.15`
- **Medium gray (L > 0.30)** → `L = original × 0.25`
- **Already dark (L ≤ 0.30)** → preserved

#### Text Colors (`color`)

- **Highly saturated text (s > 0.35)**: Colored text (links, accent labels) is preserved. However, if the lightness is too low (`L < 0.45`), it gets a **lightness boost** to ensure readability on dark backgrounds. The hue and saturation are preserved.
- **Near-black text (L < 0.30)** → near-white `L = 0.87`
- **Mid-gray text (L < 0.55)** → lightened proportionally: `L = 0.55 + (0.55 - L) × 0.35`
- **Already light (L ≥ 0.55)** → preserved

### 3. Transform HTML Attribute Colors

Processes legacy `bgcolor` attributes on `<table>`, `<td>`, `<tr>`, `<th>`, and `<body>` elements using the same background color transform.

### 4. Image Handling

Android Force Dark treats images differently based on their characteristics:

| Condition | Treatment | Rationale |
|-----------|-----------|-----------|
| `.jpg` / `.jpeg` source | **Skip** | Photographic content — inversion would look wrong |
| Both width AND height > 200px | **Skip** | Large/hero images — likely photos or complex graphics |
| Max dimension ≤ 50px | `filter: invert(1) hue-rotate(180deg)` | Small square icons (app icons with dark bg) — full bitmap inversion |
| Other small images (> 50px, ≤ 200px) | `mix-blend-mode: normal` | Logos/banners with white bg — allows the dark container background to show naturally |

**Why two strategies?**
- Small **app icons** typically have dark/transparent backgrounds. Full inversion correctly flips them for dark mode.
- Larger **logos** often have opaque white backgrounds with dark text. Full inversion would create high-contrast white-on-black text that doesn't match real device behavior. Using `mix-blend-mode: normal` preserves the original appearance while the container background handles the dark surface.

### 5. Injected Styles

```css
html {
  color-scheme: light !important;
}
html, body {
  background-color: #121212 !important;
  color: #e5e5ea !important;
}
```

- **`color-scheme: light`** prevents the browser from applying its own auto-dark-mode to CSS `<style>` block colors (e.g., link colors).
- **`#121212`** matches Android's Material Dark theme surface color.

## Color Transform Summary

All color transforms operate in **HSL color space**:

```
Input Color
    │
    ├─ passthrough values (transparent, inherit, etc.) → unchanged
    │
    ├─ Background
    │   ├─ saturated (s > 0.25) → unchanged
    │   ├─ near-white (L > 0.80) → L = 0.07
    │   ├─ light gray (L > 0.50) → L = L × 0.15
    │   ├─ medium gray (L > 0.30) → L = L × 0.25
    │   └─ already dark (L ≤ 0.30) → unchanged
    │
    └─ Text
        ├─ saturated (s > 0.35)
        │   ├─ dark (L < 0.45) → boost L, preserve hue
        │   └─ light enough → unchanged
        ├─ near-black (L < 0.30) → L = 0.87
        ├─ mid-gray (L < 0.55) → proportional lighten
        └─ already light (L ≥ 0.55) → unchanged
```

## Key Differences from Other Simulators

| Behavior | Gmail Android | iOS Full Inversion | Apple Mail |
|----------|--------------|-------------------|------------|
| Dark media queries | **Ignored** (stripped) | Ignored | **Respected** |
| Background transform | Selective (neutral only) | All backgrounds | Via `prefers-color-scheme` |
| Text transform | Selective + boost | Full inversion | Via `prefers-color-scheme` |
| Colored elements | Preserved | Inverted | Author-controlled |
| Image handling | Size-based heuristics | Full inversion | Author-controlled |
| Surface color | `#121212` (Material Dark) | System dark | System dark |

## Validation Checklist

When testing changes to this simulator:

- [ ] White/light email backgrounds render as near-black (`#121212`)
- [ ] Dark text (headings, body) renders as near-white
- [ ] Colored buttons/badges preserve their original colors
- [ ] Colored text links remain colored but readable on dark bg
- [ ] Small app icons (≤ 50px) appear correctly inverted
- [ ] Logos with white backgrounds blend naturally (no bright box)
- [ ] JPEG photos are NOT inverted
- [ ] Large hero images are NOT inverted
- [ ] No visible "box" artifacts between container and body backgrounds
