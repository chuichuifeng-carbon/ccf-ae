#!/usr/bin/env node
/**
 * scan-products.mjs  v2 — 带 Sharp 图片处理 + SEO 文件名
 * ─────────────────────────────────────────────────────────────────
 * 1. 遍历 temp/{chassis}/{category}/{product}/ 找图片
 * 2. Sharp 处理：转 webp、多尺寸 (lg/md/sm)、SEO 文件名
 * 3. 输出到 public/images/products/{slug}/
 * 4. 生成 src/data/b2b/all-products.ts
 *
 * 运行：node scripts/scan-products.mjs
 * ─────────────────────────────────────────────────────────────────
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { normalizeProduct } from '../src/data/b2b/product-content.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ──────────────────── 图片输出尺寸 ────────────────────
// 后缀 lg=大图(主图/gallery), md=中图, sm=小图(缩略图/related)
const SIZES = [
  { suffix: 'lg', width: 1800, quality: 82 },
  { suffix: 'md', width: 1200, quality: 80 },
  { suffix: 'sm', width: 600, quality: 78 },
];

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGES = 12;

// ──────────────────── 汽车参数映射表 ────────────────────

const CATEGORY_MAP = {
  'front-lips-splitters': {
    ar: 'الشفاه الأمامية',
    arShort: 'شفّة أمامية',
    categoryPage: 'front-lips-splitters',
    partType: 'front-lip',
    arPartName: 'شفّة أمامية',
  },
  'front-canards': {
    ar: 'الزوايا الأمامية الجانبية',
    arShort: 'كانارد أمامي',
    categoryPage: 'front-lips-splitters',
    partType: 'canard',
    arPartName: 'زوايا هواء أمامية',
  },
  'front-grilles': {
    ar: 'الشبكات الأمامية',
    arShort: 'شبكة أمامية',
    categoryPage: 'grilles-air-intake',
    partType: 'grille',
    arPartName: 'شبكة كلوية',
  },
  'side-skirts': {
    ar: 'التنانير الجانبية',
    arShort: 'تنانير',
    categoryPage: 'side-skirts',
    partType: 'side-skirt',
    arPartName: 'تنانير جانبية',
  },
  'fenders-side-vents': {
    ar: 'أغطية الفتحات الجانبية',
    arShort: 'فتحات جانبية',
    categoryPage: 'grilles-air-intake',
    partType: 'fender-vent',
    arPartName: 'غطاء فتحة رفرف',
  },
  'exterior-trim-accessories': {
    ar: 'زخارف خارجية إضافية',
    arShort: 'ملحقات خارجية',
    categoryPage: 'mirror-caps',
    partType: 'trim',
    arPartName: 'قطعة زخرفية خارجية',
  },
  'hoods-bonnets': {
    ar: 'أغطية المحرك',
    arShort: 'غطاء محرك',
    categoryPage: 'hoods',
    partType: 'hood',
    arPartName: 'غطاء محرك',
  },
  'rear-spoilers-wings': {
    ar: 'الجناحات الخلفية',
    arShort: 'جناح خلفي',
    categoryPage: 'spoilers-wings',
    partType: 'spoiler',
    arPartName: 'جناح خلفي',
  },
  'rear-diffusers': {
    ar: 'الناشرات الخلفية',
    arShort: 'ناشر خلفي',
    categoryPage: 'rear-diffusers',
    partType: 'diffuser',
    arPartName: 'ناشر خلفي',
  },
  'rear-bumper-extensions': {
    ar: 'ملحقات المصد الخلفي',
    arShort: 'قطعة زاوية خلفية',
    categoryPage: 'rear-diffusers',
    partType: 'rear-corner',
    arPartName: 'قطعة زاوية المصد الخلفي',
  },
  'trunk-lids': {
    ar: 'أغطية الصندوق الخلفي',
    arShort: 'غطاء صندوق',
    categoryPage: 'trunk-lids',
    partType: 'trunk-lid',
    arPartName: 'غطاء صندوق خلفي',
  },
  'mirror-caps': {
    ar: 'أغطية المرايا الجانبية',
    arShort: 'غطاء مرآة',
    categoryPage: 'mirror-caps',
    partType: 'mirror-cap',
    arPartName: 'غطاء مرآة جانبية',
  },
  'other-parts': {
    ar: 'قطع أخرى من الكربون',
    arShort: 'قطع أخرى',
    categoryPage: 'front-lips-splitters',
    partType: 'other',
    arPartName: 'قطعة كربون مخصصة',
  },
};

// ──────────────────── 工具函数 ────────────────────

function extractChassisCodes(dirName) {
  const cleaned = dirName.replace(/^\d+-/, '');
  const codes = [];
  const matches = cleaned.match(/\b([FG]\d{2})\b/g) || [];
  for (const m of matches) {
    if (!codes.includes(m.toUpperCase())) codes.push(m.toUpperCase());
  }
  const dashParts = cleaned.split('-');
  for (const part of dashParts) {
    const upper = part.toUpperCase();
    if (/^[FG]\d{2}$/.test(upper) && !codes.includes(upper)) {
      codes.push(upper);
    }
  }
  return codes;
}

function parseCategory(dirName) {
  const cleaned = dirName.replace(/^\d+-/, '').toLowerCase().replace(/\s+/g, '-');
  if (CATEGORY_MAP[cleaned]) return { slug: cleaned, ...CATEGORY_MAP[cleaned] };
  const key = Object.keys(CATEGORY_MAP).find((k) => cleaned.includes(k.split('-')[0]));
  if (key) return { slug: cleaned, ...CATEGORY_MAP[key] };
  return {
    slug: cleaned,
    ar: cleaned,
    arShort: cleaned,
    categoryPage: 'front-lips-splitters',
    partType: 'other',
    arPartName: 'قطعة كربون',
  };
}

function findImages(productDir) {
  const all = fs.readdirSync(productDir);
  const images = [];
  for (const f of all) {
    const lower = f.toLowerCase();
    if (IMAGE_EXTS.some((e) => lower.endsWith(e))) images.push(f);
  }
  // 按数字排序优先，然后按名字
  images.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '999', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '999', 10);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
  return images.slice(0, MAX_IMAGES);
}

function dirNameToSlug(dirName) {
  return dirName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildProductSlug(chassisCodes, productDirName) {
  const chassisCodesInName = extractChassisCodes(productDirName);
  let cleanedName = productDirName;
  const sortedCodes = [...chassisCodesInName].sort((a, b) => b.length - a.length);
  for (const code of sortedCodes) {
    cleanedName = cleanedName.replace(new RegExp(`^${code}-?`, 'i'), '');
  }
  if (cleanedName.length < 3) cleanedName = productDirName;
  const baseSlug = dirNameToSlug(cleanedName);
  const chassisSlug = chassisCodes.join('-').toLowerCase();
  return `bmw-${chassisSlug}-carbon-fiber-${baseSlug}`;
}

// ──────────────────── Sharp 处理单张图 ────────────────────
async function processOneImage(srcPath, productSlug, index, destDir) {
  // 输入文件名：{slug}-01.webp / {slug}-01-md.webp / {slug}-01-sm.webp
  const outputs = [];
  const num = String(index + 1).padStart(2, '0');
  const pipe = sharp(srcPath, { failOn: 'none' });

  for (const size of SIZES) {
    const filename = `${productSlug}-${num}${size.suffix === 'lg' ? '' : '-' + size.suffix}.webp`;
    const outPath = path.join(destDir, filename);
    const urlPath = `/images/products/${productSlug}/${filename}`;
    try {
      await pipe
        .clone()
        .rotate() // 根据 EXIF 方向旋转
        .resize(size.width, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: size.quality, effort: 4 })
        .toFile(outPath);

      const meta = await sharp(outPath).metadata();
      outputs.push({
        suffix: size.suffix,
        url: urlPath,
        width: meta.width || size.width,
        height: meta.height || Math.round(size.width * 0.75),
      });
    } catch (e) {
      console.log(`      ⚠️ 图片处理失败 ${filename}: ${e.message}`);
    }
  }
  return outputs;
}

// ──────────────────── 主流程 ────────────────────
async function main() {
  const TEMP_DIR = path.join(ROOT, 'temp');
  const PUBLIC_IMG_DIR = path.join(ROOT, 'public', 'images', 'products');
  const OUTPUT_TS = path.join(ROOT, 'src', 'data', 'b2b', 'all-products.ts');

  // 清理旧产物
  fs.rmSync(PUBLIC_IMG_DIR, { recursive: true, force: true });
  console.log('🧹 已清理旧图片目录');

  const chassisDirs = fs.readdirSync(TEMP_DIR).filter((d) => {
    try {
      return fs.statSync(path.join(TEMP_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });

  console.log(`📂 发现 ${chassisDirs.length} 个底盘目录\n`);

  const allProducts = [];
  let totalImages = 0;
  let totalOutFiles = 0;

  for (const chassisDir of chassisDirs) {
    const chassisCodes = extractChassisCodes(chassisDir);
    const chassisPath = path.join(TEMP_DIR, chassisDir);
    const categoryDirs = fs.readdirSync(chassisPath).filter((d) => {
      try {
        return fs.statSync(path.join(chassisPath, d)).isDirectory();
      } catch {
        return false;
      }
    });

    console.log(`🔧 ${chassisDir} (${chassisCodes.join('/')}): ${categoryDirs.length} 个部件分类`);

    for (const catDir of categoryDirs) {
      const category = parseCategory(catDir);
      const catPath = path.join(chassisPath, catDir);
      let productDirs = [];
      try {
        productDirs = fs.readdirSync(catPath).filter((d) => {
          try {
            return fs.statSync(path.join(catPath, d)).isDirectory();
          } catch {
            return false;
          }
        });
      } catch {
        const directFiles = fs.readdirSync(catPath);
        if (directFiles.some((f) => IMAGE_EXTS.some((e) => f.toLowerCase().endsWith(e)))) {
          productDirs = [catDir];
        }
      }

      for (const productDirName of productDirs) {
        const productDir = path.join(catPath, productDirName);
        if (!fs.existsSync(productDir)) continue;

        const sourceImages = findImages(productDir);
        if (sourceImages.length === 0) continue;

        const slug = buildProductSlug(chassisCodes, productDirName);
        const publicDestDir = path.join(PUBLIC_IMG_DIR, slug);
        fs.mkdirSync(publicDestDir, { recursive: true });

        // Sharp 处理每张图
        const processedImages = []; // [{ lg, md, sm }]
        for (let i = 0; i < sourceImages.length; i++) {
          const src = path.join(productDir, sourceImages[i]);
          const out = await processOneImage(src, slug, i, publicDestDir);
          // 按 suffix 重建对象
          const grouped = {};
          for (const o of out) grouped[o.suffix] = { url: o.url, width: o.width, height: o.height };
          processedImages.push(grouped);
          totalOutFiles += out.length;
        }

        if (processedImages.length === 0) continue;

        totalImages += sourceImages.length;

        // 构造产品对象
        const { product } = buildProductData({
          slug,
          productDirName,
          chassisCodes,
          category,
          processedImages,
        });
        allProducts.push(product);
        console.log(`      ✅ ${slug} (${processedImages.length} 图 → ${processedImages.length * SIZES.length} 文件)`);
      }
    }
  }

  // Keep previously published products that are not part of this image batch.
  const legacyPath = path.join(ROOT, 'src/data/b2b/legacy-products.json');
  if (fs.existsSync(legacyPath)) {
    for (const legacy of JSON.parse(fs.readFileSync(legacyPath, 'utf8'))) {
      if (!allProducts.some((p) => p.slug === legacy.slug)) allProducts.push(normalizeProduct(legacy));
    }
  }
  // 去重
  const seenSlugs = new Set();
  const uniqueProducts = [];
  for (const p of allProducts) {
    if (seenSlugs.has(p.slug)) {
      p.slug = p.slug + '-' + p.chassisCodes.join('-').toLowerCase();
    }
    seenSlugs.add(p.slug);
    uniqueProducts.push(p);
  }

  console.log(`\n📦 ${uniqueProducts.length} 个产品 · ${totalImages} 张原图 → ${totalOutFiles} 个 webp 文件`);
  if (new Set(uniqueProducts.map((p) => p.seoTitle)).size !== uniqueProducts.length) {
    throw new Error('Duplicate product titles: review part/style/ACC variants before publishing.');
  }

  // 生成 TypeScript 文件
  const tsContent = `// AUTO-GENERATED BY scripts/scan-products.mjs — DO NOT EDIT MANUALLY
// 生成于 ${new Date().toISOString()}
// Sharp 处理: ${SIZES.map((s) => `${s.suffix}=${s.width}px`).join(', ')} / webp

export interface ImageVariant { url: string; width: number; height: number; }
export interface ProductImage { lg: ImageVariant; md: ImageVariant; sm: ImageVariant; }

export interface ProductDetail {
  slug: string;
  productDirName: string;
  title: string;
  description: string;
  /** 优化后的 SEO 标题 (50-60 字符，核心关键词前置) */
  seoTitle: string;
  /** 优化后的 SEO 描述 (150-160 字符) */
  seoDescription: string;
  /** 阿拉伯语关键词数组 (用于 meta keywords) */
  keywords: string[];
  categorySlug: string;
  categoryAr: string;
  categoryArShort: string;
  partType: string;
  chassisCodes: string[];
  model: string;
  yearStart: number;
  yearEnd: number;
  material: string;
  manufacturing: string;
  images: ProductImage[];
  imageCount: number;
  featuredImage: string;   // lg URL of first image
  featuredSm: string;      // sm URL of first image (for related cards)
  checks: string[];
  specs: Array<[string, string]>;
  intentSegments: string[];
}

