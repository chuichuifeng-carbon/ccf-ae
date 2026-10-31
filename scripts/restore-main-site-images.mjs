import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const base = 'https://ccfrp.com';
const root = 'reports/image-restoration-2026-10-31';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
const attrs = (n) => Object.fromEntries((n.attrs || []).map((a) => [a.name, a.value]));
const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join(' '));
function find(n, predicate) {
  if (predicate(n)) return n;
  for (const c of n.childNodes || []) {
    const result = find(c, predicate);
    if (result) return result;
  }
}
function all(n, predicate, result = []) {
  if (predicate(n)) result.push(n);
  for (const c of n.childNodes || []) all(c, predicate, result);
  return result;
}
const imageMap = new Map();
const known = read('src/data/b2b/product-images.json');
const evidence = read('src/data/b2b/evidence.json');
for (const value of Object.values(known)) imageMap.set(value.sourceImage, value.image);
for (const item of evidence) imageMap.set(item.source, item.url);
const tasks = new Map();
function image(src) {
  const url = new URL(src, base).toString();
  if (imageMap.has(url)) return imageMap.get(url);
  if (!url.startsWith(base + '/wp-content/uploads/')) throw new Error(`Unexpected image origin: ${url}`);
  const local = '/images/restored/' + path.basename(new URL(url).pathname);
  tasks.set(url, local);
  imageMap.set(url, local);
  return local;
}

// Restore one matching model photo for every existing catalog entry, without changing the catalog URLs.
const catalogs = read('src/data/b2b/catalogs.json');
for (const group of catalogs) {
  const extracted = read(`reports/model-cards-2026-10-31/${group.brand}-extracted.json`);
  const direct = extracted.cards.filter((c) => c.href.includes('.pdf') && c.media.some((m) => m.src));
  for (const entry of group.entries) {
    let card = direct.findLast((c) => new URL(c.href, base).href === entry.url);
    let src = card?.media.find((m) => m.src)?.src;
    if (!src && group.brand === 'bmw') {
      const slugs = { 'G80/G82': 'bmw-g80-g82-m3-m4', 'G87 M2': 'bmw-g87-m2', 'G90 M5': 'bmw-g90-m5' };
      src = extracted.images.find((m) => m.src.includes(slugs[entry.model] || 'NO_MATCH'))?.src;
    }
    if (!src) throw new Error(`Missing exact model image: ${group.brand} ${entry.model}`);
    entry.image = image(src);
    entry.imageAlt = `صورة مرجعية لطراز ${group.brand === 'bmw' ? 'BMW' : group.brand === 'porsche' ? 'Porsche' : 'Mercedes-AMG'} ${entry.model}`;
    entry.imageSource = new URL(src, base).href;
  }
}

