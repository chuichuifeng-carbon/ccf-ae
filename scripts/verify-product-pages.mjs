import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { allProducts } from '../src/data/b2b/all-products.ts';
import { normalizeProduct } from '../src/data/b2b/product-content.ts';

const dir = 'reports/product-optimization-2026-11-03';
execFileSync(process.execPath, ['scripts/audit-product-update.mjs', `--out=${dir}`], { stdio: 'pipe' });
const { summary, products, pages } = JSON.parse(fs.readFileSync(`${dir}/audit.json`, 'utf8'));
assert.equal(products.length, allProducts.length);
assert.equal(summary.missingOldDetails.length, 0);
assert.equal(summary.productDuplicateTitles.length, 0);
assert.equal(summary.productDuplicateH1.length, 0);
assert.equal(summary.productDuplicateDescriptions.length, 0);
assert.equal(summary.productGenericTitles.length, 0);
assert.equal(summary.sourceTruncatedDescriptions, 0);
assert.equal(summary.productCountMissingSitemap, 0);
assert.equal(summary.productsAbsentFromOwnCategory.length, 0);
assert.equal(summary.productsWithoutNonProductIncoming.length, 0);
assert.equal(summary.brokenDestinations.length, 0);
assert.equal(summary.missingImagePlacements, 0);
assert.equal(summary.escapedBdiProducts, 0);
assert.equal(summary.productDuplicateOrganizations, 0);
assert.equal(summary.h1Errors.length, 0);
assert.equal(summary.canonicalErrors.length, 0);
assert.equal(summary.forms, 0);
const imageSitemap = fs.readFileSync('dist/sitemap-images.xml', 'utf8');
for (const product of products) {
  assert.equal(product.schemaOffers, undefined, `${product.route}: no unverified price/stock`);
  assert.equal(product.returnPolicy, undefined, `${product.route}: shared return policy, no invented period`);
  assert.ok(imageSitemap.includes(`https://amxnx.vip${product.route}</loc>`));
  const page = pages.find((p) => p.route === product.route);
  assert.ok(!/T300|T700|135°C|6 bar|RoHS|Intertek|1:1|50 قطعة|خلال 24/.test(page.mainText));
  assert.ok(page.links.some((l) => l.href.startsWith('https://wa.me/8613427690360')));
  const source = allProducts.find((p) => `/products/${p.slug}` === product.route);
  assert.deepEqual(normalizeProduct(source), source, `${product.route}: stable re-import normalization`);
}
let productInquiries = 0;
for (const page of pages) {
  for (const link of page.links) {
    if (link.context && link.reference?.includes('/products/bmw-')) {
      const target = products.find((p) => `https://amxnx.vip${p.route}` === link.reference);
      assert.ok(target, `${page.route}: product inquiry refers to a real detail page`);
      assert.equal(link.context, allProducts.find((p) => `/products/${p.slug}` === target.route).title);
      const message = new URL(link.href).searchParams.get('text');
      assert.ok(message.includes(link.reference), `${page.route}: product inquiry also works without JavaScript`);
      productInquiries++;
    }
  }
}
assert.ok(
  productInquiries >= products.length,
  'Product card WhatsApp context remains explicit after client navigation'
);
console.log(
  `Passed product QA: ${products.length} unique products, preserved URLs, no broken links or orphan products, truthful schema and image sitemap coverage.`
);
