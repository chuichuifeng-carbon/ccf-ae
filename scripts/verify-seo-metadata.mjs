import fs from 'node:fs';
import assert from 'node:assert/strict';

const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const decode = (value = '') =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const attributes = (tag) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], decode(match[2])]));
const sitemap = fs
  .readdirSync('dist')
  .filter((file) => /^sitemap-\d+\.xml$/.test(file))
  .map((file) => fs.readFileSync(`dist/${file}`, 'utf8'))
  .join('');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1]).replace(/\/$/, ''));
const results = [];
for (const row of plan.pages) {
  const html = fs.readFileSync(`dist/${row.file}`, 'utf8');
  const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0]));
  const getMeta = (name) => meta.filter((item) => item.name === name || item.property === name);
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributes(match[0]));
  const canonical = links.filter((item) => item.rel === 'canonical');
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)];
  assert.equal(titles.length, 1, `${row.route}: exactly one title`);
  assert.equal(decode(titles[0][1]), row.title, `${row.route}: title`);
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1.length, 1, `${row.route}: exactly one H1`);
  assert.equal(decode(h1[0][1]), row.h1, `${row.route}: H1`);
  for (const [name, expected] of Object.entries({
    description: row.description,
    robots: row.robots,
    'og:title': row.ogTitle,
    'og:description': row.ogDescription,
    'og:type': row.ogType,
    'og:locale': row.ogLocale,
    'og:site_name': row.ogSiteName,
    'og:image': row.ogImage,
    'twitter:card': row.twitterCard,
    'twitter:title': row.twitterTitle,
    'twitter:description': row.twitterDescription,
    'twitter:image': row.twitterImage,
  })) {
    const values = getMeta(name);
    assert.equal(values.length, 1, `${row.route}: one ${name}`);
    assert.equal(values[0].content, expected, `${row.route}: ${name}`);
  }
  if (row.canonical) {
    assert.equal(canonical.length, 1, `${row.route}: canonical count`);
    assert.equal(canonical[0].href, row.canonical, `${row.route}: canonical`);
    assert.equal(getMeta('og:url')[0]?.content, row.canonical, `${row.route}: og:url`);
  } else assert.equal(canonical.length, 0, `${row.route}: omit 404 canonical`);
  assert.equal(getMeta('keywords').length, 0, `${row.route}: no meta keywords`);
  assert.equal(sitemapUrls.includes(row.url.replace(/\/$/, '')), row.sitemap, `${row.route}: sitemap membership`);
  if (row.ogType === 'article') {
    assert.equal(getMeta('article:published_time')[0]?.content, new Date(row.articlePublishedTime).toISOString());
    assert.equal(getMeta('article:modified_time')[0]?.content, new Date(row.articleModifiedTime).toISOString());
    assert.equal(getMeta('article:author')[0]?.content, row.articleAuthorUrl);
  }
  results.push({ route: row.route, status: 'passed', index: row.sitemap });
}
const titles = plan.pages.map((row) => row.title);
assert.equal(new Set(titles).size, titles.length);
const descriptions = plan.pages.map((row) => row.description);
assert.equal(new Set(descriptions).size, descriptions.length);
assert.ok(!sitemapUrls.some((url) => /\/decapcms|\/404(?:\.html)?$/.test(url)));
const admin = fs.readFileSync('dist/decapcms/index.html', 'utf8');
assert.ok(admin.includes('noindex, nofollow'));
const report = {
  status: 'passed',
  pages: results.length,
  indexable: results.filter((row) => row.index).length,
  noindex: results.filter((row) => !row.index).length,
  checks: 'Title, description, H1, canonical, robots, sitemap, OG, Twitter, article dates/author and no keywords tag',
  results,
};
fs.writeFileSync('reports/seo-metadata-plan/implementation-verification.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  `Passed: ${report.pages} pages match the SEO plan; ${report.indexable} indexed in sitemap; ${report.noindex} excluded.`
);
