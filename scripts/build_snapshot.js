#!/usr/bin/env node
/**
 * build_snapshot.js
 * Fetches public GitHub repos for thumpersecure and writes static JSON snapshots
 * for the Code Cookbook site.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/build_snapshot.js
 *
 * The GITHUB_TOKEN env var is optional but recommended (higher rate limit).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const USERNAME = 'thumpersecure';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'data', 'site_snapshot.json');
const FALLBACK_OUTPUT_PATH = path.resolve(__dirname, '..', 'docs', 'data', 'fallback-snapshot.json');
const INDEX_PATH = path.resolve(__dirname, '..', 'docs', 'index.html');
const SITEMAP_PATH = path.resolve(__dirname, '..', 'docs', 'sitemap.xml');
const EXCLUDE_REPOS = new Set(['thumpersecure', 'pineapple-picopager', 'JlegaL', 'greystar-bob-faith']);
const FEATURED_REPOS = new Set(['palm-tree', 'Telespot', 'Spin', 'opt-out-manual-2026']);
/** Extra repos to include even if not yet on GitHub (e.g. new/upcoming projects). */
const EXTRA_REPOS = [
  {
    name: 'quevidkit',
    description: 'Queue-based video toolkit for OSINT and investigative workflows.',
    topics: ['osint', 'video', 'investigation'],
    stars: 0,
    last_updated: new Date().toISOString(),
    language: null,
    homepage: null,
    html_url: 'https://github.com/thumpersecure/quevidkit',
    featured: false,
  },
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'thumpersecure-snapshot-builder',
      'Accept': 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const req = https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location).then(resolve, reject);
        return;
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ data: JSON.parse(body), headers: res.headers });
          } catch (e) {
            reject(new Error(`JSON parse error from ${url}: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} from ${url}: ${body.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
    req.setTimeout(15000);
  });
}

function ensureDirectory(filePath) {
  const outDir = path.dirname(filePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
}

function snapshotJson(snapshot) {
  return JSON.stringify(snapshot, null, 2) + '\n';
}

function inlineSnapshotJson(snapshot) {
  return JSON.stringify(snapshot).replace(/</g, '\\u003c');
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function padNfo(value, width) {
  value = String(value == null ? '' : value);
  return value.length >= width ? value.slice(0, width) : value + ' '.repeat(width - value.length);
}

function buildNfoText(snapshot) {
  const repos = Array.isArray(snapshot.repos) ? snapshot.repos.slice(0, 17) : [];
  const stats = snapshot.stats || {};
  const lines = [
    '╔══════════════════════════════════════════════════════════╗',
    '║            THUMPERSECURE TOOLKIT  2026            ║',
    '║  TYPE : OSINT / SEO / Privacy                     ║',
    `║  TOOLS: ${padNfo(stats.tools_count || repos.length, 4)} STARS: ${padNfo(stats.stars_total || 0, 5)}+                         ║`,
    '╠══════════════════════════════════════════════════════════╣',
    '  TOOL NAME             LANG        ★',
    '  ───────────────────────────────────────',
  ];
  for (const repo of repos) {
    lines.push(`  ${padNfo(repo.name || 'unknown', 21)} ${padNfo(repo.language || 'N/A', 10)} ${repo.stars || 0}`);
  }
  lines.push('╚══════════════════════════════════════════════════════════╝');
  return lines.join('\n');
}

function writeJsonSnapshot(filePath, snapshot) {
  ensureDirectory(filePath);
  fs.writeFileSync(filePath, snapshotJson(snapshot));
}

function syncInlineFallback(snapshot) {
  if (!fs.existsSync(INDEX_PATH)) return false;
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const next = html.replace(
    /<script id="fallback-snapshot" type="application\/json">\s*[\s\S]*?\s*<\/script>/,
    `<script id="fallback-snapshot" type="application/json">\n${inlineSnapshotJson(snapshot)}\n</script>`,
  );
  if (next === html) return false;
  fs.writeFileSync(INDEX_PATH, next);
  return true;
}

function syncStaticNfo(snapshot) {
  if (!fs.existsSync(INDEX_PATH)) return false;
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const next = html.replace(
    /(<pre class="nfo nfo-toolkit" id="nfoToolkit"[^>]*>)[\s\S]*?(<\/pre>)/,
    `$1${escapeHtml(buildNfoText(snapshot))}$2`,
  );
  if (next === html) return false;
  fs.writeFileSync(INDEX_PATH, next);
  return true;
}

function syncSitemapLastmod(snapshot) {
  if (!fs.existsSync(SITEMAP_PATH)) return false;
  const lastmod = String(snapshot.last_updated_utc || new Date().toISOString()).slice(0, 10);
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const next = xml.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${lastmod}</lastmod>`);
  if (next === xml) return false;
  fs.writeFileSync(SITEMAP_PATH, next);
  return true;
}

/**
 * Fetch all pages of repos from the GitHub API.
 */
async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const url = `https://api.github.com/users/${USERNAME}/repos?per_page=${perPage}&page=${page}&type=owner`;
    console.log(`Fetching repos page ${page}...`);
    const { data } = await httpsGet(url);
    if (!Array.isArray(data) || data.length === 0) break;
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return repos;
}

