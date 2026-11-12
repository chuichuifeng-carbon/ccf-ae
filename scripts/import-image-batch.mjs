#!/usr/bin/env node
/**
 * Incremental product importer for a folder of product images.
 *
 * Usage:
 *   node scripts/import-image-batch.mjs new --dry-run
 *   node scripts/import-image-batch.mjs new
 *   node scripts/import-image-batch.mjs new --force
 *
 * Behaviour:
 *  - Discovers image groups recursively (supports 主图 subfolders and year sections).
 *  - Reuses the published slug of an existing product with the same chassis + folder name.
 *  - Keeps every existing product; new entries override only when they are the same product.
 *  - Never deletes existing optimized images.
 *  - Re-normalizes all products through product-content.ts, then writes all-products.ts.
 *  - Runs sync-product-seo.mjs to update seo.json + the metadata plan.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { allProducts as existingProducts } from '../src/data/b2b/all-products.ts';
import {
  classifyProduct,
  extractChassisCodes,
  normalizeProduct,
  productCategories,
} from '../src/data/b2b/product-content.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SRC_ARG = args.find((a) => !a.startsWith('--'));
const SRC_DIR = path.resolve(ROOT, SRC_ARG || 'new');
const PUBLIC_PRODUCTS = path.join(ROOT, 'public/images/products');
const OUT_TS = path.join(ROOT, 'src/data/b2b/all-products.ts');
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const MAX_IMAGES = 12;

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const PART_TOKEN_RE =
  /(lip|splitter|canard|grille|skirt|spoiler|wing|diffuser|bumper|hood|fender|door|seat|trim|mirror|trunk|lid|light|guard|cover|brace|antenna|fuel|plate|intake|kit|panel|vent|winglet)/i;
/** Composite marketing shots, not a part of their own. */
const GALLERY_DIR_RE = /^(?:group\s*photo|组合图|详情图|细节图|细节|实拍图|场景图|效果图|主图)$/i;
/** A bare part name such as "front lip" needs its style context to stay unique. */
const GENERIC_PART_RE =
  /^(?:(?:front|rear|side|roof|trunk|hood|engine|upper|lower|middle|left|right|inner|outer|main|full)[-_ ]*)?(?:lip|splitters?|skirts?|spoiler|wing|diffuser|canards?|grille|hood|vents?|trims?|covers?|kit|mesh|panel)$/i;
const SECTION_ANCESTOR_RE = /^(?:\d{2}[-_ ]|(?:19|20)\d{2})/;
/** Canonical English token per part kind, always re-classifiable by product-content.ts. */
const KIND_TOKEN = {
  'body-kit': 'Body-Kit',
  'engine-cover': 'Engine-Cover',
  'oil-pan-guard': 'Oil-Pan-Guard',
  'oil-cooler-guard': 'Oil-Cooler-Protection-Plate',
  'underbody-guard': 'Underbody-Guard',
  'mesh-guard': 'Mesh-Debris-Guard',
  'strut-brace': 'Strut-Brace',
  'rear-lip': 'Rear-Lip',
  'tail-light': 'Tail-Lights',
  drl: 'DRL',
  'antenna-cover': 'Antenna-Cover',
  'wheel-arch-trim': 'Wheel-Arch-Trims',
  'fog-trim': 'Fog-Light-Trims',
  'air-vent': 'Air-Vent',
  'fender-trim': 'Fender-Vent-Trim',
  'fuel-cover': 'Fuel-Cap-Cover',
  'plate-frame': 'License-Plate-Frame',
  'interior-trim': 'Interior-Trim',
  'seat-cover': 'Seat-Back-Covers',
  'trunk-lid': 'Trunk-Lid',
  'roof-spoiler': 'Roof-Spoiler',
  spoiler: 'Rear-Spoiler',
  'front-lip': 'Front-Lip',
  canard: 'Front-Canards',
  'side-winglet': 'Side-Winglets',
  'bumper-trim': 'Bumper-Corner-Trims',
  'bumper-vent': 'Front-Bumper-Air-Vents',
  'bumper-extension': 'Rear-Bumper-Extensions',
  diffuser: 'Rear-Diffuser',
  'body-panel-set': 'Front-Bumper-and-Fenders',
  'front-bumper': 'Front-Bumper',
  'rear-bumper': 'Rear-Bumper',
  'side-skirt': 'Side-Skirts',
  fender: 'Front-Fenders',
  'hood-trim': 'Hood-Vent-Trim',
  hood: 'Hood',
  grille: 'Front-Grille',
  intake: 'Air-Intake-Kit',
  door: 'Doors',
  'mirror-cap': 'Mirror-Covers',
  'battery-cover': 'Battery-Cover',
  'radiator-cover': 'Radiator-Cover',
};

