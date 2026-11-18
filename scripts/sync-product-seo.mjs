import fs from 'node:fs';
import { allProducts } from '../src/data/b2b/all-products.ts';
import { productCategories } from '../src/data/b2b/product-content.ts';

// Run after image import. Metadata, sitemap membership and QA share these records.
const seoPath = 'src/data/seo.json';
const planPath = 'reports/seo-metadata-plan/metadata-plan.json';
const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const base = 'https://amxnx.vip';
const canonicalUrl = (route) => base + route.replace(/\/$/, '') + '/';
const exemplar = plan.pages.find((p) => p.route === '/products/hoods');
const categorySeo = JSON.parse(fs.readFileSync('src/data/b2b/category-seo.json', 'utf8'));
const records = allProducts.map((p) => ({
  route: `/products/${p.slug}`,
  title: p.seoTitle,
  h1: p.title,
  description: p.seoDescription,
  image: p.images[0].lg.url,
  imageWidth: p.images[0].lg.width,
  imageHeight: p.images[0].lg.height,
  sourceFile: 'src/pages/products/[slug].astro',
  group: '产品详情',
  intentCN: '按具体部件、车型/底盘、款式与配置识别产品，确认适配、材料、包含内容及批量报价',
}));
for (const slug of Object.keys(productCategories)) {
  const p = allProducts.find((p) => p.categorySlug === slug);
  const h1 = `${productCategories[slug]} для BMW`;
  records.push({
    route: `/products/${slug}`,
    title: `${categorySeo[slug].title} | CCF`,
    h1,
    description: categorySeo[slug].description,
    image: p.featuredImage,
    imageWidth: p.images[0].lg.width,
    imageHeight: p.images[0].lg.height,
    sourceFile: `src/pages/products/${slug}.astro`,
    group: '产品分类',
    intentCN: '按部件类型浏览并进入具体产品，确认车型与采购条件',
  });
}
// Drop metadata for products whose slug changed, so the plan stays in sync with the build.
const validRoutes = new Set(records.map((r) => r.route));
for (const route of Object.keys(seo)) {
  if (route.startsWith('/products/') && !validRoutes.has(route)) delete seo[route];
}
plan.pages = plan.pages.filter((page) => !(page.route.startsWith('/products/') && !validRoutes.has(page.route)));

for (const r of records) {
  seo[r.route] = {
    title: r.title,
    description: r.description,
    h1: r.h1,
    canonicalPath: r.route,
    index: true,
    sitemap: true,
    ogType: 'website',
    image: r.image,
    imageWidth: r.imageWidth,
    imageHeight: r.imageHeight,
  };
  const existing = plan.pages.find((p) => p.route === r.route);
  const row = {
    ...structuredClone(exemplar),
    ...existing,
    ...r,
    id: existing?.id || String(plan.pages.length + 1),
    url: canonicalUrl(r.route),
    canonical: canonicalUrl(r.route),
    file: r.route.slice(1) + '/index.html',
    focusKeyword: r.h1,
    supportingKeywords: ['BMW', 'оптом', 'производитель'],
    titleCharacters: [...r.title].length,
    descriptionCharacters: [...r.description].length,
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
    ogType: 'website',
    ogLocale: 'ru_RU',
    ogTitle: r.title,
    ogDescription: r.description,
    ogUrl: canonicalUrl(r.route),
    ogImage: base + r.image,
    twitterTitle: r.title,
    twitterDescription: r.description,
    twitterImage: base + r.image,
    implementationStatus: '本地优化并纳入逐页QA；待部署',
    notesCN: '产品参数未知项需询价确认；不使用虚构报价、库存或统一退货承诺。',
  };
  if (existing) Object.assign(existing, row);
  else plan.pages.push(row);
}
plan.status = `当前 ${plan.pages.length} 页；产品数据与元数据同步，运行验证后部署`;
fs.writeFileSync(seoPath, JSON.stringify(seo, null, 2) + '\n');
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n');
console.log(`Synchronized ${records.length} product/category records; ${plan.pages.length} total pages.`);
