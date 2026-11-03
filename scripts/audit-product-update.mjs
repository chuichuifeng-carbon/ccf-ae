import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { allProducts } from '../src/data/b2b/all-products.ts';

const out = process.argv.find((arg) => arg.startsWith('--out='))?.slice(6) || 'reports/product-audit-2026-11-03';
fs.mkdirSync(out, { recursive: true });
const origin = 'https://amxnx.vip';
const files = fs
  .readdirSync('dist', { recursive: true })
  .map((f) => f.replaceAll('\\', '/'))
  .filter((f) => f.endsWith('.html') && !f.startsWith('decapcms/'));
const routeFor = (f) => (f === 'index.html' ? '/' : f.endsWith('/index.html') ? '/' + f.slice(0, -11) : '/' + f);
const text = (n) =>
  n.nodeName === '#text'
    ? n.value
    : ['script', 'style'].includes(n.tagName)
      ? ''
      : (n.childNodes || []).map(text).join(' ');
const normalized = (s) => s.replace(/\s+/g, ' ').trim();
const pages = [];
for (const file of files) {
  const html = fs.readFileSync(`dist/${file}`, 'utf8');
  const dom = parse(html);
  const row = {
    route: routeFor(file),
    file,
    title: '',
    h1: [],
    description: '',
    canonical: [],
    robots: '',
    links: [],
    images: [],
    schemas: [],
    mainText: '',
    forms: 0,
    escapedBdi: false,
    duplicateIds: [],
  };
  const ids = new Set();
  function walk(n) {
    const a = Object.fromEntries((n.attrs || []).map((x) => [x.name, x.value]));
    if (a.id) {
      if (ids.has(a.id)) row.duplicateIds.push(a.id);
      ids.add(a.id);
    }
    if (n.tagName === 'title') row.title = normalized(text(n));
    if (n.tagName === 'h1') row.h1.push(normalized(text(n)));
    if (n.tagName === 'meta' && a.name === 'description') row.description = a.content;
    if (n.tagName === 'meta' && a.name === 'robots') row.robots = a.content;
    if (n.tagName === 'link' && a.rel === 'canonical') row.canonical.push(a.href);
    if (n.tagName === 'a' && a.href)
      row.links.push({
        href: a.href,
        text: normalized(text(n)),
        context: a['data-inquiry-context'],
        reference: a['data-inquiry-reference'],
      });
    if (n.tagName === 'img') row.images.push({ src: a.src, alt: a.alt, width: a.width, height: a.height });
    if (n.tagName === 'form') row.forms++;
    if (n.tagName === 'main') {
      row.mainText = normalized(text(n));
      row.escapedBdi = row.mainText.includes('<bdi');
    }
    if (n.tagName === 'script' && a.type === 'application/ld+json') {
      try {
        const data = JSON.parse(n.childNodes.map((c) => c.value || '').join(''));
        row.schemas.push(...(Array.isArray(data) ? data : data['@graph'] || [data]));
      } catch (e) {
        row.schemas.push({ invalid: e.message });
      }
    }
    for (const c of n.childNodes || []) walk(c);
  }
  walk(dom);
  row.brokenLinks = row.links.filter(({ href }) => {
    let u;
    try {
      u = new URL(href, origin + row.route);
    } catch {
      return false;
    }
    if (u.origin !== origin) return false;
    const pathname = decodeURIComponent(u.pathname);
    if (pathname === '/') return false;
    const f = path.join('dist', pathname);
    return !fs.existsSync(f) && !fs.existsSync(path.join(f, 'index.html'));
  });
  row.missingImages = row.images.filter(
    (img) => img.src?.startsWith('/') && !fs.existsSync(path.join('dist', decodeURIComponent(img.src.split('?')[0])))
  );
  pages.push(row);
}
const byRoute = new Map(pages.map((p) => [p.route, p]));
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const sitemap = fs
  .readdirSync('dist')
  .filter((f) => /^sitemap.*\.xml$/.test(f))
  .map((f) => fs.readFileSync(`dist/${f}`, 'utf8'))
  .join('\n');
const groups = (rows, key) =>
  Object.entries(Object.groupBy(rows, key))
    .filter(([, r]) => r.length > 1)
    .map(([value, r]) => ({ value, routes: r.map((x) => x.route) }));
