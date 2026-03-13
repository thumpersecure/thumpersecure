# Mobile Optimization Audit Report

**Files audited:**
- `docs/css/styles.css` (1217 lines)
- `docs/index.html` (1271 lines)

**Date:** 2026-03-13

---

## 1. Touch Targets (buttons/links smaller than 44x44px)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 1.1 | styles.css | 960 | `.top-toggle-btn` at 640px gets `min-height:36px` — still below the 44px WCAG minimum | **High** | Change to `min-height:44px` |
| 1.2 | styles.css | 955 | `.settings-toggle` at 640px gets `min-height:28px` — well below 44px | **High** | Change to `min-height:44px` |
| 1.3 | styles.css | 1098 | `.cve-more-btn` has `padding:0.3rem 0.7rem` with no mobile size override | **High** | Add `min-height:44px` in the 640px breakpoint |
| 1.4 | styles.css | 1106 | `.cve-modal-close` has `padding:0.2rem` with no mobile size override | **High** | Add `min-width:44px;min-height:44px` in the 640px breakpoint |
| 1.5 | styles.css | 736 | `.cb-close` is `width:40px;height:36px` — no mobile override to reach 44px | **Medium** | Add mobile override to 44x44 |
| 1.6 | styles.css | 526 | `.back-to-top-btn` has `padding:0.5rem 0.75rem` with no `min-height` on mobile | **Medium** | Add `min-height:44px` in the 640px breakpoint |
| 1.7 | styles.css | 225 | `.music-mute-btn` is 38x38 at default; fixed to 44px at 640px (line 957) but undersized at 641-860px | **Low** | Move the 44px fix to the 860px breakpoint |
| 1.8 | styles.css | 265 | `.music-next-btn` default `padding:0.2rem 0.5rem` is tiny; fixed at 640px only | **Low** | Apply 44px minimum at 860px |

## 2. Viewport Issues (content overflow, horizontal scroll)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 2.1 | index.html | 5 | Viewport meta missing `viewport-fit=cover` — on notched iPhones content can be clipped | **High** | Change to `content="width=device-width, initial-scale=1, viewport-fit=cover"` |
| 2.2 | styles.css | (none) | No `env(safe-area-inset-*)` padding anywhere. Fixed elements can be hidden behind notch/home indicator | **High** | Add safe-area padding to `.top-bar-wrap`, `.back-to-top-btn`, `.pi-link`, `.fx-toast-container` |
| 2.3 | styles.css | 465 | `.ingredient-code` has `white-space:pre;overflow-x:auto` but no `pre-wrap` mobile override | **Medium** | Add `white-space:pre-wrap;word-break:break-all` at 640px |
| 2.4 | styles.css | 654 | `.pf-code` — `overflow-x:auto` but no wrapping override for mobile | **Medium** | Add `white-space:pre-wrap` at 640px |
| 2.5 | styles.css | 502 | `.term-visual` has `overflow-x:auto` but no `pre-wrap` at mobile widths | **Low** | Add `white-space:pre-wrap` at 640px |
| 2.6 | styles.css | 967-968 | Duplicate `body{overflow-x:hidden}` and `.page-wrap{overflow-x:hidden}` | **Low** | Remove duplicate; consider `overflow-x:clip` |

## 3. Font Sizing (text too small on mobile)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 3.1 | styles.css | 1203 | `.pager-status` overridden to `font-size:0.35rem` (5.6px) | **Critical** | Minimum 0.625rem (10px) |
| 3.2 | styles.css | 852 | `.music-vibe` at 640px becomes `0.42rem` (6.72px) | **Critical** | Minimum 0.625rem |
| 3.3 | styles.css | 1209 | `.pager-count,.pager-sig` overridden to `0.38rem` (6.08px) | **Critical** | Minimum 0.625rem |
| 3.4 | styles.css | 1202 | `.pager-title` overridden to `0.45rem` (7.2px) | **High** | Minimum 0.625rem |
| 3.5 | styles.css | 847 | `.top-bar-label` at 640px becomes `0.46rem` (7.36px) | **High** | Minimum 0.625rem |
| 3.6 | styles.css | 138 | `.boot-k` is `0.54rem` (8.64px) — boot screen key labels very hard to read | **High** | At least 0.625rem for mobile |
| 3.7 | styles.css | 114 | `.ra-analyze-text` is `0.55rem` (8.8px) | **Medium** | Use `clamp(0.65rem,...)` |
| 3.8 | styles.css | 116 | `.ra-analyze-lines span` is `0.58rem` (9.28px) | **Medium** | Use `clamp(0.65rem,...)` |
| 3.9 | styles.css | 129, 307, 444 | `.boot-pane-meta` (0.58rem), `.data-status` (0.62rem), `.mon-label` (0.5rem) | **Medium** | Bump to at least 0.65rem |
| 3.10 | styles.css | 1176 | `.pager-device-statusbar` uses 'Press Start 2P' at `0.4rem` (6.4px) | **High** | Minimum 0.55rem for pixel fonts |

