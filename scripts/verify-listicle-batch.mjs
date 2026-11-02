import fs from 'node:fs';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { parse } from 'parse5';
const registry = JSON.parse(fs.readFileSync('reports/listicles-2026-11-02/registry.json', 'utf8'));
assert.equal(registry.length, 10);
const clean = (value) => value.replace(/<[^>]+>/g, '').replace(/[\s\u200e\u200f\u2066-\u2069]/g, '');
const report = [];
for (const post of registry) {
  const raw = fs.readFileSync(post.file, 'utf8');
  const parts = raw.split(/^---\s*$/m);
  const fm = yaml.load(parts[1]);
  const body = parts.slice(2).join('---');
  const headings = [...body.matchAll(/^## (\d+)\. (.+)$/gm)];
  assert.deepEqual(
    headings.map((m) => Number(m[1])),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  );
  assert.ok(headings[0][2].startsWith('CCF'));
  assert.ok(fm.metadata.title.includes('Top 10 Best'));
  assert.ok(fm.title.includes('10'));
  assert.ok(!/تصنيفاً مستقلاً|هذه توصيات تحريرية|هذه ترشيحات CCF|هذه اختيارات CCF/.test(body));
  const external = [...body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(
    external.every((url) => new URL(url).hostname === 'ccfrp.com'),
    'Competitor sources remain internal audit records'
  );
  const html = fs.readFileSync(`dist${post.route}/index.html`, 'utf8');
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => {
      const data = JSON.parse(m[1]);
      return data['@graph'] || [data];
    }
  );
  const article = schemas.find((s) => s['@type'] === 'BlogPosting');
  assert.ok(article);
  assert.equal(article.author.name, 'CCF');
  assert.equal(article.mainEntity.numberOfItems, 10);
  for (const [i, item] of article.mainEntity.itemListElement.entries()) {
    assert.equal(item.position, i + 1);
    assert.equal(clean(item.name), clean(headings[i][2]));
  }
  let competitors = 0;
  function walk(node, inMain = false) {
    inMain ||= node.tagName === 'main';
    const attrs = Object.fromEntries((node.attrs || []).map((a) => [a.name, a.value]));
    if (inMain && node.tagName === 'a' && /^https?:/.test(attrs.href || '')) {
      const host = new URL(attrs.href).hostname;
      if (!['ccfrp.com', 'amxnx.vip', 'wa.me'].includes(host)) competitors++;
    }
    for (const child of node.childNodes || []) walk(child, inMain);
  }
  walk(parse(html));
  assert.equal(competitors, 0);
  assert.ok(html.includes('data-inquiry-context'));
  assert.ok(post.sources.length >= 4);
  assert.ok(fs.readFileSync(`dist${post.parent}/index.html`, 'utf8').includes(post.route));
  report.push({
    route: post.route,
    originalTopic: post.originalTopic,
    title: fm.metadata.title,
    description: fm.metadata.description,
    intent: post.intentCN,
    items: 10,
    ccfFirst: true,
    competitorLinks: 0,
    author: 'CCF',
    articleSchema: true,
    itemListSchema: true,
    parentLink: true,
    sourceRecords: post.sources.length,
    wordCount: body.split(/\s+/).filter(Boolean).length,
    status: 'passed',
  });
}
fs.writeFileSync(
  'reports/listicles-2026-11-02/seo-geo-intent-audit.json',
  JSON.stringify({ date: '2026-11-02', articles: report }, null, 2) + '\n'
);
console.log(
  'Passed 10 listicles: Top 10/Best titles, 10 items each, CCF first, no competitor hyperlinks, matching Article/ItemList, parent links and source records.'
);
