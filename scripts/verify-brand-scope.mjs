import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const banned =
  /\b(?:audi|ferrari|lamborghini|aston|bentley|cadillac|alfa|volkswagen|mclaren|maserati|tesla|pagani|kia|hyundai|hurac[aá]n|aventador|revuelto|urus|purosangue|sf90|artura|db11|dbx)\b|أودي|فيراري|لامبور|مازيراتي|أستون|بنتلي|كاديلاك|فولكس|奥迪|法拉利|兰博基尼|阿斯顿|宾利|玛莎拉蒂|迈凯伦|特斯拉/i;
const allowed = ['bmw', 'mercedes-amg', 'porsche'];
const scope = JSON.parse(fs.readFileSync('reports/brand-scope-2026-10-31/changes.json', 'utf8'));
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const pages = fs
  .readdirSync('dist', { recursive: true })
  .filter((file) => file.endsWith('.html') && !file.startsWith('decapcms'));
const results = [];
const knownUrls = new Set(
  pages.map(
    (file) =>
      '/' +
      file
        .replaceAll('\\', '/')
        .replace(/index\.html$/, '')
        .replace(/\/$/, '')
  )
);
for (const file of pages) {
  const html = fs.readFileSync(path.join('dist', file), 'utf8');
  const route =
    '/' +
    file
      .replaceAll('\\', '/')
      .replace(/index\.html$/, '')
      .replace(/\/$/, '');
  assert.ok(!banned.test(html), `${route}: excluded brand in HTML, metadata, schema, image text or URL`);
  assert.ok(seo[route], `${route}: page has an active SEO record`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${route}: one H1`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const target = match[1];
    if (target.startsWith('//')) continue;
    const resolved = path.join('dist', decodeURIComponent(target));
    assert.ok(
      fs.existsSync(resolved) || fs.existsSync(path.join(resolved, 'index.html')),
      `${route}: missing ${target}`
    );
  }
  for (const removed of scope.removedRoutes) assert.ok(!html.includes(removed), `${route}: retired link ${removed}`);
  if (route !== '/404.html')
    for (const brand of allowed) assert.ok(html.includes(`/vehicles/${brand}`), `${route}: retained brand navigation`);
  results.push({
    route,
    title: html.match(/<title>(.*?)<\/title>/)?.[1],
    excludedBrandScan: 'passed',
    linksAndImages: 'passed',
    brandNavigation: route === '/404.html' ? 'not applicable: error-page layout' : 'passed',
  });
}
assert.deepEqual(Object.keys(seo).sort(), [...knownUrls].sort());
const catalogs = JSON.parse(fs.readFileSync('src/data/b2b/catalogs.json', 'utf8'));
assert.deepEqual(catalogs.map((group) => group.brand).sort(), allowed.slice().sort());
const products = JSON.parse(fs.readFileSync('src/data/b2b/product-images.json', 'utf8'));
for (const url of Object.keys(products))
  assert.ok(/^https:\/\/ccfrp\.com\/(?:bmw-|mercedes-benz-)/.test(url), `Product outside selected brands: ${url}`);
for (const root of ['src', 'public']) {
  for (const file of fs
    .readdirSync(root, { recursive: true })
    .filter((file) => /\.(astro|ts|json|yaml|yml|md|mdx|txt|html)$/.test(file))) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!banned.test(text), `${root}/${file}: excluded brand reference`);
  }
}
for (const file of fs.readdirSync('dist', { recursive: true }))
  assert.ok(!banned.test(file), `Excluded brand file deployed: ${file}`);
for (const removed of scope.removedRoutes)
  assert.ok(!fs.existsSync(`dist${removed}/index.html`), `Retired page still built: ${removed}`);
for (const image of scope.removedImages)
  assert.ok(!fs.existsSync(`dist${image}`), `Retired image still published: ${image}`);
const machineReadable = [
  'dist/rss.xml',
  'dist/llms.txt',
  ...fs
    .readdirSync('dist')
    .filter((file) => /^sitemap.*\.xml$/.test(file))
    .map((file) => 'dist/' + file),
];
for (const file of machineReadable)
  assert.ok(!banned.test(fs.readFileSync(file, 'utf8')), `${file}: excluded reference`);
fs.writeFileSync(
  'reports/brand-scope-2026-10-31/page-audit.json',
  JSON.stringify(
    {
      allowedBrands: allowed,
      pageCount: pages.length,
      catalogEntries: catalogs.reduce((n, g) => n + g.entries.length, 0),
      selectedProductImages: Object.keys(products).length,
      removedPages: scope.removedRoutes,
      status: 'passed',
      pages: results,
    },
    null,
    2
  ) + '\n'
);
console.log(
  `Passed: all ${pages.length} front-end pages checked; only BMW, Mercedes-AMG and Porsche vehicle content; removed pages/assets absent; links, metadata, schemas, RSS and sitemap clean.`
);
