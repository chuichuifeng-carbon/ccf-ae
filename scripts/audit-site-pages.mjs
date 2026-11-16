#!/usr/bin/env node
/**
 * Site-wide page audit over the built `dist/` output.
 *
 *   node scripts/audit-site-pages.mjs [--json=reports/site-audit.json]
 *
 * Checks: broken internal links (404), missing images, duplicate titles/H1/descriptions,
 * missing or mismatched canonical, indexability, sitemap coverage, html lang/dir.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://amxnx.vip';
const jsonArg = process.argv.find((a) => a.startsWith('--json='));
const JSON_OUT = jsonArg ? path.join(ROOT, jsonArg.slice(7)) : null;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() ? [full] : [];
  });

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const existing = new Set(files.map((f) => '/' + path.relative(DIST, f).replace(/\\/g, '/')));
const assetExists = (urlPath) => {
  if (urlPath === '/') return existing.has('/index.html');
  return existing.has(urlPath) || existing.has(`${urlPath}/index.html`) || existing.has(`${urlPath}.html`);
};

const decode = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const routeOf = (file) => {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

function resolveInternal(raw, fromRoute) {
  let href = decode(raw.trim());
  if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('data:')) return null;
  if (/^(mailto|tel|sms|whatsapp):/i.test(href)) return null;
  if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
  else if (/^https?:/i.test(href)) return null;
  else if (href.startsWith('//')) return null;
  href = href.split('#')[0].split('?')[0];
  if (!href) return null;
  if (!href.startsWith('/')) href = path.posix.resolve(path.posix.dirname(fromRoute + 'x'), href);
  const clean = href.replace(/\/{2,}/g, '/');
  return clean === '' ? '/' : clean;
}

const attributes = (tag, name) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : '';
};

const pages = [];
const brokenLinks = new Map();
const missingImages = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeOf(file);
  const page = { route, file: '/' + path.relative(DIST, file).replace(/\\/g, '/') };

  page.title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  page.description = decode(
    attributes((html.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [''])[0], 'content')
  ).trim();
  page.robots = attributes((html.match(/<meta[^>]+name=["']robots["'][^>]*>/i) || [''])[0], 'content').trim();
  page.canonical = decode(attributes((html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [''])[0], 'href')).trim();
  page.h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    decode(m[1].replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim()
  );
  page.htmlLang = attributes((html.match(/<html[^>]*>/i) || [''])[0], 'lang');
  page.htmlDir = attributes((html.match(/<html[^>]*>/i) || [''])[0], 'dir');
  page.noindex = /noindex/i.test(page.robots);
  page.is404 = route === '/404.html' || route === '/404';
  page.schemaTypes = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);

  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
  page.links = [];
  for (const tag of anchors) {
    const href = attributes(tag, 'href');
    if (!href) continue;
    page.links.push(href);
    const target = resolveInternal(href, route);
    if (!target) continue;
    if (!assetExists(target)) {
      const key = target;
      if (!brokenLinks.has(key)) brokenLinks.set(key, { target: key, count: 0, pages: new Set() });
      const entry = brokenLinks.get(key);
      entry.count += 1;
      entry.pages.add(route);
    }
  }

  const imageTags = [...html.matchAll(/<(img|source)\b[^>]*>/gi)].map((m) => m[0]);
  page.images = [];
  for (const tag of imageTags) {
    const candidates = [];
    const src = attributes(tag, 'src');
    if (src) candidates.push(src);
    const srcset = attributes(tag, 'srcset');
    if (srcset) {
      for (const part of srcset.split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url) candidates.push(url);
      }
    }
    for (const candidate of candidates) {
      const target = resolveInternal(candidate, route);
      if (!target || !/\.(avif|webp|jpe?g|png|gif|svg)$/i.test(target)) continue;
      page.images.push(target);
      if (!assetExists(target)) {
        if (!missingImages.has(target)) missingImages.set(target, { target, count: 0, pages: new Set() });
        const entry = missingImages.get(target);
        entry.count += 1;
        entry.pages.add(route);
      }
    }
  }

  pages.push(page);
}

const groupBy = (list, key) => {
  const map = new Map();
  for (const item of list) {
    const value = key(item);
    if (value === undefined || value === null || value === '') continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item.route);
  }
  return [...map.entries()].filter(([, routes]) => routes.length > 1).map(([value, routes]) => ({ value, routes }));
};

const duplicates = {
  title: groupBy(
    pages.filter((p) => !p.noindex),
    (p) => p.title
  ),
  description: groupBy(
    pages.filter((p) => !p.noindex),
    (p) => p.description
  ),
  h1: groupBy(
    pages.filter((p) => !p.noindex),
    (p) => p.h1[0]
  ),
};

const overlongTitles = pages
  .filter((p) => !p.noindex && [...p.title].length > 60)
  .map((p) => ({ route: p.route, length: [...p.title].length }));
const shortTitles = pages
  .filter((p) => !p.is404 && !p.noindex && [...p.title].length < 20)
  .map((p) => ({ route: p.route, title: p.title }));
const overlongDescriptions = pages
  .filter((p) => !p.noindex && p.description && [...p.description].length > 160)
  .map((p) => ({ route: p.route, length: [...p.description].length }));

const noH1 = pages.filter((p) => !p.is404 && !p.noindex && p.h1.length === 0).map((p) => p.route);
const multiH1 = pages.filter((p) => !p.noindex && p.h1.length > 1).map((p) => ({ route: p.route, h1: p.h1 }));
const noTitle = pages.filter((p) => !p.noindex && !p.title).map((p) => p.route);
const noDescription = pages.filter((p) => !p.noindex && !p.description).map((p) => p.route);
const canonicalMismatch = pages
  .filter((p) => !p.is404 && p.canonical && p.canonical.replace(/\/$/, '') !== (SITE + p.route).replace(/\/$/, ''))
  .map((p) => ({ route: p.route, canonical: p.canonical }));
const noCanonical = pages.filter((p) => !p.is404 && !p.noindex && !p.canonical).map((p) => p.route);
const badLang = pages
  .filter((p) => !p.noindex && p.htmlLang !== 'ar')
  .map((p) => ({ route: p.route, lang: p.htmlLang }));
const noDir = pages.filter((p) => !p.noindex && p.htmlDir !== 'rtl').map((p) => ({ route: p.route, dir: p.htmlDir }));

// Sitemap coverage.
let sitemapRoutes = [];
const sitemapFiles = files.filter((f) => /sitemap.*\.xml$/.test(f) && !f.includes('images'));
for (const file of sitemapFiles) {
  const xml = fs.readFileSync(file, 'utf8');
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
    const url = match[1];
    if (!url.startsWith(SITE)) continue;
    sitemapRoutes.push(url.slice(SITE.length) || '/');
  }
}
sitemapRoutes = [...new Set(sitemapRoutes)];
const sitemapMissingPage = sitemapRoutes.filter((route) => !assetExists(route));
const indexableMissingFromSitemap = pages
  .filter((p) => !p.is404 && !p.noindex && p.robots === '')
  .map((p) => p.route)
  .filter((route) => !sitemapRoutes.includes(route));

const broken = [...brokenLinks.values()]
  .map((entry) => ({ target: entry.target, count: entry.count, pages: [...entry.pages] }))
  .sort((a, b) => b.count - a.count);
const missing = [...missingImages.values()]
  .map((entry) => ({ target: entry.target, count: entry.count, pages: [...entry.pages] }))
  .sort((a, b) => b.count - a.count);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    htmlPages: pages.length,
    indexable: pages.filter((p) => !p.is404 && !p.noindex).length,
    noindex: pages.filter((p) => p.noindex).length,
    sitemapUrls: sitemapRoutes.length,
    brokenInternalLinks: broken.reduce((sum, b) => sum + b.count, 0),
    brokenTargets: broken.length,
    affectedPages: new Set(broken.flatMap((b) => b.pages)).size,
    missingImageRefs: missing.reduce((sum, m) => sum + m.count, 0),
    missingImageTargets: missing.length,
  },
  brokenLinks: broken,
  missingImages: missing,
  duplicates,
  noH1,
  multiH1,
  overlongTitles,
  shortTitles,
  overlongDescriptions,
  noTitle,
  noDescription,
  noCanonical,
  canonicalMismatch,
  badLang,
  noDir,
  sitemapMissingPage,
  indexableMissingFromSitemap,
};

console.log(
  `HTML pages: ${report.totals.htmlPages} (indexable ${report.totals.indexable}, noindex ${report.totals.noindex})`
);
console.log(`sitemap URLs: ${report.totals.sitemapUrls}`);
console.log(
  `broken internal links: ${report.totals.brokenInternalLinks} -> ${report.totals.brokenTargets} targets on ${report.totals.affectedPages} pages`
);
console.log(`missing images: ${report.totals.missingImageRefs} -> ${report.totals.missingImageTargets} files`);
console.log(`duplicate title groups: ${duplicates.title.length}`);
console.log(`duplicate description groups: ${duplicates.description.length}`);
console.log(`duplicate H1 groups: ${duplicates.h1.length}`);
console.log(`pages without H1: ${noH1.length} | with multiple H1: ${multiH1.length}`);
console.log(
  `title > 60 chars: ${overlongTitles.length} | title < 20 chars: ${shortTitles.length} | description > 160: ${overlongDescriptions.length}`
);
console.log(`pages without title: ${noTitle.length} | without description: ${noDescription.length}`);
console.log(`pages without canonical: ${noCanonical.length} | canonical mismatch: ${canonicalMismatch.length}`);
console.log(`lang != ar: ${badLang.length} | dir != rtl: ${noDir.length}`);
console.log(
  `sitemap URLs with no page: ${sitemapMissingPage.length} | indexable pages not in sitemap: ${indexableMissingFromSitemap.length}`
);

if (broken.length) {
  console.log('\nTop broken targets:');
  for (const entry of broken.slice(0, 25)) console.log(`  ${entry.count}x ${entry.target}  (e.g. ${entry.pages[0]})`);
}
if (missing.length) {
  console.log('\nTop missing images:');
  for (const entry of missing.slice(0, 15)) console.log(`  ${entry.count}x ${entry.target}`);
}
if (duplicates.title.length) {
  console.log('\nDuplicate titles:');
  for (const group of duplicates.title.slice(0, 10))
    console.log(`  ${JSON.stringify(group.value)} -> ${group.routes.join(', ')}`);
}

if (JSON_OUT) {
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, JSON_OUT)}`);
}
