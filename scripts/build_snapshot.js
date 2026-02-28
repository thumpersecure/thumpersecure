#!/usr/bin/env node
/**
 * build_snapshot.js
 * Fetches public GitHub repos for thumpersecure and writes a static JSON snapshot
 * to docs/data/site_snapshot.json for the Code Cookbook site.
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
const EXCLUDE_REPOS = new Set(['thumpersecure', 'pineapple-picopager']);
const FEATURED_REPOS = new Set(['palm-tree', 'Telespot', 'Spin', 'opt-out-manual-2026']);

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
    req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
  });
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
  const repos = rawRepos
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

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`Snapshot written to ${OUTPUT_PATH}`);
  console.log(`  Repos: ${snapshot.repos.length}`);
  console.log(`  Stars: ${snapshot.stats.stars_total}`);
  console.log(`  Featured: ${snapshot.stats.featured_count}`);
  console.log(`  Followers: ${snapshot.stats.followers}`);
  console.log(`  Updated: ${snapshot.last_updated_utc}`);
  console.log('=== Done ===');
}

main().catch((err) => {
  console.error('Snapshot build failed:', err.message);
  process.exit(1);
});