const SIZES = [
  { key: 'lg', width: 1800, suffix: '' },
  { key: 'md', width: 1200, suffix: '-md' },
  { key: 'sm', width: 600, suffix: '-sm' },
];

function imagesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_RE.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => collator.compare(path.basename(a), path.basename(b)));
}

function dirsIn(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** Every directory that owns product images becomes one product. */
function collectGroups(dir, ancestors, out) {
  const subdirs = dirsIn(dir);
  const main = subdirs.find((entry) => entry.name === '主图');
  const direct = imagesIn(dir);
  if (main) {
    const images = imagesIn(path.join(dir, '主图'));
    if (images.length) {
      out.push({ dir, images: [...images, ...direct], ancestors });
      return;
    }
  }

  const children = subdirs.filter((entry) => !GALLERY_DIR_RE.test(entry.name));
  if (direct.length && children.length === 0) {
    out.push({ dir, images: direct, ancestors });
    return;
  }

  // Section folders (01-…, 07-Other) only carry a stray cover image; their
  // subfolders are the real products. A product folder named with a chassis
  // code can legitimately hold both its own photos and variant subfolders.
  if (direct.length && children.length > 0 && extractChassisCodes(path.basename(dir)).length) {
    out.push({ dir, images: direct, ancestors });
  }

  for (const subdir of children) {
    collectGroups(path.join(dir, subdir.name), [...ancestors, path.basename(dir)], out);
  }
}

function extractYearRange(text) {
  const match = text.match(/\b(20\d{2})\s*[-–]\s*(20\d{2}|Onwards|Up)\b/i);
  return match ? { start: Number(match[1]), end: /^\d{4}$/.test(match[2]) ? Number(match[2]) : 9999 } : null;
}

function nearestContext(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const name = ancestors[index];
    if (name && !SECTION_ANCESTOR_RE.test(name)) return name;
  }
  return '';
}