const phrases = [
  ['Three-Piece', 'ثلاث قطع'],
  ['Curved Profile', 'شكل منحني'],
  ['Center Insert', 'قطعة وسطية'],
  ['Multi-Piece', 'قطع متعددة'],
  ['Center-Exit Reference', 'مرجع بمخرج وسطي'],
  ['Side Skirt Extensions', 'امتدادات جانبية'],
  ['Slim Profile', 'شكل نحيف'],
  ['Front Bumper Corner Splitters', 'قطع زوايا المصد الأمامي'],
  ['Rear Bumper Corner Extensions', 'امتدادات زوايا المصد الخلفي'],
  ['Rear Exhaust Surround Trim', 'زخرفة محيط مخارج العادم الخلفية'],
  ['Front Bumper Vent Frames', 'إطارات فتحات المصد الأمامي'],
  ['Front Bumper Vent Inserts', 'قطع فتحات المصد الأمامي'],
  ['Front Bumper Canards', 'زعانف المصد الأمامي'],
  ['Rear Diffuser Surround Trim', 'زخرفة محيط الناشر الخلفي'],
  ['Shark Fin Antenna Cover', 'غطاء هوائي زعنفة القرش'],
  ['Fuel Cap Trim Cover', 'غطاء زخرفي لفتحة الوقود'],
  ['Hood Vent Trim', 'زخرفة فتحات غطاء المحرك'],
  ['Fender Vent Trim', 'زخرفة فتحات الرفارف'],
  ['Rear Bumper Trim', 'زخرفة المصد الخلفي'],
  ['Replacement Mirror Caps', 'أغطية مرايا بديلة'],
  ['Kidney Grilles', 'شبكات أمامية كيدني'],
  ['Kidney Grille', 'شبك أمامي كيدني'],
  ['Lower Front Grille', 'شبك أمامي سفلي'],
  ['Front Grille', 'شبك أمامي'],
  ['Grille Inserts', 'قطع الشبك الأمامي'],
  ['Three-Piece Front Lip', 'شفة أمامية من ثلاث قطع'],
  ['Front Lip', 'شفة أمامية'],
  ['Rear Diffuser', 'ناشر خلفي'],
  ['Side Skirt Set', 'طقم قطع جانبية'],
  ['Side Skirts', 'تنانير جانبية'],
  ['Rear Spoiler', 'سبويلر خلفي'],
  ['Rear Wing', 'جناح خلفي'],
  ['Trunk Lid', 'غطاء صندوق الأمتعة'],
  ['Mirror Caps', 'أغطية مرايا'],
  ['Mirror Cap', 'غطاء مرآة'],
  ['Fender Trim', 'زخرفة الرفارف'],
  ['Rear Corner Extensions', 'امتدادات الزوايا الخلفية'],
  ['Bumper Vent Frames', 'إطارات فتحات المصد'],
  ['Hood', 'غطاء محرك'],
  ['Carbon Fiber', 'ألياف الكربون'],
  ['Gloss Black', 'أسود لامع'],
  ['Forged-Pattern', 'نمط كربون مطروق'],
  ['Cross-Brace Design', 'تصميم بدعامات متقاطعة'],
  ['Center-Light Design', 'تصميم بإضاءة وسطية'],
  ['Center Light', 'إضاءة وسطية'],
  ['Split-Section', 'قسم منفصل'],
  ['Multi-Section', 'أقسام متعددة'],
  ['Flat Profile', 'شكل مسطح'],
  ['Flat-Profile', 'شكل مسطح'],
  ['Multi-Fin', 'زعانف متعددة'],
  ['Multi-Element', 'عناصر متعددة'],
  ['Design', 'تصميم'],
  ['Style', 'تصميم'],
];
const products = {};
for (const name of ['aero-parts', 'hoods-trunk-lids', 'grilles-exterior-trim']) {
  const doc = parse(fs.readFileSync(`${root}/-products-${name}-source.txt`, 'utf8'));
  for (const card of all(doc, (n) => n.tagName === 'a' && attrs(n).class?.split(' ').includes('card'))) {
    const href = attrs(card).href;
    if (!/^https:\/\/ccfrp\.com\/(?:bmw|mercedes|porsche)/.test(href || '')) continue;
    const photo = attrs(find(card, (n) => n.tagName === 'img'));
    const model = text(find(card, (n) => attrs(n).class === 'model')).trim();
    const sourceTitle = text(find(card, (n) => n.tagName === 'h3')).trim();
    let section = card.parentNode;
    while (section && !attrs(section).id) section = section.parentNode;
    let category = attrs(section).id;
    category = { 'front-lips': 'front-lips-splitters', grilles: 'grilles-air-intake' }[category] || category;
    let title = sourceTitle.replace(model, '').trim();
    for (const [en, ar] of phrases) title = title.replaceAll(en, ar);
    title = title.replace(/^ألياف الكربون (.+?)(?= —|$)/, '$1 من ألياف الكربون');
    title = title.replace(/([A-Za-z0-9-]+)-تصميم/g, 'تصميم $1');
    title = `${title} — ${model}`;
    const item = {
      model,
      title,
      sourceTitle,
      source: href,
      image: known[href]?.image || image(photo.src),
      imageSource: new URL(photo.src, base).href,
    };
    (products[category] ||= []).push(item);
    if (!known[href])
      known[href] = {
        slug: new URL(href).pathname.split('/').filter(Boolean)[0],
        image: item.image,
        sourceImage: item.imageSource,
      };
  }
}

