import fs from 'node:fs';
import { parse } from 'parse5';
const origin = 'https://amxnx.vip';
const folder = 'reports/production-audit-2026-10-31';
fs.mkdirSync(folder, { recursive: true });
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const pages = [],
  assets = new Set(),
  links = new Set();
async function request(url, method = 'GET', redirect = 'follow') {
  const start = Date.now();
  try {
    const r = await fetch(url, { method, redirect, signal: AbortSignal.timeout(20000) });
    const text = method === 'GET' ? await r.text() : '';
    if (method !== 'GET') await r.body?.cancel();
    return {
      url,
      finalUrl: r.url,
      status: r.status,
      ms: Date.now() - start,
      headers: Object.fromEntries(r.headers),
      text,
    };
  } catch (e) {
    return { url, error: e.message };
  }
}
async function pool(items, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (queue.length) await worker(queue.shift());
    })
  );
}
await pool(plan.pages, async (p) => {
  const r = await request(origin + p.route);
  const issues = [],
    meta = [],
    canonical = [],
    h1 = [],
    schemas = [],
    images = [];
  let forms = 0,
    lang,
    dir;
  function walk(n) {
    const a = Object.fromEntries((n.attrs || []).map((x) => [x.name, x.value]));
    const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(''));
    if (n.tagName === 'html') {
      lang = a.lang;
      dir = a.dir;
    }
    if (n.tagName === 'meta') meta.push(a);
    if (n.tagName === 'link' && a.rel === 'canonical') canonical.push(a.href);
    if (n.tagName === 'h1') h1.push(text(n).trim());
    if (n.tagName === 'form') forms++;
    if (n.tagName === 'script' && a.type === 'application/ld+json') {
      try {
        schemas.push(JSON.parse(text(n)));
      } catch {
        issues.push('Invalid JSON-LD');
      }
    }
    if (n.tagName === 'a' && a.href) links.add(new URL(a.href, r.finalUrl).href);
    if (['img', 'script', 'link'].includes(n.tagName)) {
      const src = n.tagName === 'link' ? (['stylesheet', 'icon', 'preload'].includes(a.rel) ? a.href : null) : a.src;
      if (src && !src.startsWith('data:')) assets.add(new URL(src, r.finalUrl).href);
    }
    if (n.tagName === 'img') {
      images.push(a);
      for (const entry of (a.srcset || '').split(',')) {
        const src = entry.trim().split(/\s+/)[0];
        if (src) assets.add(new URL(src, r.finalUrl).href);
      }
      if (!('alt' in a)) issues.push('Image missing alt');
    }
    for (const c of n.childNodes || []) walk(c);
  }
  if (r.text) walk(parse(r.text));
  if (r.status !== (p.route === '/404.html' ? 404 : 200)) issues.push('Unexpected HTTP status');
  if (lang !== 'ar' || dir !== 'rtl') issues.push('Arabic RTL mismatch');
  if (h1.length !== 1) issues.push('H1 count');
  if (forms) issues.push('Local form');
  const title = r.text?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (title !== p.title) issues.push('Title differs from local plan');
  if (meta.find((m) => m.name === 'description')?.content !== p.description)
    issues.push('Description differs from local plan');
  if (p.route !== '/404.html' && (canonical.length !== 1 || canonical[0] !== p.canonical))
    issues.push('Canonical mismatch');
  if (meta.find((m) => m.name === 'robots')?.content !== p.robots) issues.push('Robots mismatch');
  pages.push({
    route: p.route,
    ...r,
    text: undefined,
    title,
    h1,
    lang,
    dir,
    forms,
    canonical,
    images: images.length,
    schemas: schemas.length,
    issues,
  });
});
console.log('Pages complete:', pages.length);
const resources = [];
await pool(
  [...assets].filter((u) => u.startsWith(origin)),
  async (u) => {
    let r = await request(u, 'HEAD');
    resources.push(r);
  }
);
console.log('Assets complete:', resources.length);
const probes = [];
for (const path of [
  '/robots.txt',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
  '/sitemap-images.xml',
  '/rss.xml',
  '/audit-missing-page-20261031',
  '/vehicles/audi',
  '/vehicles/ferrari',
  '/vehicles/lamborghini',
])
  probes.push(await request(origin + path));
for (const url of [
  'http://amxnx.vip/',
  'https://www.amxnx.vip/',
  'http://www.amxnx.vip/',
  'https://amxnx.vip/vehicles/bmw/',
])
  probes.push(await request(url, 'GET', 'manual'));
const internalLinks = [];
await pool(
  [...links].filter((u) => u.startsWith(origin)),
  async (u) => {
    const r = await request(u, 'HEAD');
    internalLinks.push(r);
  }
);
fs.writeFileSync(
  `${folder}/results.json`,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      pages,
      resources,
      internalLinks,
      probes,
      externalLinks: [...links].filter((u) => !u.startsWith(origin)),
    },
    null,
    2
  ) + '\n'
);
console.log(
  JSON.stringify(
    {
      pages: pages.length,
      pageIssues: pages
        .filter((p) => p.issues.length)
        .map((p) => ({ route: p.route, issues: p.issues, status: p.status })),
      assets: resources.length,
      assetErrors: resources.filter((r) => r.status !== 200),
      internalLinks: internalLinks.length,
      linkErrors: internalLinks.filter((r) => r.status !== 200),
      probes: probes.map(({ url, status, headers, error }) => ({ url, status, location: headers?.location, error })),
    },
    null,
    2
  )
);