## 4. Layout Issues (elements overlapping or not fitting)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 4.1 | styles.css | 559, 685 | `#inviteForgeCanvas` height is 540px/420px with no 640px reduction — takes >50% of mobile viewport | **High** | Add `height:280px` or `height:50vh` at 640px |
| 4.2 | styles.css | 639 | `.packet-overlay-info` has `padding:1.5rem 2rem` with no mobile adjustment — SRC/DST labels can overlap | **Medium** | Reduce padding at 640px |
| 4.3 | styles.css | 216-217 | Fixed `.top-bar-wrap` + expanded music panel on mobile can cover 200px+ of viewport | **High** | Collapse music panel by default on mobile or add `max-height` with scroll |
| 4.4 | styles.css | 843 | `.hero` at 640px has `padding:9.2rem 0 2rem` — may not be enough if top bar grows taller | **Medium** | Increase or compute dynamically |
| 4.5 | styles.css | 1090-1092 | `.cinema-quote-grid` jumps from 4→2→1 columns with no 768px intermediate step | **Low** | Add a 768px breakpoint |

## 5. Performance (heavy animations on mobile)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 5.1 | styles.css | 22-24 | Three full-screen `<canvas>` elements rendered on mobile, each with JS animation loop | **Critical** | Hide with `display:none` at `max-width:768px` |
| 5.2 | styles.css | 70-80 | Six floating `.orb` elements continuously animate on infinite loops | **High** | Hide `.data-orbs` on mobile |
| 5.3 | styles.css | 83-86 | `.holographic-vignette` runs animation over full viewport — pure decoration | **Medium** | Hide on mobile |
| 5.4 | styles.css | 177 | `.glass::before` runs `tronTrace` on every glass panel (dozens) | **High** | `animation:none` at 640/768px |
| 5.5 | styles.css | 25-30 | `.crt` and `.scanline-overlay` are full-viewport overlays composited every frame | **Medium** | Hide on mobile |
| 5.6 | styles.css | 31-34 | `.sweep` animates across full width every 8 seconds | **Low** | Hide on mobile |
| 5.7 | styles.css | 1160 | `.ingredient-code::after` runs `codeGlow` on every code block | **Low** | Disable on mobile |
| 5.8 | styles.css | 1002-1019 | `prefers-reduced-motion` only fires when OS setting is enabled — mobile users without it still get all animations | **Medium** | Add dedicated mobile animation reduction |

## 6. Missing Responsive Breakpoints

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 6.1 | styles.css | 667 | `.threat-lab-grid` is 3 columns, drops to 1fr at 1024px only | **Medium** | Add 768px (2col) and 640px (1col) |
| 6.2 | styles.css | 646-647 | `.packet-forensic-grid` — no canvas height reduction at 640px | **Low** | Add canvas height reduction |
| 6.3 | styles.css | 1063-1064 | `.investigator-grid` — 9 cards in single column makes very long section | **Low** | Consider keeping 2 columns to 480px |

## 7. Canvas Sizing

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 7.1 | index.html:771 / styles.css:657 | `#stegoCanvas` has fixed 220×140 with `display:inline-block` container — not responsive or centered | **Medium** | Add `max-width:100%;display:block;margin:0 auto` |
| 7.2 | styles.css | 559, 685 | `#inviteForgeCanvas` 420px at 768px, no 640px reduction | **High** | Add 640px breakpoint |
| 7.3 | styles.css | 638 | `#packetGridCanvas` fixed at 320px height with no mobile reduction | **Medium** | Reduce to 200px at 640px |

## 8. Accessibility

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 8.1 | index.html | (none) | No skip-to-content link — users must tab through entire control bar | **High** | Add skip link as first child of `<body>` |
| 8.2 | styles.css | 25-30 | CRT/scanline overlays reduce contrast and readability | **Medium** | Hide on mobile or reduce opacity |
| 8.3 | (multiple) | (see §3) | Many font sizes below 10px are WCAG readability failures | **High** | See Font Sizing section |
| 8.4 | index.html | 304 | Puzzle skip button uses inline `onclick` — no fallback if JS fails | **Low** | Add href fallback |
| 8.5 | styles.css | 698-701 | `.settings-toggle` at 20px height — hard to operate via switch controls | **Medium** | Increase height on mobile |

## 9. CSS Specificity Issues

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 9.1 | styles.css | 902-942, 1021-1033, 1199-1210 | `.pager-wrap` and children defined three times with cascading overrides | **High** | Consolidate into one block |
| 9.2 | styles.css | 842, 945, 1212 | Three separate `@media(max-width:640px)` blocks | **Medium** | Merge into one |
| 9.3 | styles.css | 18, 967 | Duplicate `body{overflow-x:hidden}` | **Low** | Remove duplicate |
| 9.4 | styles.css | 525, 710 | `.cb-bottom-sentinel` defined twice | **Low** | Remove duplicate |