const galleries = {};
const selected = {
  '/': [
    'automotive-carbon-fiber-prepreg-layup-2.webp',
    'automotive-carbon-fiber-autoclave-curin-2.webp',
    'finished-dry-carbon-fiber-automotive-parts-2.webp',
  ],
  '/grow': [
    'finished-dry-carbon-fiber-automotive-parts.webp',
    'automotive-carbon-fiber-prepreg-layup.webp',
    'usa-customer-carbon-fiber-project-discussion.webp',
  ],
  '/grow/wholesale': [
    'finished-dry-carbon-fiber-automotive-parts.webp',
    'ccf-automotive-carbon-fiber-production-workshop.webp',
    'carbon-fiber-parts-trimming-polishing.webp',
  ],
  '/grow/oem-odm': [
    'automotive-carbon-fiber-molding-process-1.webp',
    'automotive-carbon-fiber-parts-production.webp',
    'finished-dry-carbon-fiber-automotive-part.webp',
    'carbon-fiber-hoods.webp',
    '006-bmw-g80-g82-carbon-fiber-front-grille-csl-style-reference-02new.jpg',
    'ccf-automotive-carbon-fiber-production-workshop.webp',
  ],
  '/grow/dropshipping': [
    'carbon-fiber-front-lips-splitters.webp',
    'carbon-fiber-rear-diffusers.webp',
    'carbon-fiber-rear-spoilers-wings.webp',
  ],
  '/grow/channel-partners': [
    'usa-customer-carbon-fiber-project-discussion.webp',
    'canada-customer-carbon-fiber-business-meeting.webp',
    'canada-customer-bmw-carbon-fiber-parts-order.webp',
  ],
};
const captions = {
  'automotive-carbon-fiber-prepreg-layup-2.webp': 'تجهيز ألياف الكربون في ورشة CCF',
  'automotive-carbon-fiber-autoclave-curin-2.webp': 'معدات المعالجة في ورشة CCF',
  'finished-dry-carbon-fiber-automotive-parts-2.webp': 'قطع ألياف الكربون خلال الإنتاج',
  'finished-dry-carbon-fiber-automotive-parts.webp': 'مجموعة قطع ألياف الكربون في المصنع',
  'automotive-carbon-fiber-prepreg-layup.webp': 'تجهيز ألياف الكربون ضمن عملية التصنيع',
  'usa-customer-carbon-fiber-project-discussion.webp': 'مناقشة مشروع مع عميل أمريكي',
  'ccf-automotive-carbon-fiber-production-workshop.webp': 'ورشة إنتاج CCF',
  'carbon-fiber-parts-trimming-polishing.webp': 'قص وتشطيب قطع ألياف الكربون',
  'automotive-carbon-fiber-molding-process-1.webp': 'القالب والتغليف بغشاء التفريغ',
  'automotive-carbon-fiber-parts-production.webp': 'تجهيز المكونات في ورشة الإنتاج',
  'finished-dry-carbon-fiber-automotive-part.webp': 'ألواح وقطع خلال مراحل الإنتاج',
  'carbon-fiber-hoods.webp': 'غطاء محرك من مجموعة المنتجات',
  '006-bmw-g80-g82-carbon-fiber-front-grille-csl-style-reference-02new.jpg': 'شبك أمامي بتصميم CSL لسيارات BMW G80/G82',
  'carbon-fiber-front-lips-splitters.webp': 'شفاه أمامية وسبليتر من مجموعة المنتجات',
  'carbon-fiber-rear-diffusers.webp': 'ناشرات خلفية من مجموعة المنتجات',
  'carbon-fiber-rear-spoilers-wings.webp': 'أجنحة وسبويلر من مجموعة المنتجات',
  'canada-customer-carbon-fiber-business-meeting.webp': 'مناقشة متطلبات التعاون مع عميل كندي',
  'canada-customer-bmw-carbon-fiber-parts-order.webp': 'طلب قطع BMW لعميل كندي',
};
for (const [route, names] of Object.entries(selected)) {
  const snapshot = read(`${root}/${(route === '/' ? '/' : route + '/').replaceAll('/', '-')}.json`);
  galleries[route] = {
    title: route === '/' ? 'صور من مراحل الإنتاج' : 'صور المنتجات والتعاون مع CCF',
    images: names.map((name) => {
      const found = snapshot.images.find((item) => item.src.endsWith(name));
      if (!found) throw new Error(`Missing source image: ${route} ${name}`);
      return { image: image(found.src), alt: captions[name], source: new URL(found.src, base).href };
    }),
  };
}
// Recover the exact category and brand artwork from the main site.
const artwork = {};
const overview = read(`${root}/-products-.json`);
for (const item of overview.images.slice(0, 8))
  artwork[path.basename(new URL(item.src, base).pathname)] = image(item.src);
