import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';

const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const results = [];
for (const row of plan.pages) {
  const errors = [];
  const html = fs.readFileSync(`dist/${row.file}`, 'utf8');
  // Check both parser modes because <noscript> has different parsing rules.
  parse(html, { scriptingEnabled: false, onParseError: (e) => errors.push(e.code) });
  const doc = parse(html, { onParseError: (e) => errors.push(e.code) });
  const ids = new Set();
  const duplicates = [];
  const issues = [];
  let forms = 0;
  const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(''));
  function walk(node, inHead = false) {
    inHead ||= node.tagName === 'head';
    const attrs = Object.fromEntries((node.attrs || []).map((a) => [a.name, a.value]));
    if (attrs.id) {
      if (ids.has(attrs.id)) duplicates.push(attrs.id);
      ids.add(attrs.id);
    }
    if (node.tagName === 'meta' && !inHead) issues.push('Meta outside head');
    if (node.tagName === 'link' && ['canonical', 'alternate'].includes(attrs.rel) && !inHead)
      issues.push('SEO link outside head');
    if (node.tagName === 'a') {
      if (!attrs.href || attrs.href === '#') issues.push('Empty link destination');
      if (attrs.href?.includes('example.com') || attrs.href?.includes('localhost'))
        issues.push('Placeholder destination');
    }
    if (node.tagName === 'button' && !text(node).trim() && !attrs['aria-label']) issues.push('Unnamed button');
    if (['input', 'textarea', 'select'].includes(node.tagName) && attrs.type !== 'hidden') {
      let parent = node.parentNode;
      let labeled = Boolean(attrs['aria-label'] || attrs['aria-labelledby'] || attrs.id);
      while (parent) {
        if (parent.tagName === 'label') labeled = true;
        parent = parent.parentNode;
      }
      if (!labeled) issues.push('Unlabeled form control');
    }
    if (node.tagName === 'form') {
      forms++;
      issues.push('Local forms have been removed by site-owner request');
    }
    for (const child of node.childNodes || []) walk(child, inHead);
  }
  walk(doc);
  assert.deepEqual([...new Set(errors)], [], `${row.route}: valid HTML in JS/no-JS parser modes`);
  assert.deepEqual(duplicates, [], `${row.route}: unique IDs`);
  assert.deepEqual(issues, [], `${row.route}: head placement, destinations and accessible controls`);
  assert.equal(forms, 0, `${row.route}: no local forms`);
  results.push({
    route: row.route,
    forms,
    html: 'passed',
    headPlacement: 'passed',
    duplicateIds: 0,
    controls: 'passed',
  });
}
fs.mkdirSync('reports/prelaunch-qa-2026-10-31', { recursive: true });
fs.writeFileSync(
  'reports/prelaunch-qa-2026-10-31/html-structure.json',
  JSON.stringify({ pages: results.length, forms: results.reduce((sum, row) => sum + row.forms, 0), results }, null, 2) +
    '\n'
);
console.log(
  `Passed prelaunch HTML QA: ${results.length} pages, JS/no-JS parsing, metadata in head, unique IDs, accessible controls and zero local forms.`
);
