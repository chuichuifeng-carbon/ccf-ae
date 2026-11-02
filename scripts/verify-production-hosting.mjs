import fs from 'node:fs';
import assert from 'node:assert/strict';
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const rules = fs
  .readFileSync('dist/_redirects', 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(/\s+/));
const sources = new Set();
for (const [source, destination, status] of rules) {
  assert.ok(!sources.has(source), `Duplicate rule: ${source}`);
  sources.add(source);
  assert.notEqual(source, destination);
  assert.equal(status, '301');
  assert.ok(!sources.has(destination), `Redirect chain or cycle: ${source}`);
}
let mailto = 0;
for (const page of plan.pages) {
  const html = fs.readFileSync(`dist/${page.file}`, 'utf8');
  const all = [...html.matchAll(/<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/gi)];
  const protectedLinks = [
    ...html.matchAll(/<!--email_off-->(<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>)<!--\/email_off-->/gi),
  ];
  assert.equal(protectedLinks.length, all.length, `${page.route}: every mailto bypasses Cloudflare obfuscation`);
  mailto += all.length;
  if (page.route === '/' || /\.[a-z0-9]+$/i.test(page.route)) continue;
  assert.ok(!sources.has(`${page.route}/`), `Never reverse Pages' implicit folder redirect: ${page.route}`);
  for (const alias of [`${page.route}/index.html`, `${page.route}.html`]) {
    assert.ok(
      rules.some(([from, to]) => from === alias && to === page.route),
      `Canonical alias: ${alias}`
    );
  }
  assert.ok(!sources.has(page.route), `Canonical URL must not redirect: ${page.route}`);
  // Include Pages' implicit redirect, which Astro preview does not implement.
  for (const start of [page.route, `${page.route}/`, `${page.route}/index.html`, `${page.route}.html`]) {
    const visited = new Set();
    let current = start;
    while (true) {
      assert.ok(!visited.has(current), `Hosting redirect cycle: ${start} at ${current}`);
      visited.add(current);
      const custom = rules.find(([from]) => from === current)?.[1];
      const platform = current === page.route ? `${page.route}/` : undefined;
      if (!custom && !platform) break;
      current = custom || platform;
    }
    assert.equal(current, `${page.route}/`);
  }
}
assert.ok(mailto > 0);
assert.ok(!sources.has('/*'), 'Unknown URLs retain true 404s');
assert.ok(rules.some(([from, to]) => from === 'https://www.amxnx.vip/*' && to === 'https://amxnx.vip/:splat'));
console.log(
  `Passed: ${rules.length} redirect rules, no canonical redirect cycles; ${mailto} protected mailto links across ${plan.pages.length} pages.`
);
