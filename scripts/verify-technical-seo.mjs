import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const origin = plan.site;
const decode = (value) => value.replaceAll('&amp;', '&');
const attributes = (tag) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
const actualFiles = fs
  .readdirSync('dist', { recursive: true })
  .filter((p) => p.endsWith('.html') && !p.startsWith('decapcms'))
  .map((p) => p.replaceAll('\\', '/'))
  .sort();
assert.deepEqual(
  actualFiles,
  plan.pages.map((p) => p.file.replaceAll('\\', '/')).sort(),
  'Every built HTML page has an explicit SEO record'
);
const imageCache = new Map();
async function imageInfo(src) {
  if (!imageCache.has(src)) {
    assert.ok(src.startsWith('/images/') || src.startsWith('/_astro/'));
    const file = path.resolve('dist', `.${src}`);
    assert.ok(file.startsWith(path.resolve('dist') + path.sep));
    imageCache.set(src, { ...(await sharp(file).metadata()), bytes: fs.statSync(file).size });
  }
  return imageCache.get(src);
}
const originals = new Map();
const pages = [];
let placements = 0;
for (const page of plan.pages) {
  const html = fs.readFileSync(`dist/${page.file}`, 'utf8');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map((m) => attributes(m[0]));
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => attributes(m[0]));
  const robots = meta.find((m) => m.name === 'robots')?.content;
  assert.equal(robots, page.robots);
  assert.equal(robots.includes('max-image-preview:large'), page.sitemap);
  const canonical = links.filter((l) => l.rel === 'canonical');
  assert.equal(canonical.length, page.route === '/404.html' ? 0 : 1);
  if (canonical[0]) assert.equal(canonical[0].href, page.canonical);
  assert.ok(links.some((l) => l.rel === 'alternate' && l.type === 'application/rss+xml'));
  if (page.route !== '/404.html') {
    assert.ok(/<noscript>[\s\S]*?href="\/no-js.css"/.test(html), `${page.route}: no-JS visibility fallback`);
    assert.ok(/opacity:\s*1\s*!important/.test(fs.readFileSync('dist/no-js.css', 'utf8')));
  }
  const graph = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => {
      const d = JSON.parse(m[1]);
      return Array.isArray(d) ? d : d['@graph'] || [d];
    }
  );
  const breadcrumbs = graph.filter((s) => s['@type'] === 'BreadcrumbList');
  assert.ok(breadcrumbs.length <= 1, `${page.route}: one breadcrumb graph`);
  for (const breadcrumb of breadcrumbs) {
    breadcrumb.itemListElement.forEach((item, i) => assert.equal(item.position, i + 1));
  }
  const ogImage = meta.find((m) => m.property === 'og:image')?.content;
  if (ogImage?.startsWith(origin + '/images/')) {
    const info = await imageInfo(new URL(ogImage).pathname);
    assert.equal(
      Number(meta.find((m) => m.property === 'og:image:width')?.content),
      info.width,
      `${page.route}: OG width`
    );
    assert.equal(
      Number(meta.find((m) => m.property === 'og:image:height')?.content),
      info.height,
      `${page.route}: OG height`
    );
  }
  let images = 0;
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const img = attributes(match[0]);
    if (!img.src?.startsWith('/images/')) continue;
    images++;
    placements++;
    const info = await imageInfo(img.src);
    assert.equal(Number(img.width), info.width, `${page.route}: intrinsic image width`);
    assert.equal(Number(img.height), info.height, `${page.route}: intrinsic image height`);
    assert.ok(['lazy', 'eager'].includes(img.loading));
    assert.equal(img.decoding, 'async');
    if (img.fetchpriority === 'high') assert.equal(img.loading, 'eager', `${page.route}: priority image not lazy`);
    assert.ok(img.alt?.trim(), `${page.route}: image alternative text`);
    if (info.width > 320) {
      assert.ok(img.srcset && img.sizes);
      let previous = 0;
      let at640 = info.bytes;
      for (const variant of img.srcset.split(', ')) {
        const [src, descriptor] = variant.split(' ');
        const width = Number(descriptor.replace(/w$/, ''));
        const actual = await imageInfo(src);
        assert.equal(width, actual.width);
        assert.ok(width > previous && width <= info.width);
        assert.ok(Math.abs(actual.width / actual.height - info.width / info.height) < 0.02);
        if (width === 640) at640 = actual.bytes;
        previous = width;
      }
      originals.set(img.src, { bytes: info.bytes, at640 });
    }
  }
  pages.push({
    route: page.route,
    index: page.sitemap,
    imagePlacements: images,
    breadcrumbGraphs: breadcrumbs.length,
    status: 'passed',
  });
}
const imageSitemap = fs.readFileSync('dist/sitemap-images.xml', 'utf8');
const index = fs.readFileSync('dist/sitemap-index.xml', 'utf8');
assert.ok(index.includes(`${origin}/sitemap-images.xml`));
let imageSitemapPages = 0;
for (const entry of imageSitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = entry[1].match(/<loc>(.*?)<\/loc>/)?.[1];
  const row = plan.pages.find((p) => p.url === loc);
  assert.ok(row?.sitemap, `Image sitemap only includes indexable canonical pages: ${loc}`);
  imageSitemapPages++;
  for (const match of entry[1].matchAll(/<image:loc>(.*?)<\/image:loc>/g)) {
    const url = new URL(decode(match[1]));
    assert.equal(url.origin, origin);
    assert.ok(fs.existsSync(`dist${url.pathname}`));
  }
}
const headers = fs.readFileSync('public/_headers', 'utf8');
assert.ok(/\/_astro\/\*[\s\S]*?immutable/.test(headers));
assert.ok(/\/images\/\*\s+Cache-Control: public, max-age=86400, must-revalidate/.test(headers));
const robots = fs.readFileSync('dist/robots.txt', 'utf8');
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
assert.ok(!/Disallow:\s*\/\s*$/m.test(robots));
const canonicalSitemap = fs.readFileSync('dist/sitemap-0.xml', 'utf8');
assert.equal((canonicalSitemap.match(/<url>/g) || []).length, plan.pages.filter((p) => p.sitemap).length);
const totals = [...originals.values()].reduce((a, p) => ({ bytes: a.bytes + p.bytes, at640: a.at640 + p.at640 }), {
  bytes: 0,
  at640: 0,
});
const http = [];
const base = process.argv.find((arg) => arg.startsWith('--http='))?.slice(7);
if (base) {
  const endpoint = new URL(base);
  assert.ok(['127.0.0.1', 'localhost'].includes(endpoint.hostname), 'HTTP audit limited to local preview');
  for (const page of plan.pages) {
    const response = await fetch(new URL(page.route, endpoint), { redirect: 'manual' });
    assert.equal(response.status, 200, `${page.route}: preview response`);
    assert.ok(response.headers.get('content-type')?.includes('text/html'));
    http.push({ path: page.route, status: response.status });
    await response.arrayBuffer();
  }
  for (const route of [
    '/technical-seo-missing-page',
    '/vehicles/audi',
    '/vehicles/ferrari',
    '/vehicles/lamborghini',
    '/cases/european-football-player-carbon-fiber',
  ]) {
    const response = await fetch(new URL(route, endpoint), { redirect: 'manual' });
    assert.equal(response.status, 404, `${route}: true error response, no soft 404`);
    http.push({ path: route, status: response.status });
    await response.arrayBuffer();
  }
  for (const route of ['/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml', '/sitemap-images.xml', '/rss.xml']) {
    const response = await fetch(new URL(route, endpoint));
    assert.equal(response.status, 200);
    http.push({ path: route, status: response.status });
    await response.arrayBuffer();
  }
}
fs.mkdirSync('reports/technical-seo-2026-10-31', { recursive: true });
fs.writeFileSync(
  'reports/technical-seo-2026-10-31/verification.json',
  JSON.stringify(
    {
      pages: pages.length,
      indexed: pages.filter((p) => p.index).length,
      imagePlacements: placements,
      imageSitemapPages,
      responsiveOriginals: originals.size,
      imageBytesComparison: {
        originalBytes: totals.bytes,
        width640Bytes: totals.at640,
        reductionPercent: Math.round((1 - totals.at640 / totals.bytes) * 100),
        note: 'Unique source images compared with their 640px versions; not measured total page transfer or Core Web Vitals.',
      },
      results: pages,
      http,
      limits:
        'Local preview does not execute hosting-platform redirect/header rules. Validate production HTTP, CDN caching, Search Console indexing and field CWV after deployment.',
    },
    null,
    2
  ) + '\n'
);
console.log(
  `Passed technical SEO: ${pages.length} pages; ${placements} image placements; ${imageSitemapPages} image-sitemap URLs; ${http.length} HTTP checks.`
);
