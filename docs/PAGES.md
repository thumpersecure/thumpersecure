# GitHub Pages Setup

## Configuration

**Source:** Deploy from a branch  
**Branch:** `main` (or your default branch)  
**Folder:** `/docs`

## URL

When configured as above, the site is served at:

```
https://thumpersecure.github.io/thumpersecure/
```

The `/docs` folder contents become the site root — no `/docs/` in the URL path.

## File Structure

```
docs/
├── index.html              Main page (restructured section order)
├── css/
│   └── styles.css          All site styles (extracted from inline)
├── js/
│   └── app.js              All site logic (extracted from inline)
├── data/
│   ├── site_snapshot.json   Live snapshot (updated by CI)
│   ├── fallback-snapshot.json  Static fallback data
│   └── og-placeholder.svg  Open Graph image
├── assets/
│   └── audio/
│       └── README.md
├── PAGES.md                This file
├── QA_CHECKLIST.md         Testing checklist
├── robots.txt
└── sitemap.xml
```

## Section Order

Modules are grouped into five narrative categories:

| Group | Modules |
|:---|:---|
| **History & Culture** | lock_history, the_archives, cinema, evolution |
| **Interactive Gate** | preflight_puzzles |
| **Threat Intelligence** | latest_cves, threat_glossary, zines |
| **Tools & Recipes** | featured_recipes, recipe_index, osint_tools, terminal, ingredients |
| **Wisdom & Hardware** | legendary_quotes, hardware_history |

## How to set it

1. Go to **Settings → Pages** in your GitHub repo
2. Under **Build and deployment**, set **Source** to "Deploy from a branch"
3. Set **Branch** to `main` and **Folder** to `/docs`
4. Save