/**
 * Fetch user profile (for followers count).
 */
async function fetchUser() {
  const url = `https://api.github.com/users/${USERNAME}`;
  console.log('Fetching user profile...');
  const { data } = await httpsGet(url);
  return data;
}

async function main() {
  console.log('=== Building site snapshot ===');

  const [rawRepos, user] = await Promise.all([fetchAllRepos(), fetchUser()]);

  // Filter: no forks, no private, not in exclusion list
  let repos = rawRepos
    .filter((r) => !r.fork && !r.private && !EXCLUDE_REPOS.has(r.name))
    .map((r) => ({
      name: r.name,
      description: r.description || 'OSINT & SEO tool by THUMPERSECURE',
      topics: r.topics || [],
      stars: r.stargazers_count || 0,
      last_updated: r.updated_at || r.pushed_at || new Date().toISOString(),
      language: r.language || null,
      homepage: r.homepage || null,
      html_url: r.html_url,
      featured: FEATURED_REPOS.has(r.name),
    }));

  // Merge extra repos (e.g. new/upcoming) if not already present
  const names = new Set(repos.map((r) => r.name));
  for (const extra of EXTRA_REPOS) {
    if (!names.has(extra.name)) {
      repos.push(extra);
      names.add(extra.name);
    }
  }

  // Deterministic sort: stars desc, then name asc
  repos.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return a.name.localeCompare(b.name);
  });

  const starsTotal = repos.reduce((sum, r) => sum + r.stars, 0);
  const featuredCount = repos.filter((r) => r.featured).length;

  const snapshot = {
    last_updated_utc: new Date().toISOString(),
    stats: {
      tools_count: repos.length,
      stars_total: starsTotal,
      featured_count: featuredCount,
      followers: user.followers || 0,
    },
    repos,
  };

  // Validation
  if (!Array.isArray(snapshot.repos) || snapshot.repos.length === 0) {
    console.error('VALIDATION FAILED: repos array is empty');
    process.exit(1);
  }
  for (const r of snapshot.repos) {
    if (!r.name || !r.html_url) {
      console.error(`VALIDATION FAILED: repo missing name or html_url: ${JSON.stringify(r)}`);
      process.exit(1);
    }
  }
  if (typeof snapshot.stats.tools_count !== 'number' || snapshot.stats.tools_count === 0) {
    console.error('VALIDATION FAILED: tools_count is 0 or invalid');
    process.exit(1);
  }

  writeJsonSnapshot(OUTPUT_PATH, snapshot);
  writeJsonSnapshot(FALLBACK_OUTPUT_PATH, snapshot);
  const inlineUpdated = syncInlineFallback(snapshot);
  const nfoUpdated = syncStaticNfo(snapshot);
  const sitemapUpdated = syncSitemapLastmod(snapshot);
  console.log(`Snapshot written to ${OUTPUT_PATH}`);
  console.log(`Fallback written to ${FALLBACK_OUTPUT_PATH}`);
  console.log(`Inline fallback: ${inlineUpdated ? 'updated' : 'unchanged'}`);
  console.log(`Static NFO: ${nfoUpdated ? 'updated' : 'unchanged'}`);
  console.log(`Sitemap lastmod: ${sitemapUpdated ? 'updated' : 'unchanged'}`);
  console.log(`  Repos: ${snapshot.repos.length}`);
  console.log(`  Stars: ${snapshot.stats.stars_total}`);
  console.log(`  Featured: ${snapshot.stats.featured_count}`);
  console.log(`  Followers: ${snapshot.stats.followers}`);
  console.log(`  Updated: ${snapshot.last_updated_utc}`);
  console.log('=== Done ===');
}

main().catch((err) => {
  console.error('Snapshot build failed:', err.message, err.stack);
  process.exit(1);
});
