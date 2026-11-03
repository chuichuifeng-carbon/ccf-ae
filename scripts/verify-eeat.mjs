import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const files = fs
  .readdirSync('dist', { recursive: true })
  .filter((file) => file.endsWith('.html') && !file.startsWith('decapcms'));
const origin = 'https://amxnx.vip';
for (const file of files) {
  const html = fs.readFileSync(path.join('dist', file), 'utf8');
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => /type="application\/ld\+json"/.test(match[1]))
    .flatMap((match) => {
      const data = JSON.parse(match[2]);
      return Array.isArray(data) ? data : data['@graph'] || [data];
    });
  const organizations = blocks.filter((block) => block['@type'] === 'Organization');
  const websites = blocks.filter((block) => block['@type'] === 'WebSite');
  assert.equal(organizations.length, 1, `${file}: one shared organization`);
  assert.equal(websites.length, 1, `${file}: one shared website`);
  assert.equal(organizations[0]['@id'], `${origin}/#organization`);
  assert.equal(organizations[0].legalName, 'Guangzhou Chui Chui Feng Automotive Products Co., Ltd.');
  assert.equal(organizations[0].foundingDate, undefined, `${file}: do not invent legal founding date`);
  assert.equal(organizations[0].email, 'info@ccfrp.com');
  assert.ok(organizations[0].sameAs.includes('https://ccfrp.com'));
  assert.ok(!blocks.some((block) => block['@type'] === 'AggregateRating' || block.aggregateRating));
  const article = blocks.find((block) => block['@type'] === 'BlogPosting');
  if (article) {
    assert.equal(article.author['@type'], 'Organization');
    assert.equal(article.author.url, `${origin}/about#publisher`);
    assert.equal(article.publisher['@id'], `${origin}/#organization`);
    assert.equal(article.inLanguage, 'ar');
    assert.ok(Number.isFinite(Date.parse(article.datePublished)));
    assert.ok(Date.parse(article.dateModified) >= Date.parse(article.datePublished));
    assert.ok(html.includes('/editorial-policy'));
    if (article.mainEntityOfPage.endsWith('/dry-carbon-vs-wet-carbon')) {
      assert.equal(article.dateModified, '2026-10-31T00:00:00.000Z');
      assert.ok(html.includes('https://www.hexcel.com/products/prepregs-resins/'));
    }
    assert.ok(!html.includes('20–40%'));
  }
  if (file.includes('products') && /bmw-.*index\.html$/.test(file)) {
    assert.ok(!blocks.some((block) => block['@type'] === 'CollectionPage'), `${file}: detail page is not a collection`);
    assert.ok(html.includes('/editorial-policy'));
    assert.ok(/<time\b[^>]*datetime="\d{4}-\d{2}-\d{2}"/.test(html), `${file}: product review date`);
    assert.ok(html.includes('/return-refund-policy'));
  }
}
const policy = fs.readFileSync('dist/editorial-policy/index.html', 'utf8');
assert.ok(policy.includes('/about#publisher'));
assert.ok(policy.includes('info@ccfrp.com'));
const privacy = fs.readFileSync('dist/privacy/index.html', 'utf8');
assert.ok(privacy.includes('Google Analytics'));
console.log(
  `Passed E-E-A-T integrity checks across ${files.length} HTML pages: organization identity, source/author attribution, no fabricated founding date or aggregate ratings, article corrections and product provenance.`
);
