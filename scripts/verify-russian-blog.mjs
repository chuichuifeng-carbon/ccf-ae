import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';
import { parse } from 'parse5';
const ar = /[\u0600-\u06ff]/;
const origin = 'https://amxnx.vip';
const guides = fs
  .readdirSync('src/data/post')
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const archives = Object.keys(seo).filter((p) => /^\/(blog|category\/|tag\/)/.test(p));
const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(''));
function inspect(route) {
  const html = fs.readFileSync('dist' + route + '/index.html', 'utf8');
  const d = parse(html);
  const page = {
    h1: [],
    title: '',
    description: '',
    canonical: '',
    text: '',
    schemas: [],
    bodyLinks: new Set(),
    related: new Set(),
  };
  function walk(n, inBody = false, inRelated = false) {
    const a = Object.fromEntries((n.attrs || []).map((x) => [x.name, x.value]));
    if (n.tagName === 'html') {
      assert.equal(a.lang, 'ru', route);
      assert.equal(a.dir, 'ltr', route);
    }
    if (n.tagName === 'script') {
      if (a.type === 'application/ld+json') page.schemas.push(JSON.parse(text(n)));
      return;
    }
    if (n.tagName === 'style') return;
    if (n.nodeName === '#text') page.text += n.value + ' ';
    for (const key of ['alt', 'aria-label', 'title']) if (a[key]) assert.ok(!ar.test(a[key]), route + ': ' + key);
    if (n.tagName === 'h1') page.h1.push(text(n));
    if (n.tagName === 'title') page.title = text(n);
    if (n.tagName === 'meta' && a.name === 'description') page.description = a.content;
    if (n.tagName === 'link' && a.rel === 'canonical') page.canonical = a.href;
    inBody ||= (a.class || '').split(/\s+/).includes('prose');
    inRelated ||= a.id === 'related-posts';
    if (n.tagName === 'a' && a.href) {
      const u = new URL(a.href, origin + route + '/');
      if (u.hostname === 'wa.me') {
        assert.equal(u.pathname, '/8613427690360');
        assert.ok(!ar.test(u.searchParams.get('text') || ''), route + ': WhatsApp');
      }
      if (u.origin === origin && !/\.[a-z0-9]+$/i.test(u.pathname)) {
        const path = u.pathname.replace(/\/$/, '') || '/';
        assert.ok(fs.existsSync('dist' + (path === '/' ? '/index.html' : path + '/index.html')), route + ': ' + a.href);
        if (inBody && path !== route) page.bodyLinks.add(path);
        if (inRelated && path !== route && path !== '/blog') page.related.add(path);
      }
    }
    for (const c of n.childNodes || []) walk(c, inBody, inRelated);
  }
  walk(d);
  assert.deepEqual(page.h1, [seo[route].h1], route);
  assert.equal(page.title, seo[route].title, route);
  assert.equal(page.description, seo[route].description, route);
  assert.equal(page.canonical, origin + route + '/', route);
  assert.ok(!ar.test(page.text + JSON.stringify(page.schemas)), route + ': Arabic residue');
  return page;
}
for (const f of fs.readdirSync('src/data/post').filter((f) => f.endsWith('.md'))) {
  const path = 'src/data/post/' + f;
  const d = yaml.load(fs.readFileSync(path, 'utf8').split(/^---\s*$/m)[1]);
  const original = execFileSync('git', ['show', 'HEAD:' + path], { encoding: 'utf8' });
  const old = yaml.load(original.split(/^---\s*$/m)[1]);
  for (const key of [
    'publishDate',
    'updateDate',
    'image',
    'imageLink',
    'author',
    'authorType',
    'authorUrl',
    'category',
    'tags',
  ])
    assert.deepEqual(d[key], old[key], f + ': source ' + key);
  assert.ok(!ar.test(d.title + d.excerpt + d.imageAlt), f + ': Russian card');
  if (old.listItems) {
    assert.equal(d.listItems.length, old.listItems.length, f + ': item count preserved');
    const raw = fs.readFileSync(path, 'utf8');
    const headings = [...raw.matchAll(/^## (\d+)\. (.+)$/gm)];
    assert.deepEqual(
      headings.map((m) => Number(m[1])),
      d.listItems.map((_, i) => i + 1),
      f + ': numbered sections'
    );
    assert.deepEqual(
      headings.map((m) => m[2]),
      d.listItems,
      f + ': headings and ItemList source'
    );
    assert.ok(!ar.test(JSON.stringify(d.listItems)), f + ': Russian ItemList');
    const urls = (t) =>
      [
        ...t
          .split(/^---\s*$/m)
          .slice(2)
          .join('---')
          .matchAll(/\]\(([^\s)]+)\)/g),
      ].map((m) => m[1]);
    for (const url of urls(original)) assert.ok(urls(raw).includes(url), f + ': preserved source ' + url);
  }
}
for (const slug of guides) {
  const p = inspect('/' + slug);
  assert.ok(p.bodyLinks.size >= 5, slug + ': five body links');
  assert.ok(p.related.size >= 5, slug + ': five recommendations');
  const article = p.schemas.find((s) => s['@type'] === 'BlogPosting');
  assert.equal(article?.inLanguage, 'ru', slug);
  assert.equal(article?.headline, seo['/' + slug].h1);
  const fm = yaml.load(fs.readFileSync('src/data/post/' + slug + '.md', 'utf8').split(/^---\s*$/m)[1]);
  if (fm.listItems)
    assert.deepEqual(
      article.mainEntity.itemListElement.map((item) => item.name),
      fm.listItems,
      slug + ': Russian ItemList matches body'
    );
}
for (const route of archives) inspect(route);
const rss = fs.readFileSync('dist/rss.xml', 'utf8');
assert.equal((rss.match(/<item>/g) || []).length, 28);
assert.ok(rss.includes('<language>ru</language>'));
assert.ok(!ar.test(rss));
const llms = fs.readFileSync('dist/llms.txt', 'utf8');
assert.ok(!ar.test(llms));
assert.ok(llms.includes('info@ccfrp.com'));
assert.ok(llms.includes('25–30'));
assert.ok(llms.includes('563'));
assert.ok(llms.includes('14 дней'));
assert.deepEqual(
  fs.readFileSync('dist/images/import-cost-example.webp'),
  fs.readFileSync('public/images/import-cost-example.webp'),
  'Russian infographic deployed in build'
);
assert.ok(!ar.test(fs.readFileSync('public/images/import-cost-example.svg', 'utf8')));
assert.ok(fs.readFileSync('public/images/import-cost-example.svg', 'utf8').includes('25,7%'));
console.log(
  `Passed Russian complete blog QA: ${guides.length} full guides, ${archives.length} archives, 28 cards/RSS items; source URLs/images/dates/taxonomy identifiers preserved; 5 body links and 5 recommendations per guide; Russian schemas and machine-readable guide.`
);
