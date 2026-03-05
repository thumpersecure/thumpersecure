<div align="center">
  <img src="assets/neural-header.svg" width="99%" alt="THUMPERSECURE Code Cookbook" />
</div>

# THUMPERSECURE // CODE COOKBOOK

Cyberpunk-flavored portfolio + ops dashboard for OSINT, privacy tooling, and search workflow engineering.

[![Live Site](https://img.shields.io/badge/Launch_Code_Cookbook-b0ffcc?style=for-the-badge&logo=github&logoColor=0601FF&labelColor=06060F)](https://thumpersecure.github.io/thumpersecure/)
[![Profile](https://img.shields.io/badge/GitHub-thumpersecure-00b8ff?style=flat-square&logo=github&labelColor=06060F)](https://github.com/thumpersecure)
[![Pages Source](https://img.shields.io/badge/Deploy-/docs-8b5cf6?style=flat-square&labelColor=06060e)](https://github.com/thumpersecure/thumpersecure/tree/main/docs)

---

## Table of Contents

- [What this repo is](#what-this-repo-is)
- [Live experience](#live-experience)
- [Featured ecosystem](#featured-ecosystem)
- [How the site runs](#how-the-site-runs)
- [Quickstart](#quickstart)
- [Project structure](#project-structure)
- [Configuration notes](#configuration-notes)
- [Quality standards](#quality-standards)
- [Contributing](#contributing)
- [Security and responsible use](#security-and-responsible-use)
- [License](#license)

---

## What this repo is

`thumpersecure` is the main landing repo for the **Code Cookbook** site.  
It combines:

- a cinematic, interactive portfolio experience
- a static-data pipeline for repo intelligence
- practical documentation around tooling, OSINT workflows, and privacy operations

If you want the whole vibe in one line: **terminal aesthetics, production discipline, no dead dashboards**.

---

## Live experience

### Primary URL

**https://thumpersecure.github.io/thumpersecure/**

### What you get on the page

- multi-module interface with collapse/expand controls
- searchable recipe index
- hardware/security history timelines
- optional puzzle unlock flows
- adaptive audio deck (including mobile collapse toggle)
- persisted settings and resilient fallback behavior

---

## Featured ecosystem

| Project | Summary |
| --- | --- |
| [palm-tree](https://github.com/thumpersecure/palm-tree) | High-volume traffic-noise generation with personas, chaos modes, and geo rotation. |
| [Telespot](https://github.com/thumpersecure/Telespot) | Phone-number OSINT CLI across multiple public sources. |
| [Spin](https://github.com/thumpersecure/Spin) | Desktop browser focused on privacy-first OSINT workflows. |
| [opt-out-manual-2026](https://github.com/thumpersecure/opt-out-manual-2026) | Practical opt-out guide for people-search and data-broker ecosystems. |

### Telespot pipeline

```text
Telespot (CLI) -> Telespotter (Rust) -> TelespotXX (Web)
                          |
                          +-> xTELENUMSINT (Chrome extension)
                          +-> TeleSTOP (Desktop opt-out)
```

---

## How the site runs

This site is intentionally static at runtime and dynamic at build time.

### Data path

1. `scripts/build_snapshot.js` pulls profile + repo data from GitHub.
2. It writes a validated snapshot to `docs/data/site_snapshot.json`.
3. Frontend loads data through a layered path:
   - fresh snapshot
   - localStorage cache
   - embedded fallback

Result: the interface stays operational even when networks, APIs, or rate limits get noisy.

### Runtime highlights

- stateful UI controls with local preference memory
- animated modules with reduced-motion support
- graceful audio fallback strategy
- structured metadata for SEO and sharing cards

---

## Quickstart

### Prerequisites

- Node.js 18+ (for snapshot generation)
- Python 3 (optional, for local static serving)

### 1) Clone

```bash
git clone https://github.com/thumpersecure/thumpersecure.git
cd thumpersecure
```

### 2) Build a fresh snapshot (optional but recommended)

```bash
GITHUB_TOKEN=your_token_here node scripts/build_snapshot.js
```

`GITHUB_TOKEN` is optional, but helps avoid low API rate limits.

### 3) Run locally

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080/docs/
```

---

## Project structure

```text
.
├─ README.md
├─ assets/                     # profile/readme visual assets
├─ docs/                       # GitHub Pages source (site root)
│  ├─ index.html               # main app
│  ├─ data/site_snapshot.json  # generated snapshot
│  ├─ assets/audio/README.md   # audio setup notes
│  ├─ QA_CHECKLIST.md          # manual QA checks
│  └─ PAGES.md                 # GitHub Pages deployment notes
├─ scripts/
│  └─ build_snapshot.js        # snapshot builder
└─ telespot-numsint/           # extension subproject
```

---

## Configuration notes

### GitHub Pages

Deploy from:

- **Branch:** `main`
- **Folder:** `/docs`

Reference: [`docs/PAGES.md`](docs/PAGES.md)

### Audio tracks

- local files can live in `docs/` or `docs/assets/audio/`
- track fallbacks are built in when files are missing

Reference: [`docs/assets/audio/README.md`](docs/assets/audio/README.md)

### User settings

Interface preferences persist under:

```text
localStorage key: ts_cookbook_settings
```

---

## Quality standards

Before shipping visual or behavior changes, run through:

- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md)

Priority checks:

- data hydration and fallback integrity
- keyboard and accessibility flow
- mobile responsiveness (especially top control bar)
- no console errors

---

## Contributing

Contributions are welcome, especially around:

- UX polish and accessibility improvements
- performance and rendering efficiency
- historical/security content quality
- documentation clarity

Recommended flow:

1. Fork + branch
2. Keep changes focused and reviewable
3. Include before/after notes for UI-impacting edits
4. Open a PR with clear testing steps

---

## Security and responsible use

Some linked tools and workflows are dual-use.  
Use them lawfully, ethically, and with proper authorization.

- Do not target systems or people without permission.
- Respect platform policies, local laws, and disclosure norms.

---

## License

No repository-wide license file is currently present.

If you plan to reuse code/assets beyond normal GitHub use, open an issue first to confirm permissions.

---

<sub>Built for operators who like signal over noise.</sub>