## 10. Image/Asset Optimization

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 10.1 | styles.css | 1 | `@import url(...)` for 'Press Start 2P' is **render-blocking** | **High** | Move to `<link>` tag in HTML |
| 10.2 | index.html | 29-30 | Three Google Font families loaded — 200-400ms+ latency on mobile | **Medium** | Subset fonts, use `font-display:optional` for decorative fonts |
| 10.3 | index.html | 130-158 | Large inline SVG for decorative background in every page load | **Low** | Move to external file loaded lazily |

## 11. Scroll Behavior

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 11.1 | styles.css | 911 | `.pager-body` scrollable without `overscroll-behavior:contain` — scroll chains to body | **Medium** | Add `overscroll-behavior:contain` |
| 11.2 | styles.css | 131 | `.boot-log` — same issue | **Medium** | Add `overscroll-behavior:contain` |
| 11.3 | styles.css | 739 | `.cb-body` — same issue | **Medium** | Add `overscroll-behavior:contain` |
| 11.4 | styles.css | 963, 965 | Deprecated `-webkit-overflow-scrolling:touch` | **Low** | Remove |
| 11.5 | styles.css | 692 | `.settings-panel` — no `overscroll-behavior:contain` | **Low** | Add `overscroll-behavior:contain` |

## 12. Fixed Positioning Issues

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 12.1 | styles.css | 216-217, 843 | Fixed top bar + expanded music panel covers 200px+ of mobile viewport | **High** | Collapse music panel by default or cap height |
| 12.2 | styles.css | 526, 994 | `.back-to-top-btn` and `.pi-link` can overlap with `.fx-toast-container` and `.cb-toast` | **Medium** | Add offset to avoid stacking |
| 12.3 | styles.css | 83, 25, 28 | Full-viewport decorative overlays at z-index 996-999 paint every frame | **Medium** | Hide on mobile |

## 13. Input Handling (virtual keyboard, iOS zoom)

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 13.1 | styles.css | 354 | `.search-input` `font-size:0.82rem` (13.12px) — iOS auto-zooms below 16px | **Critical** | Set `font-size:1rem` on mobile |
| 13.2 | styles.css | 755 | `.cb-input` `font-size:0.78rem` (12.48px) — same iOS zoom issue | **Critical** | Set `font-size:1rem` on mobile |
| 13.3 | styles.css | 595 | `.dial-input` `font-size:0.9rem` (14.4px) — same issue | **High** | Set `font-size:1rem` on mobile |
| 13.4 | styles.css | (none) | No `touch-action` properties anywhere | **Medium** | Add `touch-action:none` to interactive canvases; `touch-action:pan-y` to scrollable code blocks |

## 14. Orientation Change Handling

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 14.1 | styles.css | (none) | No `@media(orientation:landscape)` queries. Hero `min-height:100vh` takes entire screen in landscape | **High** | Add landscape override: `min-height:auto` |
| 14.2 | styles.css | 421, 882 | `.term-body` height 54vh in landscape takes most of the short viewport | **Medium** | Add landscape max-height |
| 14.3 | styles.css | 559, 685 | `#inviteForgeCanvas` at 420-540px height takes most of landscape viewport | **Medium** | Reduce height in landscape |
| 14.4 | styles.css | (none) | Fingerprint scanner `aspect-ratio:1` could be oversized in landscape | **Medium** | Limit `max-height:50vh` in landscape |

## 15. Additional CSS Issues

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 15.1 | styles.css | 113 | `.ra-analyze-bar` animates `width` — triggers layout reflow | **Medium** | Use `transform:scaleX()` instead |
| 15.2 | styles.css | 157 | `#fingerprintProgressFill` transitions `width` — triggers layout | **Medium** | Use `transform:scaleX()` with `transform-origin:left` |
| 15.3 | styles.css | (none) | No `will-change` on continuously-animated elements | **Medium** | Add `will-change:transform` (or disable on mobile) |
| 15.4 | styles.css | 407 | `-webkit-line-clamp` / `-webkit-box-orient` without standard equivalent | **Low** | Acceptable; no action needed |
| 15.5 | styles.css | 396 | `.project-card` starts `opacity:0` — if JS fails, cards are invisible | **Medium** | Add noscript fallback |
| 15.6 | styles.css | 1 | Render-blocking `@import` (see 10.1) | **High** | Move to `<link>` |
| 15.7 | styles.css | 963, 965 | Deprecated `-webkit-overflow-scrolling:touch` | **Low** | Remove |

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| **Critical** | 5 |
| **High** | 18 |
| **Medium** | 24 |
| **Low** | 12 |
| **Total** | **59** |

## Top 5 Priorities for Immediate Fix

1. **iOS input zoom** — inputs with `font-size < 16px` (13.1, 13.2, 13.3)
2. **Illegible text** — fonts below 7px on pager elements (3.1, 3.2, 3.3)
3. **Canvas/animation performance** — three full-screen canvases + dozens of infinite animations on mobile (5.1, 5.4)
4. **Missing `viewport-fit=cover` and `safe-area-inset`** for notched devices (2.1, 2.2)
5. **Fixed top bar covering content** when music panel is expanded on mobile (12.1)
