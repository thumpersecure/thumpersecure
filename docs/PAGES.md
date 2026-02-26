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

## How to set it

1. Go to **Settings → Pages** in your GitHub repo
2. Under **Build and deployment**, set **Source** to "Deploy from a branch"
3. Set **Branch** to `main` and **Folder** to `/docs`
4. Save

## Alternative: Deploy from root

If you prefer to deploy from the repo root instead:

- **Folder:** `/ (root)`
- **URL:** `https://thumpersecure.github.io/thumpersecure/docs/`

Then you would need to update all links in `docs/index.html` and `README.md` to use `/docs/` in the path.
