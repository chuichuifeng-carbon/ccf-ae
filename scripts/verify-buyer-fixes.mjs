import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { allProducts } from '../src/data/b2b/all-products.ts';
import { protectivePartSlugs } from '../src/data/b2b/product-title-ru.ts';
import { normalizeCatalogSearch, matchesCatalogSearch } from '../src/utils/catalog-search.ts';
import { productReference } from '../src/utils/product-reference.ts';
import { buyerTermsRu } from '../src/data/buyer-terms-ru.ts';
const text = fs.readFileSync('src/data/b2b/all-products.ts', 'utf8');
const start = text.indexOf('[', text.indexOf('const sourceProducts'));
const end = text.indexOf('\n];', start) + 2;
const source = JSON.parse(JSON.stringify(vm.runInNewContext('(' + text.slice(start, end) + ')')));
assert.equal(source.length, allProducts.length);
for (const original of source) {
  const p = allProducts.find((p) => p.slug === original.slug);
  assert.ok(p);
  for (const key of [
    'slug',
    'model',
    'yearStart',
    'yearEnd',
    'chassisCodes',
    'images',
    'featuredImage',
    'featuredSm',
    'youtube',
    'categorySlug',
  ])
    assert.deepEqual(p[key], original[key], p.slug + ': preserved ' + key);
  if (!protectivePartSlugs.has(p.slug) && p.categorySlug !== 'lighting')
    assert.equal(p.materialEn, original.materialEn, p.slug + ': unchanged non-target material');
}
for (const slug of protectivePartSlugs) {
  const p = allProducts.find((p) => p.slug === slug);
  assert.ok(p);
  assert.equal(p.materialEn, '');
  assert.ok(
    !/карбон|carbon|prepreg|препрег|3k|3K|twill|forged/i.test(
      [
        p.title,
        p.description,
        p.material,
        p.manufacturing,
        ...p.highlights,
        ...p.keywords,
        ...Object.values(p.specs16),
      ].join(' ')
    ),
    slug + ': no false carbon specification'
  );
  assert.equal(
    p.specs16.bulkLeadTime,
    '25–30 дней с подтверждения заказа и оплаты, в зависимости от детали и количества.'
  );
  assert.ok(p.specs16.warranty.includes('1 год'));
}
for (const slug of ['bmw-g90-engine-cover', 'bmw-g80-g82-g87-m3-m4-m2-carbon-fiber-engine-cover']) {
  const p = allProducts.find((p) => p.slug === slug);
  assert.ok(p.title.includes('крышка двигателя'));
  assert.ok(!p.title.includes('капота'));
}
assert.equal(new Set(allProducts.map((p) => productReference(p.slug))).size, 563);
assert.equal(normalizeCatalogSearch(' РЕШЁТКА  G80 '), 'решетка g80');
assert.ok(matchesCatalogSearch('Передняя решётка CSL без ACC', 'решетка'));
assert.ok(matchesCatalogSearch('Накладки зеркал', 'зеркала'));
assert.ok(matchesCatalogSearch('Решётка CSL с ACC', 'с ACC'));
assert.ok(!matchesCatalogSearch('Решётка CSL без ACC — сухой карбон', 'с ACC'));
assert.ok(!matchesCatalogSearch('Решётка CSL с ACC', 'без ACC'));
assert.equal(buyerTermsRu.registration, '91440111MA59C7ELXQ');
assert.ok(buyerTermsRu.payment.includes('Alipay'));
assert.ok(buyerTermsRu.shipping.includes('морская'));
console.log(
  'Passed buyer audit fixes: source facts/photos/years and non-target materials preserved; 10 protective assemblies corrected; engine-cover terminology, unique site references, Russian search and ACC distinctions.'
);
