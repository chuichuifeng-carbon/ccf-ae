import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { allProducts } from '../src/data/b2b/all-products.ts';
import { categoryNamesRu } from '../src/data/b2b/product-labels-ru.ts';
const origin = 'https://amxnx.vip';
const products = new Map(allProducts.map((p) => [`/products/${p.slug}`, p]));
const routes = ['/products', ...Object.keys(categoryNamesRu).map((slug) => `/products/${slug}`), ...products.keys()];
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
for (const field of ['title', 'seoTitle', 'seoDescription']) {
  assert.equal(new Set(allProducts.map((p) => p[field])).size, allProducts.length, `${field}: distinct products`);
}
for (const route of routes) {
  const html = fs.readFileSync(`dist${route}/index.html`, 'utf8');
  const document = parse(html);
  let visible = '',
    h1 = 0;
  const links = new Set(),
    schemas = [],
    meta = [],
    canonicals = [];
  function walk(node, inMain = false) {
    const a = Object.fromEntries((node.attrs || []).map((attr) => [attr.name, attr.value]));
    if (node.tagName === 'html') {
      assert.equal(a.lang, 'ru');
      assert.equal(a.dir, 'ltr');
    }
    if (node.tagName === 'script') {
      if (a.type === 'application/ld+json')
        schemas.push(JSON.parse((node.childNodes || []).map((n) => n.value || '').join('')));
      return;
    }
    if (node.tagName === 'style') return;
    if (node.tagName === 'meta') meta.push(a);
    if (node.tagName === 'link' && a.rel === 'canonical') canonicals.push(a.href);
    if (node.tagName === 'h1') h1++;
    inMain ||= node.tagName === 'main';
    if (node.nodeName === '#text') visible += node.value;
    for (const [key, value] of Object.entries(a)) {
      if (['alt', 'aria-label', 'title'].includes(key)) assert.ok(!/[\u0600-\u06ff]/.test(value), `${route}: ${key}`);
    }
    if (inMain && node.tagName === 'a' && a.href) {
      const url = new URL(a.href, origin + route + '/');
      const target = url.pathname.replace(/\/$/, '') || '/';
      if (url.origin === origin && target !== route && !url.hash && !/\.[a-z0-9]+$/i.test(target)) links.add(target);
    }
    for (const child of node.childNodes || []) walk(child, inMain);
  }
  walk(document);
  assert.equal(h1, 1, `${route}: H1`);
  assert.ok(!/[\u0600-\u06ff]/.test(visible), `${route}: visible Russian copy`);
  assert.ok(!/[\u0600-\u06ff]/.test(JSON.stringify(schemas)), `${route}: Russian schema`);
  assert.deepEqual(canonicals, [origin + route + '/']);
  assert.equal(meta.find((a) => a.name === 'description')?.content, seo[route].description);
  assert.equal(meta.find((a) => a.property === 'og:locale')?.content, 'ru_RU');
  const product = products.get(route);
  if (product) {
    assert.ok(links.size >= 5, `${route}: at least five useful body links`);
    const schema = schemas
      .flatMap((s) => s['@graph'] || (Array.isArray(s) ? s : [s]))
      .find((s) => s['@type'] === 'Product');
    assert.equal(schema?.name, product.title);
    assert.equal(schema?.material, product.materialEn || undefined);
    assert.equal(schema?.offers, undefined, `${route}: no invented price/stock`);
    if (product.categorySlug === 'lighting' || /ABS/.test(product.materialEn)) {
      assert.ok(!product.keywords.some((word) => /carbon|карбон/i.test(word)), `${route}: non-carbon keywords`);
    }
  }
}
console.log(
  `Passed Russian catalogue QA: ${routes.length} pages; ${allProducts.length} distinct products; Russian copy/schema, canonical URLs, inquiry terminology and body links.`
);
