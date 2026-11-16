#!/usr/bin/env node
/**
 * QA gate: are the generated product records strictly following 完整产品图片/ALL.xlsx?
 *
 *   node scripts/verify-catalog-xlsx.mjs
 *
 * Checks per product: material wording, fitment source, TDK length + uniqueness,
 * keyword hygiene, YouTube, image availability. Exits 1 on any failure.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import { allProducts } from '../src/data/b2b/all-products.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wb = XLSX.readFile(path.join(ROOT, '完整产品图片/ALL.xlsx'));
const rows = XLSX.utils.sheet_to_json(wb.Sheets['产品主表'], { defval: '' });

const clean = (v) =>
  String(v ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const byPrefix = new Map(rows.map((row) => [clean(row['SEO文件名前缀']), row]));

const failures = [];
const add = (slug, check, detail) => failures.push({ slug, check, detail });
const len = (s) => [...s].length;

const CHASSIS_RE = /\b(?:[FGEU]\d{2,3}|iX[23]|i8|X[3-6]\s?M)\b/gi;
const chassisOf = (text) => [
  ...new Set((String(text).match(CHASSIS_RE) || []).map((c) => c.toUpperCase().replace(/\s+/g, ''))),
];

const counts = { material: 0, fitment: 0, tdk: 0, keyword: 0, video: 0, image: 0 };

for (const product of allProducts) {
  const row = byPrefix.get(product.slug);
  if (!row) {
    add(product.slug, 'row', 'xlsx 中找不到对应 SEO文件名前缀');
    continue;
  }

  // 1. Material must mirror 材质.
  const isAbs = /ABS|Polymer/i.test(clean(row['材质']));
  const claimsAbs = /ABS|بلاستيك/.test(product.material) || /ABS/.test(product.materialEn);
  if (isAbs !== claimsAbs) {
    counts.material += 1;
    add(product.slug, 'material', `材质=${clean(row['材质'])} 但站点 material=${product.material}`);
  }
  if (isAbs && /كربون|Carbon Fiber|DCF/.test(product.material + product.materialEn + product.specs16.weave)) {
    counts.material += 1;
    add(product.slug, 'material', 'ABS 产品仍出现碳纤维表述');
  }

  // 2. Fitment must come from 适用车型 / 车型 only (Universal rows may borrow the product name).
  const sheetChassis = chassisOf(`${clean(row['适用车型'])} ${clean(row['车型'])}`);
  const universal = /universal/i.test(clean(row['适用车型']));
  // Model badges (X5M, i8 …) are derived from a chassis code, so only compare the codes themselves.
  const siteChassis = chassisOf(product.model).filter((code) => /^[FGEU]\d{2,3}$/.test(code));
  const outside = siteChassis.filter((code) => !sheetChassis.includes(code));
  if (!universal && outside.length) {
    counts.fitment += 1;
    add(product.slug, 'fitment', `车型 ${outside.join(', ')} 不在 xlsx 适用车型`);
  }
  if (universal && siteChassis.length && !/ملف المورد يذكر Universal/.test(product.specs16.fitment)) {
    counts.fitment += 1;
    add(product.slug, 'fitment', 'Universal 行使用了具体车型但未标注需确认');
  }

  // 3. TDK limits and hygiene.
  if (len(product.seoTitle) > 60) {
    counts.tdk += 1;
    add(product.slug, 'seoTitle', `${len(product.seoTitle)} > 60`);
  }
  if (len(product.seoDescription) > 155) {
    counts.tdk += 1;
    add(product.slug, 'seoDescription', `${len(product.seoDescription)} > 155`);
  }
  if (isAbs && /كربون|Carbon/i.test(product.seoTitle + product.seoDescription)) {
    counts.tdk += 1;
    add(product.slug, 'tdk-material', 'ABS 产品的 TDK 出现碳纤维表述');
  }

  // 4. Keywords must exist and stay material-consistent.
  if (!product.keywords.length) {
    counts.keyword += 1;
    add(product.slug, 'keywords', '关键词为空');
  }
  if (isAbs && product.keywords.some((k) => /carbon/i.test(k))) {
    counts.keyword += 1;
    add(product.slug, 'keywords', 'ABS 产品关键词含 carbon');
  }

  // 5. YouTube link must be carried when the sheet has one.
  const sheetVideo = /^https?:\/\//i.test(clean(row['Youtube地址址']));
  if (sheetVideo !== Boolean(product.youtube)) {
    counts.video += 1;
    add(product.slug, 'youtube', `xlsx=${clean(row['Youtube地址址']) || '—'} 站点=${product.youtube || '—'}`);
  }

  // 6. Every product must render at least one image.
  if (!product.images.length) {
    counts.image += 1;
    add(product.slug, 'images', '没有可用图片');
  }
}

const titles = new Set(allProducts.map((p) => p.seoTitle));
const descriptions = new Set(allProducts.map((p) => p.seoDescription));
if (titles.size !== allProducts.length) add('*', 'unique', `seoTitle 重复 ${allProducts.length - titles.size}`);
if (descriptions.size !== allProducts.length)
  add('*', 'unique', `seoDescription 重复 ${allProducts.length - descriptions.size}`);

const xlsxCount = rows.length;
console.log(`products: ${allProducts.length} / xlsx rows: ${xlsxCount}`);
console.log(`material issues: ${counts.material}`);
console.log(`fitment issues: ${counts.fitment}`);
console.log(`TDK issues: ${counts.tdk}`);
console.log(`keyword issues: ${counts.keyword}`);
console.log(`YouTube issues: ${counts.video}`);
console.log(`image issues: ${counts.image}`);
console.log(`failures: ${failures.length}`);

if (failures.length) {
  console.log('\nfirst 40 failures:');
  for (const failure of failures.slice(0, 40)) console.log(`- [${failure.check}] ${failure.slug}: ${failure.detail}`);
  process.exit(1);
}
console.log('\nOK — 产品字段与 ALL.xlsx 一致。');