/** Derive a stable part hint from the first image file when the folder name is empty. */
function hintFromImages(images) {
  if (!images.length) return '';
  return path
    .basename(images[0], path.extname(images[0]))
    .replace(/^bmw[-_ ]?/i, '')
    .replace(/\b[FGEU]\d{2,3}\b[-_ ]?/gi, '')
    .replace(/[-_ ]?\d{2,}$/, '')
    .replace(/[-_ ]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildDirName(leaf, ancestors, info, yearRange, images) {
  let base = leaf
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  base = base.replace(/[-_ ]*不齐.*$/i, '').trim();
  const context = nearestContext(ancestors);
  const parent = ancestors[ancestors.length - 1] || '';
  const kindToken = KIND_TOKEN[info.kind] || info.kind;

  // "全套" is the complete body kit of its parent style.
  if (/^全套$/.test(base) && context) {
    return `${context}-Full-Body-Kit`;
  }

  if (/[\u0080-\uFFFF]/.test(base)) {
    // A descriptive Chinese folder name: reuse the parent product name when it contains a part.
    if (PART_TOKEN_RE.test(parent)) return parent;
    base = '';
  }

  if (!base) {
    base = hintFromImages(images) || kindToken;
  } else if (/^(19|20)\d{2}(?:[-–](?:19|20)\d{2})?$/.test(base)) {
    base = context ? `${context}-${base}` : `${kindToken}-${base}`;
  } else if (!PART_TOKEN_RE.test(base) || GENERIC_PART_RE.test(base)) {
    base = context ? `${context}-${base}` : `${kindToken}-${base}`;
  }

  if (yearRange && !/20\d{2}/.test(base)) {
    base += `-${yearRange.start}-${yearRange.end === 9999 ? 'Up' : yearRange.end}`;
  }
  return base;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildSlug(dirName, chassis) {
  let cleaned = dirName.replace(/^BMW[-_ ]?/i, '');
  for (const code of extractChassisCodes(dirName)) {
    cleaned = cleaned.replace(new RegExp(`\\b${code}\\b[-_ ]?`, 'ig'), '');
  }
  const base = slugify(cleaned) || 'product';
  return chassis.length ? `bmw-${chassis.join('-').toLowerCase()}-carbon-fiber-${base}` : `bmw-carbon-fiber-${base}`;
}

function baseKey(chassis, dirName) {
  return `${[...chassis].sort().join(',')}|${dirName.toLowerCase()}`;
}

async function processImages(slug, sourceImages) {
  const outDir = path.join(PUBLIC_PRODUCTS, slug);
  if (!DRY) fs.mkdirSync(outDir, { recursive: true });
  const productImages = [];

  for (let index = 0; index < sourceImages.length; index += 1) {
    const src = sourceImages[index];
    const base = `${slug}-${String(index + 1).padStart(2, '0')}`;
    const variants = {};

    for (const size of SIZES) {
      const fileName = `${base}${size.suffix}.webp`;
      const dest = path.join(outDir, fileName);
      const url = `/images/products/${slug}/${fileName}`;

      if (!FORCE && fs.existsSync(dest)) {
        const meta = await sharp(dest).metadata();
        variants[size.key] = { url, width: meta.width, height: meta.height };
        continue;
      }

      const info = await sharp(src)
        .rotate()
        .resize({ width: size.width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 3 })
        .toFile(dest);
      variants[size.key] = { url, width: info.width, height: info.height };
    }

    productImages.push({ lg: variants.lg, md: variants.md, sm: variants.sm });
  }

  return productImages;
}

function rawProduct(item, images, imageCount) {
  return {
    slug: item.slug || 'pending',
    productDirName: item.dirName,
    title: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
    keywords: [],
    categorySlug: item.info.category,
    categoryAr: productCategories[item.info.category] || '',
    categoryArShort: item.info.part,
    partType: item.info.kind,
    chassisCodes: item.chassis,
    model: '',
    yearStart: item.yearRange?.start || 0,
    yearEnd: item.yearRange?.end || 9999,
    material: '',
    manufacturing: '',
    images,
    imageCount,
    featuredImage: images[0]?.lg?.url || '',
    featuredSm: images[0]?.sm?.url || '',
    checks: [],
    specs: [],
    intentSegments: [],
  };
}

function serialize(products) {
  const current = fs.readFileSync(OUT_TS, 'utf8');
  const startIdx = current.indexOf('export const allProducts');
  const tailIdx = current.indexOf('export function groupByCategory');
  const header = current
    .slice(0, startIdx)
    .split(/\r?\n/)
    .filter((line, index) => !(index < 3 && line.startsWith('//')))
    .join('\n')
    .trim();
  const tail = tailIdx === -1 ? '' : current.slice(tailIdx).trim();

  return `// AUTO-GENERATED BY scripts/import-image-batch.mjs — DO NOT EDIT MANUALLY
// 生成于 ${new Date().toISOString()}
// Sharp 处理: lg=1800px, md=1200px, sm=600px / webp

${header}

export const allProducts: ProductDetail[] = ${JSON.stringify(products, null, 2)};
${tail ? `\n${tail}\n` : ''}`;
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source directory not found: ${SRC_DIR}`);
  }

  const groups = [];
  collectGroups(SRC_DIR, [], groups);
  console.log(`[import] image groups: ${groups.length}`);

  const baseByKey = new Map();
  const baseBySlug = new Map();
  for (const product of existingProducts) {
    baseByKey.set(baseKey(product.chassisCodes, product.productDirName), product.slug);
    baseBySlug.set(product.slug, product);
  }

  const unmapped = [];
  const items = [];
  const itemByKey = new Map();
  const rootName = path.basename(SRC_DIR);

  for (const group of groups) {
    const leaf = path.basename(group.dir);
    const ancestors = group.ancestors.filter((name) => name !== rootName);
    const imageStems = group.images.slice(0, 2).map((file) => path.basename(file, path.extname(file)));
    const descriptor = [leaf, ...[...ancestors].reverse(), ...imageStems].join(' ');

    const info = classifyProduct(descriptor);
    if (!info) {
      unmapped.push({ dir: path.relative(ROOT, group.dir), descriptor });
      continue;
    }

    const chassis = extractChassisCodes(descriptor);
    if (!chassis.length) {
      unmapped.push({ dir: path.relative(ROOT, group.dir), descriptor });
      continue;
    }
    const yearRange = extractYearRange(descriptor) || extractYearRange(ancestors.join(' ')) || extractYearRange(leaf);
    const sourceImages = group.images.slice(0, MAX_IMAGES);
    const dirName = buildDirName(leaf, ancestors, info, yearRange, group.images);
    const key = baseKey(chassis, dirName);

    const item = {
      key,
      dirName,
      chassis,
      info,
      yearRange,
      sourceImages,
      baseSlug: baseByKey.get(key),
      dir: group.dir,
    };

    if (itemByKey.has(key)) {
      const previous = itemByKey.get(key);
      if (sourceImages.length > previous.sourceImages.length) {
        const position = items.indexOf(previous);
        items[position] = item;
        itemByKey.set(key, item);
      }
      continue;
    }
    itemByKey.set(key, item);
    items.push(item);
  }

  const existingNormalized = existingProducts.map((product) => normalizeProduct(product));
  const existingByTitle = new Map();
  const usedSlugs = new Set();
  for (const product of existingNormalized) {
    existingByTitle.set(product.title, product);
    usedSlugs.add(product.slug);
  }

  const failures = [];
  const mergedItems = [];
  const byTitle = new Map();
  for (const item of items) {
    try {
      item.normalized = normalizeProduct(rawProduct(item, [], item.sourceImages.length));
    } catch (error) {
      failures.push(`${item.dirName} :: ${error.message}`);
      continue;
    }
    const previous = byTitle.get(item.normalized.title);
    if (previous) {
      if (item.sourceImages.length > previous.sourceImages.length) {
        mergedItems[mergedItems.indexOf(previous)] = item;
        byTitle.set(item.normalized.title, item);
      }
      continue;
    }
    byTitle.set(item.normalized.title, item);
    mergedItems.push(item);
  }

  console.log(`[import] unique products: ${mergedItems.length}`);
  console.log(`[import] unmapped groups: ${unmapped.length}`);
  for (const entry of unmapped.slice(0, 30)) {
    console.log(`  UNMAPPED ${entry.dir} :: ${entry.descriptor}`);
  }
  if (failures.length) {
    console.log(`[import] normalize failures: ${failures.length}`);
    for (const failure of failures.slice(0, 30)) console.log(`  FAIL ${failure}`);
    return;
  }

  for (const item of mergedItems) {
    const existing = existingByTitle.get(item.normalized.title);
    let slug = existing ? existing.slug : item.baseSlug || buildSlug(item.dirName, item.chassis);
    if (!existing && !item.baseSlug && usedSlugs.has(slug)) {
      const original = slug;
      let suffix = item.yearRange ? `${item.yearRange.start}` : item.info.kind;
      let counter = 2;
      slug = `${original}-${suffix}`;
      while (usedSlugs.has(slug)) {
        slug = `${original}-${suffix}-${counter}`;
        counter += 1;
      }
    }
    usedSlugs.add(slug);
    item.slug = slug;
    const folder = existing?.images?.[0]?.lg?.url?.match(/\/images\/products\/([^/]+)\//)?.[1];
    item.imageSlug = folder || slug;
    item.normalized = { ...item.normalized, slug };
  }

  if (DRY) {
    const preview = mergedItems.map((item) => ({
      normalized: item.normalized,
      sourceImages: item.sourceImages.length,
      isNew: !existingByTitle.has(item.normalized.title),
    }));
    const combined = [...existingNormalized.map((product) => ({ normalized: product })), ...preview];

    const titles = new Map();
    const seoTitles = new Map();
    const descriptions = new Map();
    for (const entry of combined) {
      for (const [field, map] of [
        ['title', titles],
        ['seoTitle', seoTitles],
        ['description', descriptions],
      ]) {
        const value = entry.normalized[field];
        if (!map.has(value)) map.set(value, []);
        map.get(value).push(entry.normalized.slug);
      }
    }

    const duplicates = [...titles.entries()].filter(([, slugs]) => new Set(slugs).size > 1);
    console.log(`[dry-run] categories: ${JSON.stringify(countBy(mergedItems, (i) => i.info.category))}`);
    console.log(`[dry-run] source images: ${mergedItems.reduce((sum, i) => sum + i.sourceImages.length, 0)}`);
    console.log(`[dry-run] pages after import: ${combined.length}`);
    console.log(`[dry-run] new pages: ${preview.filter((entry) => entry.isNew).length}`);
    console.log(`[dry-run] duplicate H1 titles: ${duplicates.length}`);
    for (const [title, slugs] of duplicates.slice(0, 20)) {
      console.log(`  DUP ${slugs.join(' | ')} :: ${title}`);
    }
    const dupSeo = [...seoTitles.entries()].filter(([, slugs]) => new Set(slugs).size > 1);
    console.log(`[dry-run] duplicate SEO titles: ${dupSeo.length}`);
    for (const [title, slugs] of dupSeo.slice(0, 10)) {
      console.log(`  DUP-SEO ${slugs.join(' | ')} :: ${title}`);
    }
    const slugCounts = new Map();
    for (const entry of combined) {
      const slug = entry.normalized.slug;
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    }
    const dupSlugs = [...slugCounts.entries()].filter(([, count]) => count > 1);
    console.log(`[dry-run] final slug collisions (auto-merged): ${dupSlugs.length}`);
    for (const [slug] of dupSlugs.slice(0, 10)) console.log(`  MERGE ${slug}`);
    const sample = preview.slice(0, 8);
    for (const entry of sample) {
      console.log(`\n--- ${entry.normalized.slug} (${entry.sourceImages} imgs)`);
      console.log(`H1: ${entry.normalized.title}`);
      console.log(`SEO: ${entry.normalized.seoTitle}`);
      console.log(`DESC: ${entry.normalized.seoDescription}`);
    }
    const dumpPath = path.join(os.tmpdir(), 'ccf-import-dryrun.json');
    fs.writeFileSync(
      dumpPath,
      JSON.stringify(
        combined.map((entry) => entry.normalized),
        null,
        2
      ),
      'utf8'
    );
    console.log(`\n[dry-run] full preview written to ${dumpPath}`);
    return;
  }

  const imported = [];
  let processedImages = 0;
  for (let index = 0; index < mergedItems.length; index += 1) {
    const item = mergedItems[index];
    const images = await processImages(item.imageSlug || item.slug, item.sourceImages);
    processedImages += images.length;
    imported.push(normalizeProduct(rawProduct(item, images, images.length)));

    if ((index + 1) % 10 === 0 || index === mergedItems.length - 1) {
      console.log(`[import] processed ${index + 1}/${mergedItems.length} products (${processedImages} images)`);
    }
  }

  const finalBySlug = new Map();
  for (const product of existingNormalized) finalBySlug.set(product.slug, product);
  for (const product of imported) finalBySlug.set(product.slug, product);

  const finalProducts = [...finalBySlug.values()];
  fs.writeFileSync(OUT_TS, serialize(finalProducts), 'utf8');
  const prettierBin = path.join(ROOT, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (fs.existsSync(prettierBin)) {
    execFileSync(process.execPath, [prettierBin, '--write', OUT_TS], { cwd: ROOT, stdio: 'ignore' });
  }
  console.log(`[import] wrote ${finalProducts.length} products to ${path.relative(ROOT, OUT_TS)}`);

  execFileSync(process.execPath, [path.join(ROOT, 'scripts/sync-product-seo.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function countBy(list, selector) {
  const counts = {};
  for (const item of list) {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
