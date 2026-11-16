#!/usr/bin/env node
/**
 * Heal product links that still use the retired `-carbon-fiber-` slug convention.
 *
 *   node scripts/fix-legacy-product-links.mjs [--write]
 *
 * Without --write it only reports the mapping. With --write it rewrites the blog
 * sources and emits src/data/legacy-redirects.json so the host can 301 the old URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { allProducts } from '../src/data/b2b/all-products.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const slugs = new Set(allProducts.map((p) => p.slug));

const normalizeTokens = (slug) =>
  slug
    .replace(/-carbon-fiber/g, '')
    .split('-')
    .map(
      (token) =>
        ({ three: '3', two: '2', one: '1', pcs: '3pcs', piece: 'pcs', splitter: 'lip', splitters: 'lip' })[token] ||
        token
    )
    .filter(Boolean)
    .sort()
    .join('-');

const byTokens = new Map();
for (const product of allProducts) byTokens.set(normalizeTokens(product.slug), product.slug);

const resolve = (slug) => {
  if (slugs.has(slug)) return slug;
  const stripped = slug.replace(/-carbon-fiber/g, '');
  if (slugs.has(stripped)) return stripped;
  const frontGrille = stripped.replace('-csl-grille-', '-csl-front-grille-');
  if (slugs.has(frontGrille)) return frontGrille;
  return byTokens.get(normalizeTokens(slug)) || null;
};

/** When a legacy slug has no 1:1 successor, send readers to the matching collection page. */
const CATEGORY_FALLBACK = [
  [/side-skirt/, '/products/side-skirts'],
  [/grille|air-vent/, '/products/grilles-air-intake'],
  [/spoiler|wing/, '/products/spoilers-wings'],
  [/diffuser/, '/products/rear-diffusers'],
  [/hood/, '/products/hoods'],
  [/fender|vent-trim|corner-trim/, '/products/exterior-trim'],
  [/mirror/, '/products/mirror-caps'],
  [/engine|battery|radiator/, '/products/engine-bay'],
];

const fallbackFor = (slug) => {
  const match = CATEGORY_FALLBACK.find(([test]) => test.test(slug));
  return match ? match[1] : null;
};

const files = fs
  .readdirSync(path.join(ROOT, 'src/data/post'))
  .filter((name) => /\.(md|mdx)$/i.test(name))
  .map((name) => path.join(ROOT, 'src/data/post', name));

const mapping = new Map();
const fallbacks = new Map();
const unmatched = new Set();
let rewritten = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const next = source.replace(/\/products\/(bmw-[a-z0-9-]+)/g, (whole, slug) => {
    if (slugs.has(slug)) return whole;
    const target = resolve(slug);
    if (target) {
      if (target !== slug) mapping.set(slug, target);
      return `/products/${target}`;
    }
    const category = fallbackFor(slug);
    if (category) {
      fallbacks.set(slug, category);
      return category;
    }
    unmatched.add(slug);
    return whole;
  });
  if (next !== source) {
    rewritten += 1;
    if (WRITE) fs.writeFileSync(file, next, 'utf8');
  }
}

console.log(`files scanned: ${files.length} | files changed: ${rewritten}`);
console.log(`mapped legacy slugs: ${mapping.size}`);
for (const [from, to] of [...mapping].sort()) console.log(`  ${from} -> ${to}`);
if (fallbacks.size) {
  console.log(`\nlegacy slugs routed to a collection page (${fallbacks.size}):`);
  for (const [from, to] of [...fallbacks].sort()) console.log(`  ${from} -> ${to}`);
}
if (unmatched.size) {
  console.log(`\nunmatched (${unmatched.size}):`);
  for (const slug of [...unmatched].sort()) console.log(`  ${slug}`);
}

if (WRITE) {
  const out = path.join(ROOT, 'src/data/legacy-redirects.json');
  const legacy = Object.fromEntries([
    ...[...mapping].map(([from, to]) => [`/products/${from}`, `/products/${to}`]),
    ...[...fallbacks].map(([from, to]) => [`/products/${from}`, to]),
  ]);
  fs.writeFileSync(out, JSON.stringify(legacy, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, out)} (${Object.keys(legacy).length} rules)`);
}
