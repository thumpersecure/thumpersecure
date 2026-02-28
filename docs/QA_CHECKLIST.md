# QA Checklist — Code Cookbook

## Core Data
- [ ] Page loads and shows correct tool/stars/featured/follower counts (not zeros)
- [ ] Recipe index renders from snapshot (never stuck on "Fetching...")
- [ ] Search/filter works on recipe index (by name, description, language)
- [ ] Data status line shows snapshot date or "offline snapshot" indicator
- [ ] Featured recipes section renders from snapshot data

## Music
- [ ] Mute toggle at top: instantly silences/restores audio
- [ ] Track 1 (Tron local file) attempts autoplay on load
- [ ] If autoplay blocked, "tap to play" banner appears
- [ ] Track selection works for all 3 tracks
- [ ] Playlist auto-advances when a track ends
- [ ] Next button advances to next track
- [ ] Mute state and track index persist in localStorage
- [ ] If audio file missing, shows helpful message (not broken UI)

## Collapsible Modules
- [ ] 8 sections are collapsible with animation
- [ ] Each shows 1-2 line summary when collapsed
- [ ] Expand All / Collapse All button works
- [ ] Module state toggles via Enter/Space on keyboard
- [ ] Animations respect prefers-reduced-motion

## AI Defense Effects
- [ ] Fictional toasts appear every 15-45 seconds when enabled
- [ ] All toasts clearly labeled [SIMULATION] or [DEMO]
- [ ] Toasts are non-blocking and dismissible
- [ ] Effects On/Off toggle works and persists
- [ ] Max 2 toasts visible at once
- [ ] Reduced motion: toasts appear without slide animation

## Puzzles
- [ ] "Play to Unlock" opt-in button available
- [ ] "Skip / Show Everything" reveals all content
- [ ] Puzzle A (Terminal Checksum): click 3 highlighted chars
- [ ] Puzzle B (Pattern Match): pick correct repo from hint
- [ ] Puzzle C (Decrypt Slider): align dials to match target
- [ ] Existing bottom-scroll puzzle still works
- [ ] Unlock state persists in localStorage
- [ ] Reset Puzzles button clears all puzzle state

## Accessibility
- [ ] All interactive elements keyboard-focusable
- [ ] Visible focus rings on focus-visible
- [ ] aria-expanded on collapsible headers
- [ ] aria-live on dynamic content (data status, music status, toasts)
- [ ] Decorative elements have aria-hidden="true"
- [ ] Reduced motion disables: glitch, canvas rain, sweep, boot sequence animations
- [ ] Contrast: all text meets WCAG AA (4.5:1 normal, 3:1 large)

## Performance
- [ ] No external API calls block page render
- [ ] Canvas animations start only when in viewport
- [ ] No console errors
- [ ] Total JS payload reasonable (no heavy libraries)
- [ ] Mobile: responsive layout, touch targets ≥ 44px

## Settings
- [ ] Settings gear icon opens panel
- [ ] Effects toggle in settings
- [ ] Dev mode toggle forces fallback data
- [ ] All settings under ts_cookbook_settings localStorage key

## SEO
- [ ] sitemap.xml accessible
- [ ] robots.txt accessible
- [ ] One H1 element, structured H2/H3 hierarchy
- [ ] Open Graph tags present and correct
- [ ] JSON-LD structured data present