export const allProducts: ProductDetail[] = ${JSON.stringify(uniqueProducts, null, 2)};

export function groupByCategory(products: ProductDetail[]): Record<string, ProductDetail[]> {
  const map: Record<string, ProductDetail[]> = {};
  for (const p of products) {
    if (!map[p.categorySlug]) map[p.categorySlug] = [];
    map[p.categorySlug].push(p);
  }
  return map;
}

export function groupByChassis(products: ProductDetail[]): Record<string, ProductDetail[]> {
  const map: Record<string, ProductDetail[]> = {};
  for (const p of products) {
    for (const c of p.chassisCodes) {
      if (!map[c]) map[c] = [];
      map[c].push(p);
    }
  }
  return map;
}

export function getProductBySlug(slug: string): ProductDetail | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getFeaturedProducts(count = 6): ProductDetail[] {
  const rich = allProducts.filter((p) => p.imageCount >= 10);
  if (rich.length >= count) return rich.slice(0, count);
  return allProducts.slice(0, count);
}

export function getRelatedProducts(product: ProductDetail, count = 4): ProductDetail[] {
  const related = allProducts.filter((p) => p.slug !== product.slug &&
    (p.categorySlug === product.categorySlug ||
     p.chassisCodes.some((c) => product.chassisCodes.includes(c))));
  return related.sort((a, b) => { const score = (p: ProductDetail) => (p.categorySlug === product.categorySlug ? 2 : 0) + (p.chassisCodes.some(c => product.chassisCodes.includes(c)) ? 4 : 0); return score(b) - score(a); }).slice(0, count);
}
`;

  fs.mkdirSync(path.dirname(OUTPUT_TS), { recursive: true });
  fs.writeFileSync(OUTPUT_TS, tsContent, 'utf-8');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/sync-product-seo.mjs')], { cwd: ROOT, stdio: 'inherit' });

  // 汇总
  const byCategory = {};
  for (const p of uniqueProducts) {
    byCategory[p.categorySlug] = (byCategory[p.categorySlug] || 0) + 1;
  }
  console.log(`📝 数据源 → src/data/b2b/all-products.ts`);
  console.log(`🖼️  图片 → public/images/products/`);
  console.log(`\n📊 分类统计:`);
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${n}`);
  }
  console.log(`\n✅ 完成！${uniqueProducts.length} 个产品，全部 webp + 多尺寸 + SEO 文件名。`);
}

// ──────────────────── 产品数据构造 ────────────────────
function buildProductData({ slug, productDirName, chassisCodes, category, processedImages }) {
  const product = {
    slug,
    productDirName,
    chassisCodes,
    title: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
    keywords: [],
    categorySlug: category.categoryPage,
    categoryAr: category.ar,
    categoryArShort: category.arShort,
    partType: category.partType,
    model: '',
    yearStart: 0,
    yearEnd: 9999,
    material: '',
    manufacturing: '',
    images: processedImages,
    imageCount: processedImages.length,
    featuredImage: processedImages[0]?.lg.url || '',
    featuredSm: processedImages[0]?.sm.url || '',
    checks: [],
    specs: [],
    intentSegments: [],
  };
  return { product: normalizeProduct(product) };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
