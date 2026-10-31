import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { whatsappUrl, inquiryUrl } from '../src/utils/inquiry.ts';

const failures = [];
const files = fs
  .readdirSync('dist', { recursive: true })
  .filter((file) => file.endsWith('.html') && !file.startsWith('decapcms'));
for (const file of files) {
  const html = fs.readFileSync(path.join('dist', file), 'utf8');
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${file}: expected one H1`);
  const htmlTag = html.match(/<html\b[^>]*>/)?.[0] || '';
  if (!/lang="ar"/.test(htmlTag) || !/dir="rtl"/.test(htmlTag)) failures.push(`${file}: Arabic RTL missing`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const target = decodeURIComponent(match[1]);
    if (target.startsWith('//')) continue;
    const candidate = path.join('dist', target);
    if (!fs.existsSync(candidate) && !fs.existsSync(path.join(candidate, 'index.html'))) {
      failures.push(`${file}: missing local target ${target}`);
    }
  }
}
const catalogs = JSON.parse(fs.readFileSync('src/data/b2b/catalogs.json', 'utf8'));
for (const group of catalogs) {
  const html = fs.readFileSync(
    group.brand === 'other' ? 'dist/catalogs/index.html' : `dist/vehicles/${group.brand}/index.html`,
    'utf8'
  );
  for (const entry of group.entries) if (!html.includes(entry.url)) failures.push(`Missing catalog ${entry.url}`);
}
const url = new URL(whatsappUrl('BMW G80 / G82', 'https://amxnx.vip/products/example'));
assert.equal(url.hostname, 'wa.me');
assert.equal(url.pathname, '/8613427690360');
assert.ok(url.searchParams.get('text').includes('BMW G80 / G82'));
assert.ok(url.searchParams.get('text').includes('https://amxnx.vip/products/example'));
assert.equal(
  new URL(inquiryUrl('https://ccfrp.com/contact/?utm_source=existing', '/products')).searchParams.get('utm_source'),
  'existing'
);
assert.equal(inquiryUrl('/contact', '/products'), '/contact');
assert.equal(inquiryUrl(undefined, '/products'), undefined);
assert.deepEqual(failures, []);
console.log(
  `Passed: ${files.length} HTML files; local links/assets; Arabic RTL; one H1; ${catalogs.reduce((sum, group) => sum + group.entries.length, 0)} catalog placements; contextual WhatsApp and RFQ attribution.`
);