const vehicles = read(`${root}/-vehicles-.json`);
for (const brand of ['bmw', 'mercedes-amg', 'porsche']) {
  const item = vehicles.images.find((i) => path.basename(i.src) === `${brand}-carbon-fiber-parts-by-vehicle.webp`);
  if (!item) throw new Error(`Missing brand artwork ${brand}`);
  artwork[brand] = image(item.src);
}
const cases = read(`${root}/-cases-.json`);
artwork.caseUs = image(cases.images.find((item) => item.src.includes('usa-customer')).src);
artwork.caseCanada = image(cases.images.find((item) => item.src.includes('canada-customer')).src);

// Recover the additional photographs on the four existing local product-detail pages.
const details = {};
for (const slug of [
  'bmw-g80-g82-carbon-fiber-front-lip-r44-style',
  'bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style',
  'bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style',
  'bmw-g87-m2-carbon-fiber-hood',
]) {
  const response = await fetch(`${base}/${slug}/`);
  if (!response.ok) throw new Error(`Product source failed: ${slug}`);
  const doc = parse(await response.text());
  const stem = path.basename(known[`${base}/${slug}/`].sourceImage).split('-reference-')[0];
  const photos = all(doc, (n) => n.tagName === 'img')
    .map(attrs)
    .filter((a) => a.src?.includes(stem + '-reference-') && /reference-0[1-9]/.test(a.src));
  const unique = [...new Map(photos.map((p) => [p.src, p])).values()];
  details[slug] = unique.map((p, index) => ({
    image: image(p.src),
    alt: `صورة المنتج ${index + 1} — ${slug.includes('hood') ? 'غطاء محرك BMW G87 M2' : slug.includes('diffuser') ? 'ناشر خلفي BMW G80/G82' : 'شفة أمامية BMW G80/G82'}`,
    source: new URL(p.src, base).href,
  }));
}

fs.mkdirSync('public/images/restored', { recursive: true });
const downloads = [...tasks];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    let entry;
    while ((entry = downloads.shift())) {
      const [url, local] = entry;
      if (fs.existsSync(`public${local}`)) continue;
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Image download ${response.status}: ${url}`);
      if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Not an image: ${url}`);
      fs.writeFileSync(`public${local}`, Buffer.from(await response.arrayBuffer()));
    }
  })
);
write('src/data/b2b/catalogs.json', catalogs);
write('src/data/b2b/product-images.json', known);
write('src/data/b2b/product-collections.json', products);
write('src/data/b2b/page-galleries.json', galleries);
write('src/data/b2b/product-galleries.json', details);
write('src/data/b2b/site-artwork.json', artwork);
write(
  `${root}/asset-sources.json`,
  [...imageMap].map(([source, image]) => ({ source, image }))
);
console.log(
  JSON.stringify({
    modelCards: catalogs.reduce((n, g) => n + g.entries.length, 0),
    products: Object.fromEntries(Object.entries(products).map(([k, v]) => [k, v.length])),
    downloaded: tasks.size,
    galleries: Object.keys(galleries).length,
    detailPhotos: Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.length])),
  })
);