const products = allProducts.map((p) => {
  const route = `/products/${p.slug}`;
  const page = byRoute.get(route);
  const productSchema = page?.schemas.find((s) => s['@type'] === 'Product');
  const category = byRoute.get(`/products/${p.categorySlug}`);
  const incoming = pages.filter((x) =>
    x.links.some((l) => {
      try {
        return new URL(l.href, origin).pathname.replace(/\/$/, '') === route;
      } catch {
        return false;
      }
    })
  );
  return {
    route,
    title: page?.title,
    h1: page?.h1,
    description: page?.description,
    inputSeoTitle: p.seoTitle,
    inputDescription: p.seoDescription,
    titleOverridden: page?.title !== p.seoTitle,
    descriptionTruncatedInSource: p.seoDescription.endsWith('…'),
    category: p.categorySlug,
    partType: p.partType,
    chassis: p.chassisCodes,
    genericTitle: /قطعة كربون مخصصة/.test(p.title),
    inSitemap: sitemap.includes(origin + route + '</loc>'),
    categoryLinksToProduct: category?.links.some((l) => l.href.replace(/\/$/, '') === route) || false,
    incomingPages: incoming.map((x) => x.route),
    incomingNonProductPages: incoming
      .filter((x) => !allProducts.some((q) => x.route === `/products/${q.slug}`))
      .map((x) => x.route),
    mainImage: p.featuredImage,
    imageCount: p.imageCount,
    brokenLinks: page?.brokenLinks,
    missingImages: page?.missingImages,
    escapedBdi: page?.escapedBdi,
    robots: page?.robots,
    schemas: page?.schemas.map((s) => s['@type']),
    schemaOffers: productSchema?.offers,
    returnPolicy: productSchema?.hasMerchantReturnPolicy,
    organizationCount: page?.schemas.filter((s) => s['@type'] === 'Organization').length,
    schemaNameVsH1: productSchema?.name !== page?.h1[0],
  };
});
const oldDetails = [
  '/products/bmw-g80-g82-carbon-fiber-front-lip-r44-style',
  '/products/bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style',
  '/products/bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style',
  '/products/bmw-g87-m2-carbon-fiber-hood',
];
const brokenGroups = Object.entries(
  Object.groupBy(
    pages.flatMap((p) => p.brokenLinks.map((l) => ({ ...l, from: p.route }))),
    (x) => x.href
  )
).map(([href, links]) => ({ href, placements: links.length, pages: [...new Set(links.map((x) => x.from))] }));
const summary = {
  date: '2026-11-03',
  scope: 'Static audit of the current local working tree',
  builtPages: pages.length,
  productPages: products.length,
  oldDetailRoutes: oldDetails,
  missingOldDetails: oldDetails.filter((r) => !byRoute.has(r)),
  planPagesMissingFromBuild: plan.pages.filter((r) => !byRoute.has(r.route)).map((r) => r.route),
  productDuplicateTitles: groups(products, (p) => p.title),
  productDuplicateH1: groups(products, (p) => p.h1?.[0]),
  productDuplicateDescriptions: groups(products, (p) => p.description),
  productGenericTitles: products.filter((p) => p.genericTitle).map((p) => p.route),
  sourceTruncatedDescriptions: products.filter((p) => p.descriptionTruncatedInSource).length,
  productTitlesOverriddenByLegacySeo: products.filter((p) => p.titleOverridden).map((p) => p.route),
  productCountMissingSitemap: products.filter((p) => !p.inSitemap).length,
  productsAbsentFromOwnCategory: products.filter((p) => !p.categoryLinksToProduct).map((p) => p.route),
  productsWithoutNonProductIncoming: products.filter((p) => !p.incomingNonProductPages.length).map((p) => p.route),
  h1Errors: pages.filter((p) => p.h1.length !== 1).map((p) => ({ route: p.route, count: p.h1.length })),
  canonicalErrors: pages
    .filter((p) => p.route !== '/404.html' && (p.canonical.length !== 1 || p.canonical[0] !== origin + p.route))
    .map((p) => ({ route: p.route, canonical: p.canonical })),
  forms: pages.reduce((n, p) => n + p.forms, 0),
  missingImagePlacements: pages.reduce((n, p) => n + p.missingImages.length, 0),
  invalidSchemas: pages.filter((p) => p.schemas.some((s) => s.invalid)).map((p) => p.route),
  escapedBdiProducts: products.filter((p) => p.escapedBdi).length,
  productDuplicateOrganizations: products.filter((p) => p.organizationCount > 1).length,
  brokenDestinations: brokenGroups,
};
fs.writeFileSync(`${out}/audit.json`, JSON.stringify({ summary, products, pages }, null, 2) + '\n');
fs.writeFileSync(`${out}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(
  JSON.stringify(
    {
      ...summary,
      brokenDestinations: brokenGroups.map(({ href, placements, pages }) => ({
        href,
        placements,
        pageCount: pages.length,
      })),
    },
    null,
    2
  )
);
