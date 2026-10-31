import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync('dist/index.html', 'utf8');
const source = html.match(/<script\b[^>]*id="ga-init"[^>]*>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'GA bootstrap emitted');
const listeners = new Map(),
  loaders = [];
const window = {};
const document = {
  title: 'Home',
  referrer: 'https://www.google.com/',
  getElementById: () => ({ dataset: { id: 'G-SB6MBVYGLQ' } }),
  createElement: () => ({}),
  head: { appendChild: (node) => loaders.push(node) },
  addEventListener: (event, handler) => listeners.set(event, handler),
};
const location = { href: 'https://amxnx.vip/?email=private&text=secret&utm_source=qa' };
const context = vm.createContext({ window, document, location, URL, Date, encodeURIComponent });
vm.runInContext(source, context);
vm.runInContext(source, context);
assert.equal(loaders.length, 1, 'Tag is loaded once across repeated initialization');
assert.equal([...window.dataLayer].filter((a) => a[0] === 'config').length, 1);
listeners.get('astro:page-load')();
listeners.get('astro:page-load')();
location.href = 'https://amxnx.vip/contact';
document.title = 'Contact';
listeners.get('astro:page-load')();
const views = [...window.dataLayer].filter((a) => a[0] === 'event' && a[1] === 'page_view');
assert.equal(views.length, 2, 'One view per changed page');
assert.equal(views[0][2].page_location, 'https://amxnx.vip/?utm_source=qa');
assert.equal(views[1][2].page_title, 'Contact');
assert.equal(views[1][2].page_referrer, views[0][2].page_location);
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
for (const page of plan.pages) {
  const markup = fs.readFileSync(`dist/${page.file}`, 'utf8');
  assert.equal((markup.match(/id="ga-init"/g) || []).length, 1);
  assert.ok(markup.includes('data-id="G-SB6MBVYGLQ"'));
}
console.log(
  `Passed GA4: ${plan.pages.length} pages, one loader/config, initial + Astro navigation views, duplicate-event guard, query filtering.`
);
