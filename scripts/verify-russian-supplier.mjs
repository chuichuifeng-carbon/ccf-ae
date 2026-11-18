import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { supplierPagesRu } from '../src/data/supplier-pages-ru.ts';
const routes = [
  ...Object.keys(supplierPagesRu),
  '/faqs',
  '/editorial-policy',
  '/terms',
  '/privacy',
  '/return-refund-policy',
];
const origin = 'https://amxnx.vip';
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const cache = new Map();
function inspect(route) {
  if (cache.has(route)) return cache.get(route);
  const doc = parse(fs.readFileSync('dist' + (route === '/' ? '/index.html' : route + '/index.html'), 'utf8'));
  const page = { text: '', h1: [], ids: new Set(), links: [], images: [], schemas: [], metas: [], canonical: [] };
  const text = (node) => (node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''));
  function walk(node) {
    const a = Object.fromEntries((node.attrs || []).map((item) => [item.name, item.value]));
    if (a.id) page.ids.add(a.id);
    if (node.tagName === 'script') {
      if (a.type === 'application/ld+json') page.schemas.push(JSON.parse(text(node)));
      return;
    }
    if (node.tagName === 'style') return;
    if (node.nodeName === '#text') page.text += node.value + ' ';
    if (node.tagName === 'h1') page.h1.push(text(node));
    if (node.tagName === 'a' && a.href) page.links.push(a.href);
    if (node.tagName === 'img') page.images.push(a);
    if (node.tagName === 'meta') page.metas.push(a);
    if (node.tagName === 'link' && a.rel === 'canonical') page.canonical.push(a.href);
    for (const key of ['alt', 'aria-label', 'title'])
      if (a[key]) assert.ok(!/[\u0600-\u06ff]/.test(a[key]), route + ': ' + key);
    for (const c of node.childNodes || []) walk(c);
  }
  walk(doc);
  page.text = page.text.replace(/\s+/g, ' ').trim();
  cache.set(route, page);
  return page;
}
for (const route of routes) {
  const page = inspect(route);
  assert.deepEqual(page.h1, [seo[route].h1]);
  assert.deepEqual(page.canonical, [origin + route + '/']);
  assert.ok(!/[\u0600-\u06ff]/.test(page.text + JSON.stringify(page.schemas)));
  assert.equal(page.metas.find((a) => a.name === 'description')?.content, seo[route].description);
  assert.equal(page.metas.find((a) => a.property === 'og:locale')?.content, 'ru_RU');
  for (const image of page.images)
    if (image.src.startsWith('/'))
      assert.ok(fs.existsSync('dist' + new URL(image.src, origin).pathname), route + ': image ' + image.src);
  for (const href of page.links) {
    const url = new URL(href, origin + route + '/');
    if (url.hostname === 'wa.me') {
      assert.equal(url.pathname, '/8613427690360');
      assert.ok(!/[\u0600-\u06ff]/.test(url.searchParams.get('text') || ''));
    }
    if (url.protocol === 'mailto:') assert.equal(url.pathname, 'info@ccfrp.com');
    if (url.origin === origin) {
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (!/\.[a-z0-9]+$/i.test(path)) {
        assert.ok(
          fs.existsSync('dist' + (path === '/' ? '/index.html' : path + '/index.html')),
          route + ': link ' + href
        );
        if (url.hash && routes.includes(path))
          assert.ok(inspect(path).ids.has(decodeURIComponent(url.hash.slice(1))), route + ': fragment ' + href);
      }
    }
  }
}
const policy = inspect('/return-refund-policy').text;
for (const pattern of [
  /гарантия 1 год/,
  /14 дней/,
  /7 дней/,
  /2 рабочих дней/,
  /7 рабочих дней/,
  /не сокращает годовую гарантию/,
  /На детали из мокрого карбона гарантия не предоставляется/,
])
  assert.match(policy, pattern);
for (const id of ['publisher', 'evidence-factory', 'evidence-documents']) assert.ok(inspect('/about').ids.has(id));
for (const id of ['company', 'ordering', 'fitment', 'oem', 'shipping', 'warranty'])
  assert.ok(inspect('/faqs').ids.has(id));
const contact = inspect('/contact').text;
for (const value of ['+86 134 2769 0360', 'info@ccfrp.com', '09:00–18:00', 'GMT+8', 'Room 201', 'B3(4)'])
  assert.ok(contact.includes(value));
console.log(
  `Passed Russian supplier/policy QA: ${routes.length} pages; language/schema/SEO, contact destinations, local links/assets, reference anchors and preserved policy periods.`
);
