import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
const links = JSON.parse(fs.readFileSync('src/data/cost-planning-links.json', 'utf8'));
const article = '/carbon-fiber-import-cost-profit-guide';
for (const [route, copy] of Object.entries(links)) {
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`;
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(
    (html.match(/data-calculator-resource/g) || []).length,
    copy.inline ? 0 : 1,
    `${route}: inline link or exactly one contextual panel`
  );
  const targets = [];
  function walk(node, inMain = false) {
    inMain ||= node.tagName === 'main';
    const attrs = Object.fromEntries((node.attrs || []).map((a) => [a.name, a.value]));
    if (inMain && node.tagName === 'a' && /^\/import-cost-calculator\/?$/.test(attrs.href || '')) targets.push(node);
    for (const child of node.childNodes || []) walk(child, inMain);
  }
  walk(parse(html));
  assert.ok(targets.length > 0, `${route}: calculator destination in main content`);
  for (const value of [copy.title, copy.text, copy.linkText]) {
    assert.ok(value.length > 15, `${route}: meaningful benefit copy`);
  }
  assert.ok(/href="\/import-cost-calculator\/?"/.test(html));
}
for (const route of [
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cases',
  '/grow/oem-odm',
  '/carbon-fiber-parts-fitment-check',
  '/import-cost-calculator',
]) {
  const html = fs.readFileSync(`dist${route}/index.html`, 'utf8');
  assert.ok(!html.includes('data-calculator-resource'), `${route}: no irrelevant contextual panel`);
}
const html = fs.readFileSync(`dist${article}/index.html`, 'utf8');
for (const value of ['445', '154', '25.7', '34.6', '556.25', '593.33', '510', '14.9'])
  assert.ok(html.replace(/(\d),(?=\d)/g, '$1.').includes(value), `Worked example: ${value}`);
for (const target of [
  '/import-cost-calculator',
  '/compare-wholesale-carbon-fiber-quotes',
  '/catalogs',
  '/grow/wholesale',
  '/carbon-fiber-parts-fitment-check',
])
  assert.ok(html.includes(`href="${target}"`) || html.includes(`href="${target}/"`), `Guide destination: ${target}`);
const blogPages = fs
  .readdirSync('dist/blog', { recursive: true })
  .filter((file) => file.endsWith('.html'))
  .map((file) => fs.readFileSync(`dist/blog/${file}`, 'utf8'))
  .join('');
assert.ok(blogPages.includes(article), 'Guide remains discoverable across blog pagination');
for (const file of ['dist/rss.xml', 'dist/sitemap-0.xml', 'dist/import-cost-calculator/index.html'])
  assert.ok(fs.readFileSync(file, 'utf8').includes(article), `Guide discovery: ${file}`);
assert.ok(html.includes('application/ld+json'));
assert.equal(Math.round((154 / 599) * 100 * 10) / 10, 25.7);
assert.equal(Math.round((89 / 599) * 100 * 10) / 10, 14.9);
assert.equal(((556.25 - 445) / 556.25) * 100, 20);
console.log(
  `Passed: ${Object.keys(links).length} contextual calculator panels, exclusions, article examples, internal discovery and tool/guide backlinks.`
);
