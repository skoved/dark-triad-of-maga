/**
 * Downloads an official portrait for every entry in src/data/officials.yaml into
 * public/officials/<id>.jpg.
 *
 * Strategy per person:
 *   1. English Wikipedia "pageimages" lead image for their name (this is the
 *      official portrait for essentially every current officeholder).
 *   2. Fall back to the Commons File: named in the entry's `source:` URL.
 *   3. Fall back to a generated SVG placeholder so the app still runs.
 *
 * Usage:  node scripts/fetch-portraits.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const YAML_PATH = join(ROOT, 'src/data/officials.yaml');
const OUT_DIR = join(ROOT, 'public/officials');
const UA = 'dark-triad-of-maga/0.1 (portrait fetch script; contact: local dev)';
const THUMB = 640;

mkdirSync(OUT_DIR, { recursive: true });

/** Minimal parse: pull id / name / source from the fixed-shape YAML. */
function parseRoster(text) {
  const people = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const head = line.match(/^-\s+id:\s*(.+)$/);
    if (head) {
      cur = { id: head[1].trim() };
      people.push(cur);
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^\s+(\w+):\s*(.+)$/);
    if (kv) cur[kv[1]] = kv[2].trim();
  }
  return people;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, { json = false } = {}) {
  let delay = 1000;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return json ? res.json() : res;
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay);
      delay *= 2;
      continue;
    }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`gave up after retries: ${url}`);
}

async function api(url) {
  return fetchRetry(url, { json: true });
}

async function wikipediaPortrait(name) {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1' +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=${THUMB}` +
    `&titles=${encodeURIComponent(name)}`;
  const data = await api(url);
  const pages = data?.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    if (page?.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

async function commonsPortrait(sourceUrl) {
  if (!sourceUrl) return null;
  const file = decodeURIComponent(sourceUrl.split('/wiki/')[1] ?? '');
  if (!file.startsWith('File:')) return null;
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${THUMB}` +
    `&titles=${encodeURIComponent(file)}`;
  const data = await api(url);
  const pages = data?.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const info = page?.imageinfo?.[0];
    if (info?.thumburl) return info.thumburl;
  }
  return null;
}

function placeholder(id, name) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">
  <rect width="480" height="480" fill="#141416"/>
  <rect x="8" y="8" width="464" height="464" fill="none" stroke="#7f1d1d" stroke-width="2"/>
  <text x="240" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="140" fill="#e11d48">${initials}</text>
  <text x="240" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#a7a5a0">${name}</text>
</svg>`;
  // Written with a .jpg name on purpose: browsers sniff the SVG and render it,
  // and the roster path stays consistent. Replace with a real photo when able.
  writeFileSync(join(OUT_DIR, `${id}.jpg`), svg);
}

async function download(url, dest) {
  const res = await fetchRetry(url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const roster = parseRoster(readFileSync(YAML_PATH, 'utf8'));
const force = process.argv.includes('--force');
let ok = 0;
let placeholders = 0;

for (const person of roster) {
  const dest = join(OUT_DIR, `${person.id}.jpg`);
  if (existsSync(dest) && !force) {
    console.log(`skip   ${person.id} (exists)`);
    ok++;
    continue;
  }
  await sleep(1200); // be polite to the Wikimedia APIs
  let src = null;
  try {
    src = await wikipediaPortrait(person.name);
  } catch (e) {
    console.warn(`  wiki lookup failed for ${person.name}: ${e.message}`);
  }
  if (!src) {
    try {
      src = await commonsPortrait(person.source);
    } catch (e) {
      console.warn(`  commons lookup failed for ${person.name}: ${e.message}`);
    }
  }
  if (src) {
    try {
      const bytes = await download(src, dest);
      console.log(`ok     ${person.id}  (${(bytes / 1024).toFixed(0)} kB)`);
      ok++;
      continue;
    } catch (e) {
      console.warn(`  download failed for ${person.name}: ${e.message}`);
    }
  }
  placeholder(person.id, person.name);
  placeholders++;
  console.log(`PLACE  ${person.id}  (placeholder)`);
}

console.log(`\n${ok} portraits, ${placeholders} placeholders, ${roster.length} total`);
