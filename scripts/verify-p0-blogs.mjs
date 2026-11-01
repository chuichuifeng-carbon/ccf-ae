import fs from 'node:fs';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';

const registry = JSON.parse(fs.readFileSync('reports/blog-p0-2026-10-31/topics.json', 'utf8'));
const posts = fs.readdirSync('src/data/post').filter((file) => /\.mdx?$/.test(file));
assert.ok(posts.length >= 3);
const rss = fs.readFileSync('dist/rss.xml', 'utf8');
assert.equal((rss.match(/<item>/g) || []).length, posts.length);
const results = [];
for (const topic of registry.topics) {
  const text = fs.readFileSync(topic.file, 'utf8');
  const parts = text.split(/^---\s*$/m);
  const data = yaml.load(parts[1]);
  const body = parts.slice(2).join('---');
  assert.equal(data.authorType, 'Organization');
  assert.equal(data.draft, undefined);
  assert.ok(!/^#\s/m.test(body), 'No repeated H1 in body');
  const links = [...body.matchAll(/\[[^\]]+\]\((\/[^)#]+)(?:#[^)]*)?\)/g)].map((match) => match[1]);
  const unique = [...new Set(links.filter((link) => link !== topic.route && !/\.(pdf|png|jpe?g|webp)$/.test(link)))];
  assert.ok(unique.length >= 5, `${topic.id}: five useful internal HTML destinations`);
  for (const link of unique) assert.ok(fs.existsSync(`dist${link}/index.html`), `${topic.id}: ${link}`);
  const html = fs.readFileSync(`dist${topic.route}/index.html`, 'utf8');
  const button = html.match(/<a\b[^>]*data-inquiry-prefilled[^>]*>/)?.[0];
  assert.ok(button, `${topic.id}: explicit ready-to-send CTA`);
  const href = button.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&');
  const whatsapp = new URL(href);
  assert.equal(whatsapp.hostname, 'wa.me');
  assert.equal(whatsapp.pathname, '/8613427690360');
  const message = whatsapp.searchParams.get('text');
  assert.ok(message?.startsWith('Hello CCF,'));
  assert.ok(!/\.pdf|\[|\]|_{2,}/.test(message));
  assert.ok(html.includes(`href="${data.imageLink}"`));
  assert.ok(rss.includes(topic.route));
  assert.ok(fs.readFileSync('dist/blog/index.html', 'utf8').includes(topic.route));
  assert.ok(fs.readFileSync('dist/dry-carbon-vs-wet-carbon/index.html', 'utf8').includes(topic.route));
  const upstream = topic.id === 'AR-P0-001' ? 'dist/vehicles/bmw/index.html' : 'dist/grow/wholesale/index.html';
  assert.ok(fs.readFileSync(upstream, 'utf8').includes(topic.route));
  results.push({ topic: topic.id, route: topic.route, internalHtmlDestinations: unique.length, status: 'passed' });
}
fs.writeFileSync(
  'reports/blog-p0-2026-10-31/verification.json',
  JSON.stringify({ posts: posts.length, rssItems: posts.length, results }, null, 2) + '\n'
);
console.log(
  `Passed: ${posts.length} blog posts; both P0 articles in blog/RSS; useful internal links, parent backlinks, linked source images and ready-to-send WhatsApp CTAs.`
);
