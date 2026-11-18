import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
const arabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
const files = fs
  .readdirSync('dist', { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.replaceAll('\\', '/').startsWith('decapcms/'));
const failures = [];
let schemas = 0,
  inquiries = 0;
for (const file of files) {
  const doc = parse(fs.readFileSync('dist/' + file, 'utf8'));
  function issue(value, context) {
    if (arabic.test(value || '')) failures.push({ file, context, sample: value.slice(0, 160) });
  }
  const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(''));
  function walk(n) {
    const a = Object.fromEntries((n.attrs || []).map((x) => [x.name, x.value]));
    if (n.tagName === 'html') {
      assert.equal(a.lang, 'ru', file);
      assert.equal(a.dir, 'ltr', file);
    }
    if (n.tagName === 'script') {
      if (a.type === 'application/ld+json') {
        const schema = JSON.parse(text(n));
        schemas++;
        issue(JSON.stringify(schema), 'structured data');
      }
      return;
    }
    if (n.tagName === 'style') return;
    if (n.nodeName === '#text') issue(n.value, 'text');
    for (const key of ['title', 'alt', 'aria-label', 'aria-description', 'placeholder']) issue(a[key], key);
    if (n.tagName === 'meta') issue(a.content, 'metadata');
    if (n.tagName === 'input' && ['button', 'submit'].includes(a.type)) issue(a.value, 'button');
    if (n.tagName === 'a' && a.href) {
      try {
        const u = new URL(a.href, 'https://amxnx.vip');
        if (u.hostname === 'wa.me') {
          inquiries++;
          assert.equal(u.pathname, '/8613427690360', file);
          issue(u.searchParams.get('text'), 'WhatsApp draft');
        }
      } catch (error) {
        if (error.code === 'ERR_ASSERTION') throw error;
      }
    }
    for (const child of n.childNodes || []) walk(child);
  }
  walk(doc);
}
for (const file of ['dist/rss.xml', 'dist/llms.txt'])
  if (arabic.test(fs.readFileSync(file, 'utf8'))) failures.push({ file, context: 'feed/guide' });
const result = {
  status: failures.length ? 'failed' : 'passed',
  pages: files.length,
  schemas,
  inquiries,
  failures,
  scope:
    'Public built HTML visible copy, accessibility labels, metadata, JSON-LD, WhatsApp drafts, RSS and llms.txt; source data and CMS excluded.',
};
fs.mkdirSync('reports/russian-migration-final', { recursive: true });
fs.writeFileSync('reports/russian-migration-final/language-audit.json', JSON.stringify(result, null, 2) + '\n');
assert.deepEqual(failures, []);
console.log(
  `Passed whole-site Russian audit: ${files.length} public HTML pages, ${schemas} JSON-LD blocks, ${inquiries} WhatsApp links, RSS and llms.txt; zero Arabic residue.`
);
