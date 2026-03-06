# QA Checklist — Code Cookbook

## Build & Assets
- [ ] `css/styles.css` loads without 404
- [ ] `js/app.js` loads without 404
- [ ] `data/site_snapshot.json` loads (or graceful fallback)
- [ ] `data/fallback-snapshot.json` loads as secondary fallback
- [ ] No console errors on fresh load
- [ ] No mixed-content warnings (all HTTPS)

## Core Data Pipeline
- [ ] Stats bar shows correct tool/stars/featured/follower counts (not zeros)
- [ ] Recipe index renders from snapshot (never stuck on "Loading...")
- [ ] Featured recipes section renders from snapshot data
- [ ] Search/filter works on recipe index (by name, description, language)
- [ ] Data status line shows snapshot date or fallback indicator
- [ ] Dev mode toggle forces embedded fallback data
- [ ] Offline: page still renders from embedded minimal fallback

## Section Order & Navigation
- [ ] Modules appear in category order: History → Gate → Intel → Tools → Hardware
- [ ] Category group headings visible between groups
- [ ] `#recipes` anchor link from hero navigates to correct section
- [ ] Footer anchor links (#ingredients, #quotes, #glossary, #zines) work
- [ ] All module IDs preserved (mod-lockhistory, mod-archives, etc.)

## Music & Audio
- [ ] Mute toggle instantly silences/restores audio
- [ ] Track 1 (Tron) attempts autoplay on load
- [ ] If autoplay blocked, "tap to play" banner appears
- [ ] Track selection works for all 3 tracks
- [ ] Playlist auto-advances when a track ends
- [ ] Next button advances to next track
- [ ] Mute state and track index persist across page loads
- [ ] Missing audio file shows helpful message (not broken UI)

## Collapsible Modules
- [ ] All 13 ts-module sections are collapsible with animation
- [ ] Each shows 1-2 line summary when collapsed
- [ ] Expand All / Collapse All buttons work
- [ ] Module state toggles via Enter/Space on keyboard
- [ ] Animations respect prefers-reduced-motion

## AI Defense Effects
- [ ] Toasts appear every 15-45 seconds when enabled
- [ ] All toasts labeled [SIMULATION] or [DEMO]
- [ ] Toasts are non-blocking and dismissible
- [ ] Effects On/Off toggle works and persists
- [ ] Max 2 toasts visible at once
- [ ] Scroll-triggered toasts fire for each section once (including field intel)

## Puzzles (A-F + Bottom)
- [ ] Puzzle E (Word Unscramble Grid): click 3 highlighted cells in order
- [ ] Puzzle F (Math Challenge): pick correct answer (11)
- [ ] Puzzle A (Terminal Checksum): click 3 highlighted chars
- [ ] Puzzle B (Pattern Match): pick correct repo (palm-tree)
- [ ] Puzzle C (Decrypt Slider): align hex dials to target
- [ ] Puzzle D (Port Scan): toggle correct ports open
- [ ] Bottom puzzle (RX Transmission): always shows on page reload
- [ ] Bottom puzzle: dismissed state clears on new page load (sessionStorage)
- [ ] All puzzle unlock states persist in localStorage
- [ ] Reset Puzzles button clears all puzzle + RX state and reloads
- [ ] Skip buttons work for all puzzles

## Hacker Field Intel Pager
- [ ] Module expands/collapses like other ts-modules
- [ ] All 24 pager entries render with color-coded category bars
- [ ] Pager beacon pulses green
- [ ] Tron trace animation runs across pager header
- [ ] Pager body scrolls with styled scrollbar
- [ ] External links open in new tab with noopener noreferrer
- [ ] Scroll toast fires when section enters viewport

## Security
- [ ] CSP meta tag present and correct
- [ ] All external links have rel="noopener noreferrer"
- [ ] safeUrl() rejects javascript: and data: URIs
- [ ] No inline event handlers use unsanitized data
- [ ] Fallback JSON contains no executable content

## Accessibility
- [ ] All interactive elements keyboard-focusable
- [ ] Visible focus rings on :focus-visible
- [ ] aria-expanded on all collapsible headers
- [ ] aria-live on dynamic content (data status, music status, toasts, puzzle status)
- [ ] Decorative elements have aria-hidden="true"
- [ ] Reduced motion disables: glitch, canvas rain, sweep, boot, all CSS animations
- [ ] One H1 element with structured H2/H3 hierarchy
- [ ] Pager body has role="region" and tabindex for keyboard scroll

## Mobile (< 640px)
- [ ] All touch targets >= 44px (buttons, puzzle cells, toggles)
- [ ] No horizontal overflow / scroll
- [ ] Music panel toggle shows/hides correctly
- [ ] NFO blocks wrap properly (no clipped text)
- [ ] Lock history tables scroll horizontally
- [ ] Hardware timeline scrolls horizontally
- [ ] Settings panel fits viewport
- [ ] Boot screen readable on small screens
- [ ] Pager entries readable with smaller padding/font

## Performance
- [ ] No external API calls block page render
- [ ] Canvas animations use requestAnimationFrame
- [ ] Intersection observers lazy-load terminal and bottom puzzle
- [ ] Total JS payload < 50KB (no heavy libraries)
- [ ] CSS and JS are separate cacheable files
- [ ] Font preload hint present

## SEO & Meta
- [ ] sitemap.xml accessible and valid
- [ ] robots.txt accessible
- [ ] Open Graph tags present and correct
- [ ] Twitter card tags present
- [ ] JSON-LD structured data present
- [ ] Canonical URL correct
