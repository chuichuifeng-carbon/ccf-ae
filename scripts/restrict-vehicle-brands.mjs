import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const allowed = new Set(['bmw', 'mercedes-amg', 'porsche']);
const excluded =
  /\b(?:audi|ferrari|lamborghini|aston|bentley|cadillac|alfa|volkswagen|mclaren|maserati|tesla|pagani|kia|hyundai|hurac[aá]n|aventador|revuelto|urus|purosangue|sf90|artura|db11|dbx)\b|أودي|فيراري|لامبور|مازيراتي|أستون|بنتلي|كاديلاك|فولكس/i;
const removedRoutes = [
  '/vehicles/audi',
  '/vehicles/ferrari',
  '/vehicles/lamborghini',
  '/cases/european-football-player-carbon-fiber',
];

function closeArray(text, start) {
  let depth = 0,
    quote = '';
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = '';
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c;
      continue;
    }
    if (c === '[') depth++;
    if (c === ']' && --depth === 0) return i + 1;
  }
  throw new Error('Unclosed widget array');
}
function cleanCards(text) {
  for (const match of [...text.matchAll(/items=\{\[/g)].reverse()) {
    const start = match.index + match[0].length - 1;
    const end = closeArray(text, start);
    const source = ts.createSourceFile(
      'cards.ts',
      `const items=${text.slice(start, end)};`,
      ts.ScriptTarget.Latest,
      true
    );
    const array = source.statements[0].declarationList.declarations[0].initializer;
    const cards = array.elements.map((item) => item.getText(source));
    const keep = cards.filter(
      (card) => !excluded.test(card) && !card.includes('/cases/european-football-player-carbon-fiber')
    );
    if (keep.length !== cards.length) text = text.slice(0, start) + '[\n' + keep.join(',\n') + '\n]' + text.slice(end);
  }
  return text;
}
for (const file of fs.readdirSync('src/pages', { recursive: true }).filter((file) => file.endsWith('.astro'))) {
  const name = path.join('src/pages', file);
  const old = fs.readFileSync(name, 'utf8');
  fs.writeFileSync(name, cleanCards(old));
}

const catalogs = JSON.parse(fs.readFileSync('src/data/b2b/catalogs.json', 'utf8')).filter((group) =>
  allowed.has(group.brand)
);
fs.writeFileSync('src/data/b2b/catalogs.json', JSON.stringify(catalogs, null, 2) + '\n');
const products = JSON.parse(fs.readFileSync('src/data/b2b/product-images.json', 'utf8'));
const removedImages = [];
for (const [key, value] of Object.entries(products))
  if (excluded.test(key)) {
    removedImages.push(value.image);
    delete products[key];
  }
fs.writeFileSync('src/data/b2b/product-images.json', JSON.stringify(products, null, 2) + '\n');

const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
for (const route of removedRoutes) delete seo[route];
const descriptions = {
  '/': 'تعرّف على CCF، مصنع قطع كربون السيارات في الصين. يركز هذا الموقع على BMW وMercedes-AMG وPorsche، مع كتالوجات وتوريد B2B واستفسارات واتساب.',
  '/vehicles':
    'اختر قطع ألياف الكربون لسيارات BMW وMercedes-AMG وPorsche. تصفّح كتالوجات الطرازات وأرسل المركبة والمرجع والكمية للتحقق من المطابقة والتوفر.',
  '/catalogs':
    'افتح كتالوجات PDF لسيارات BMW وMercedes-AMG وPorsche حسب الطراز. أرسل اسم الكتالوج ورقم المرجع والكمية والوجهة لطلب عرض سعر عبر واتساب.',
  '/products/grilles-air-intake':
    'استعرض شبكات كربون وقطع فتحات هواء لسيارات BMW. أرسل صورة المصد والتجهيزات والمرجع لتأكيد النسخة المطلوبة وطلب عرض سعر من CCF.',
  '/products/side-skirts':
    'تصفّح قطع الكربون الجانبية لسيارات BMW وMercedes-AMG. أكّد نسخة الهيكل والتصميم ومحتويات الطقم مع CCF قبل طلب التوريد.',
  '/products/spoilers-wings':
    'اختر سبويلر أو جناح كربون خلفياً من تصاميم BMW M المختارة. أرسل المرجع والطراز والكمية لتأكيد التثبيت ومحتويات التوريد وطلب السعر.',
  '/cases':
    'اطّلع على زيارات عملاء من الولايات المتحدة وكندا إلى CCF. شاهد صور مناقشات التوريد ومراجعة المنتجات وتعرّف على طرق تقييم المورد.',
};
for (const [route, description] of Object.entries(descriptions)) seo[route].description = description;
fs.writeFileSync('src/data/seo.json', JSON.stringify(seo, null, 2) + '\n');

// Update current implementation records; old audits remain historical evidence outside public/.
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
plan.pages = plan.pages.filter((row) => !removedRoutes.includes(row.route));
for (const row of plan.pages) {
  const record = seo[row.route];
  row.description = record.description;
  row.ogDescription = record.description;
  row.twitterDescription = record.description;
  row.descriptionCharacters = [...record.description].length;
  for (const field of ['currentDescription', 'currentTitle', 'currentH1', 'intentCN', 'notesCN'])
    if (row[field] && excluded.test(row[field])) row[field] = '已按当前三个车辆品牌的范围重新整理。';
  row.supportingKeywords = (row.supportingKeywords || []).filter((term) => !excluded.test(term));
}
plan.scope = 'BMW, Mercedes-AMG, Porsche';
plan.nonHtmlResources = plan.nonHtmlResources.map((row) => ({
  ...row,
  action: row.action.replace('链接到 ccfrp.com 的 PDF 和英文产品页', '保留品牌的 PDF 和英文产品页'),
}));
fs.writeFileSync('reports/seo-metadata-plan/metadata-plan.json', JSON.stringify(plan, null, 2) + '\n');

let navigation = fs.readFileSync('src/navigation.ts', 'utf8');
navigation = navigation
  .split('\n')
  .filter((line) => !excluded.test(line))
  .join('\n');
fs.writeFileSync('src/navigation.ts', navigation);
let imageMap = fs.readFileSync('src/utils/siteImages.ts', 'utf8');
imageMap = imageMap
  .split('\n')
  .filter((line) => !excluded.test(line))
  .join('\n')
  .replace(
    "mercedes: '/images/brand-mercedes.webp'",
    "mercedes: '/images/verified/ccf-customer-03-mercedes-front-installed.webp'"
  )
  .replace("garage: '/images/garage-custom.webp'", "garage: '/images/brand-bmw.webp'");
fs.writeFileSync('src/utils/siteImages.ts', imageMap);

// Explicit, workspace-bounded files only; no recursive removal or computed external paths.
const publicRoot = path.resolve('public');
const deletions = [
  ...removedImages,
  '/images/brand-audi.webp',
  '/images/brand-ferrari.webp',
  '/images/brand-lamborghini.webp',
  '/images/brand-mercedes.webp',
  '/images/garage-custom.webp',
  ...fs
    .readdirSync('public/images/verified')
    .filter((file) =>
      /european-footballer|bespoke-supercar|custom-supercar|completed-bespoke|custom-carbon-fiber-(helmet|baseball|necklace|mask)/.test(
        file
      )
    )
    .map((file) => '/images/verified/' + file),
];
for (const relative of deletions) {
  const resolved = path.resolve('public', '.' + relative);
  if (!resolved.startsWith(publicRoot + path.sep)) throw new Error(`Unsafe path: ${resolved}`);
  if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
}
fs.mkdirSync('reports/brand-scope-2026-10-31', { recursive: true });
fs.writeFileSync(
  'reports/brand-scope-2026-10-31/changes.json',
  JSON.stringify(
    {
      allowedBrands: [...allowed],
      removedRoutes,
      removedImages: deletions,
      remainingCatalogs: catalogs.reduce((n, g) => n + g.entries.length, 0),
      remainingProductImages: Object.keys(products).length,
    },
    null,
    2
  ) + '\n'
);
console.log('Removed excluded brand cards, data, routes from metadata, and their explicit image assets.');
