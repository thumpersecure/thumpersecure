# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This repository is the **THUMPERSECURE Code Cookbook** — a cyberpunk-themed GitHub Pages portfolio/hub site for OSINT and privacy tools. It consists of two deliverables:

1. **Code Cookbook site** (`/docs/`) — a static single-page site (vanilla HTML/CSS/JS, no bundler/framework). Served from `/docs` via GitHub Pages.
2. **TELESPOT-NUMSINT Chrome extension** (`/telespot-numsint/`) — a Manifest V3 Chrome extension for phone-number OSINT searches.

### Running the site locally

Serve the `/docs` folder with any static HTTP server:

```
python3 -m http.server 8080 --directory docs
```

Then open `http://localhost:8080/` in a browser.

### Data snapshot

`node scripts/build_snapshot.js` fetches repo metadata from the GitHub API and writes `docs/data/site_snapshot.json`. A `GITHUB_TOKEN` env var is optional (raises rate limits). The site has multi-tier fallback: cached snapshot, `fallback-snapshot.json`, then embedded minimal data — so the page renders even without running the build script.

### Linting / testing

There is no formal linter or test suite configured. The QA checklist in `docs/QA_CHECKLIST.md` describes manual checks. To validate the build script, run `node scripts/build_snapshot.js` and confirm it exits 0 with valid JSON output.

### Gotchas

- The console shows a non-critical `ReferenceError: iPX is not defined` in `app.js` — this does not affect site functionality.
- The CSP meta tag warning about `frame-ancestors` being ignored in `<meta>` is expected browser behavior and harmless.
- The Chrome extension (`telespot-numsint/`) must be loaded as an unpacked extension in Chrome — it cannot be tested via a local HTTP server.
- There is no `package.json` or dependency lockfile. The only Node.js dependency is `https` (built-in). No `npm install` is needed.
