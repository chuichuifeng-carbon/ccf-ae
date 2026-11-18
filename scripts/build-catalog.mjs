#!/usr/bin/env node
/**
 * Full catalogue build — source of truth: 完整产品图片/ALL.xlsx + image folders.
 *
 * Usage:
 *   node scripts/build-catalog.mjs --dry     # report only, writes nothing
 *   node scripts/build-catalog.mjs           # copy images + write all-products.ts
 *
 * Cleaning rules:
 *  - Trim text, strip "-variant-N" canonicals.
 *  - Replace the fallback part type by a taxonomy match on folder leaf → parent → slug.
 *  - Generate unique Arabic/English titles (the sheet repeats 354 titles across 563 rows).
 *  - Never invent weight / thickness / years: those stay confirmation fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import sharp from 'sharp';

import { correctCslTailLights } from '../src/data/b2b/product-corrections.ts';
import { classifyProduct, productCategories } from '../src/data/b2b/product-content.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_ROOT = path.join(ROOT, '完整产品图片');
const XLSX_PATH = path.join(CATALOG_ROOT, 'ALL.xlsx');
const PUBLIC_PRODUCTS = path.join(ROOT, 'public/images/products');
const OUT_TS = path.join(ROOT, 'src/data/b2b/all-products.ts');
const DRY = process.argv.includes('--dry');
const MAX_IMAGES = 12;
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const clean = (value) =>
  String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const MODEL_BY_CHASSIS = {
  G80: 'M3',
  G81: 'M3',
  G82: 'M4',
  G83: 'M4',
  G87: 'M2',
  G90: 'M5',
  F80: 'M3',
  F82: 'M4',
  F83: 'M4',
  F87: 'M2',
  F90: 'M5',
  G20: '3 Series',
  G21: '3 Series',
  G28: '3 Series',
  G22: '4 Series',
  G23: '4 Series',
  G26: '4 Series',
  G30: '5 Series',
  G31: '5 Series',
  G38: '5 Series',
  G60: '5 Series',
  G68: '5 Series',
  G05: 'X5',
  G06: 'X6',
  G07: 'X7',
  G14: '8 Series',
  G15: '8 Series',
  G16: '8 Series',
  G29: 'Z4',
  G42: '2 Series',
  F20: '1 Series',
  F21: '1 Series',
  F22: '2 Series',
  F23: '2 Series',
  F10: '5 Series',
  F11: '5 Series',
  F15: 'X5',
  F16: 'X6',
  F25: 'X3',
  F26: 'X4',
  F30: '3 Series',
  F31: '3 Series',
  F32: '4 Series',
  F33: '4 Series',
  F34: '3 Series',
  F36: '4 Series',
  F44: '2 Series',
  F45: '2 Series',
  F46: '2 Series',
  F48: 'X1',
  F95: 'X5M',
  F96: 'X6M',
  F97: 'X3M',
  F98: 'X4M',
  E90: '3 Series',
  E91: '3 Series',
  E92: '3 Series',
  E93: '3 Series',
  E82: '1 Series',
  E87: '1 Series',
  E88: '1 Series',
  G70: '7 Series',
  U06: '2 Series',
  U11: 'X1',
  IX3: 'iX3',
  IX2: 'iX2',
  I4: 'i4',
  I5: 'i5',
};

const KIND_EN = {
  'body-kit': 'Full Body Kit',
  'engine-cover': 'Engine Bay Cover',
  'oil-pan-guard': 'Oil Pan Guard',
  'oil-cooler-guard': 'Oil Cooler Protection Plate',
  'underbody-guard': 'Underbody Guard',
  'mesh-guard': 'Mesh Debris Guard',
  'strut-brace': 'Strut Brace',
  'rear-lip': 'Rear Lip',
  'tail-light': 'Tail Lights',
  drl: 'DRL Lights',
  'antenna-cover': 'Antenna Cover',
  'wheel-arch-trim': 'Wheel Arch Trims',
  'fog-trim': 'Fog Light Trims',
  'fender-trim': 'Fender Vents',
  'fuel-cover': 'Fuel Cap Cover',
  'plate-frame': 'License Plate Frame',
  'interior-trim': 'Interior Trim Set',
  'seat-cover': 'Seat Back Covers',
  'trunk-lid': 'Trunk Lid',
  'roof-spoiler': 'Roof Spoiler',
  spoiler: 'Rear Spoiler',
  'front-lip': 'Front Lip Splitter',
  canard: 'Front Canards',
  'side-winglet': 'Side Winglets',
  'bumper-trim': 'Bumper Corner Trims',
  'bumper-vent': 'Front Bumper Air Vents',
  'bumper-extension': 'Rear Bumper Extensions',
  'air-vent': 'Air Vent Trim',
  'body-panel-set': 'Front Bumper & Fenders',
  'front-bumper': 'Front Bumper',
  'rear-bumper': 'Rear Bumper',
  fender: 'Front Fenders',
  'hood-trim': 'Hood Vent Trim',
  hood: 'Hood',
  grille: 'Front Grille',
  intake: 'Air Intake Kit',
  door: 'Doors',
  'mirror-cap': 'Mirror Covers',
  'battery-cover': 'Battery Cover',
  'radiator-cover': 'Radiator Cover',
  'side-skirt': 'Side Skirts',
  diffuser: 'Rear Diffuser',
};

const CATEGORY_SHORT_AR = {
  'front-lips-splitters': 'شفّة أمامية',
  'grilles-air-intake': 'شبك وسحب هواء',
  'side-skirts': 'تنانير جانبية',
  'mirror-caps': 'أغطية مرايا',
  hoods: 'غطاء محرك',
  'spoilers-wings': 'سبويلر',
  'rear-diffusers': 'ناشر خلفي',
  'trunk-lids': 'غطاء صندوق',
  'exterior-trim': 'زخارف خارجية',
  'interior-trim': 'زخارف داخلية',
  'body-panels': 'أجزاء هيكل',
  lighting: 'إضاءة',
  'engine-bay': 'حجرة المحرك',
};

/** Categories whose copy may honestly talk about an aggressive, sporty exterior look. */
const STYLING_CATEGORIES = new Set([
  'front-lips-splitters',
  'side-skirts',
  'spoilers-wings',
  'rear-diffusers',
  'hoods',
  'trunk-lids',
  'body-panels',
  'grilles-air-intake',
]);

/** Category-accurate sentence that frames where the part belongs. */
const CATEGORY_CONTEXT_AR = {
  'interior-trim': 'ضمن تجهيز المقصورة الداخلية والتوريد بعلامة خاصة',
  'engine-bay': 'ضمن تجهيز حجرة المحرك والتوريد بعلامة خاصة',
  lighting: 'ضمن تجهيز الإضاءة والتوريد بعلامة خاصة',
};

/**
 * Vehicle tokens present in the sheet that are models rather than chassis codes.
 * They carry no chassis number, so they must survive `chassisOf` to keep i8 / X5M pages accurate.
 */
const DIRECT_MODELS = { I8: 'i8', X5M: 'X5M', X6M: 'X6M', X3M: 'X3M', X4M: 'X4M', IX3: 'iX3', IX2: 'iX2' };

/** Model badges that appear in the product name/folder (M3, M5, X3M …) but not in `适用车型`. */
const NAME_MODELS = [
  [/\bM2\b/, 'M2'],
  [/\bM3\b/, 'M3'],
  [/\bM4\b/, 'M4'],
  [/\bM5\b/, 'M5'],
  [/\bM8\b/, 'M8'],
  [/\bX3M\b|\bX3 M\b/i, 'X3M'],
  [/\bX4M\b|\bX4 M\b/i, 'X4M'],
  [/\bX5M\b|\bX5 M\b/i, 'X5M'],
  [/\bX6M\b|\bX6 M\b/i, 'X6M'],
  [/\bi8\b/i, 'i8'],
];

function chassisOf(text) {
  return [
    ...new Set(
      (String(text).match(/\b(?:[FGEU]\d{2,3}|iX[23]|i8|X[3-6]\s?M)\b/gi) || []).map((c) =>
        c.toUpperCase().replace(/\s+/g, '')
      )
    ),
  ];
}

/** "BMW M3 / M4 G80 G82" — every token is traceable to the sheet or to the product name. */
function vehicleLabel(chassis, nameHint = '') {
  const models = [];
  const codes = [];
  for (const code of chassis) {
    const model = DIRECT_MODELS[code] || MODEL_BY_CHASSIS[code];
    if (DIRECT_MODELS[code]) {
      if (!models.includes(model)) models.push(model);
    } else {
      codes.push(code);
      if (model && !models.includes(model)) models.push(model);
    }
  }
  for (const [test, model] of NAME_MODELS) {
    if (test.test(nameHint) && !models.includes(model)) models.push(model);
  }
  const head = models.length ? `BMW ${models.join(' / ')}` : 'BMW';
  return codes.length ? `${head} ${codes.join(' ')}` : head;
}

/** Compact fitment for TDK: chassis codes, with model tokens preferred over their chassis numbers. */
function shortFitment(raw, chassis, fallback) {
  const direct = chassis.filter((code) => DIRECT_MODELS[code]).map((code) => DIRECT_MODELS[code]);
  if (direct.length) return `BMW ${direct.join(' ')}`;
  if (chassis.length) return `BMW ${chassis.join(' ')}`;
  return /universal/i.test(clean(raw)) ? 'BMW Universal' : fallback;
}

function styleOf(text) {
  const source = String(text);
  const match =
    source.match(/\b([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-Style)\b/i) ||
    source.match(/\b(Style-\d+)\b/i) ||
    source.match(/\b(Ducktail|Performance|CSL|GTS|GT4)\b/i);
  if (!match) return '';
  const tokens = match[1]
    .replace(/-/g, ' ')
    .replace(/\bBMW\b/gi, ' ')
    .replace(/\b[FGEU]\d{2,3}\b/gi, ' ')
    .replace(/\biX[23]\b/gi, ' ')
    .replace(/\bStyle\b/gi, 'Style')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  return tokens.slice(-2).join(' ');
}

/** Part families the shared taxonomy does not cover yet (interior, undertrays, eyebrows). */
const EXTRA_RULES = [
  [/\bmirror[- ]?(base|cover)/i, 'mirror-cap', 'mirror-caps', 'أغطية مرايا'],
  [/\bhud\b/i, 'interior-trim', 'interior-trim', 'غطاء شاشة HUD'],
  [/\bfog[- ]light\b/i, 'fog-trim', 'exterior-trim', 'زخارف مصابيح الضباب'],
  [/\bheadlight[- ]?eyebrow/i, 'bumper-trim', 'exterior-trim', 'زخرفة مصباح أمامي'],
  [/\bheadlight\b/i, 'bumper-trim', 'exterior-trim', 'زخرفة مصباح أمامي'],
  [/\bspats?\b/i, 'bumper-trim', 'exterior-trim', 'زخارف المصد'],
  [/\bintake\b/i, 'intake', 'grilles-air-intake', 'طقم سحب هواء'],
  [/\b(steering|paddle|shift|gear|headrest|seat|knob|interior)\b/i, 'interior-trim', 'interior-trim', 'زخرفة داخلية'],
  [/\bside[- ]?vents?\b/i, 'fender-trim', 'exterior-trim', 'زخارف فتحات جانبية'],
  [/\bundertray\b/i, 'underbody-guard', 'engine-bay', 'حماية أسفل الهيكل'],
  [/\bbumper[- ]?splitters?\b/i, 'front-lip', 'front-lips-splitters', 'شفّة أمامية'],
  [/\bexhaust\b/i, 'bumper-extension', 'rear-diffusers', 'ملحق مصد خلفي'],
  [/\bwindow\b|\bpillar\b/i, 'interior-trim', 'interior-trim', 'زخرفة داخلية'],
];

const STOP_WORDS = new Set(
  (
    'bmw front rear side left right upper lower outer inner lip splitter splitters spoiler wing diffuser skirt skirts hood ' +
    'grille canard canards mirror cover covers trim trims kit panel panels vent vents style carbon fiber dry forged part parts ' +
    'set piece full body bumper fender fenders door doors guard brace light lights tail head lamp exhaust tip tips molding ' +
    'moulding insert extension extensions winglet winglets spat spats bezel bezels eyebrow eyebrows seat seats interior engine ' +
    'bay roof ducktail performance with and for the the lci pre m performance carbonfibre fiberglass'
  ).split(/\s+/)
);

/** Distinctive words left after removing chassis, model badges, style and part words. */
function variantOf(leaf, styleEn, exclude = '') {
  const styleTokens = new Set(styleEn.toLowerCase().split(/\s+/).filter(Boolean));
  const excluded = new Set(
    exclude
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
  const words = leaf
    .replace(/\bBMW\b/gi, ' ')
    .replace(/\b[FGEU]\d{2,3}\b/gi, ' ')
    .replace(/\biX[23]\b/gi, ' ')
    .replace(/\bi8\b/gi, ' ')
    .replace(/\bX[3-6]\s?M\b/gi, ' ')
    .replace(/\bM[2-8]\b/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()) && !styleTokens.has(w.toLowerCase()))
    .filter((w) => !excluded.has(w.toLowerCase()))
    .filter((w) => /[A-Za-z]/.test(w) && w.length > 1);
  const unique = [...new Set(words)];
  return unique.slice(0, 3).join(' ');
}

/** Factual qualifiers that keep near-identical SKUs apart (piece count, ACC, LCI, mesh…). */
function qualifierOf(titleEn, leaf) {
  const title = String(titleEn).toLowerCase();
  const slug = String(leaf).toLowerCase().replace(/[-_]+/g, ' ');
  const found = [];
  const piece = title.match(/\b(\d)\s*piece\b/) || slug.match(/\b(\d)\s*piece\b/);
  if (piece) found.push(`${piece[1]}-Piece`);
  if (/\b(without acc|no acc)\b/.test(title)) found.push('Without ACC');
  else if (/\bwith acc\b/.test(title)) found.push('With ACC');
  if (/\bwith mesh\b/.test(title)) found.push('With Mesh');
  else if (/\b(without mesh|no mesh)\b/.test(title)) found.push('Without Mesh');
  if (/\bpre lci\b/.test(slug)) found.push('Pre-LCI');
  else if (/\blci\b/.test(slug)) found.push('LCI');
  const styleNumber = slug.match(/\bstyle (\d)\b(?!\s*piece)/);
  if (styleNumber && !found.some((value) => value.startsWith('Style '))) found.push(`Style ${styleNumber[1]}`);
  return found.slice(0, 2).join(' ');
}

function resolveClassification(row, leaf, parent, slug) {
  const candidates = [leaf.replace(/[-_]/g, ' '), parent.replace(/[-_]/g, ' '), slug.replace(/-/g, ' ')];
  for (const candidate of candidates) {
    const hit = classifyProduct(candidate);
    if (hit) return hit;
    for (const [test, kind, category, part] of EXTRA_RULES) {
      if (test.test(candidate)) return { kind, category, part };
    }
  }
  return null;
}

function readImages(dir) {
  if (!fs.existsSync(dir)) return [];
  const main = path.join(dir, '主图');
  const source = fs.existsSync(main) ? main : dir;
  const files = fs
    .readdirSync(source, { withFileTypes: true })
    .filter((e) => e.isFile() && IMAGE_RE.test(e.name))
    .map((e) => path.join(source, e.name));
  const pool = files.length
    ? files
    : fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .flatMap((e) => readImages(path.join(dir, e.name)));
  return pool.sort((a, b) => collator.compare(path.basename(a), path.basename(b)));
}

/** Words of the product folder name that the heading does not already carry. */
function folderDifferentiator(leaf, base) {
  const baseLower = String(base).toLowerCase();
  const extra = String(leaf)
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !baseLower.includes(word.toLowerCase()));
  return clean([...new Set(extra)].join(' '));
}

function uniqueTitle(base, seen, leaf) {
  const differentiator = folderDifferentiator(leaf, base);
  let title = base;
  if (seen.has(title) && differentiator) title = `${base} — ${differentiator}`;
  let index = 2;
  while (seen.has(title)) {
    title = `${base} — ${differentiator || 'نسخة'} ${index}`;
    index += 1;
  }
  seen.add(title);
  return title;
}

/** Arabic rendering of every marketing phrase used in the sheet (see 营销词库参考). */
const PHRASE_AR = {
  Premium: 'فاخر',
  'Aggressive Front-End Styling': 'تصميم أمامي عدواني',
  'Aggressive Aero Styling': 'تصميم أيروديناميكي عدواني',
  'Aggressive Hood Styling': 'تصميم عدواني لغطاء المحرك',
  'Aggressive Front Fascia': 'واجهة أمامية عدوانية',
  'Aggressive Side Styling': 'تصميم جانبي عدواني',
  'Aggressive Styling': 'تصميم عدواني',
  'Aggressive Rear Profile': 'مظهر خلفي عدواني',
  'Aggressive Rear-End Styling': 'تصميم خلفي عدواني',
  'Race-Inspired': 'مستوحى من السباقات',
  'Motorsport-Inspired': 'مستوحى من رياضة المحركات',
  'Bold Sporty Appearance': 'مظهر رياضي جريء',
  'Ground-Hugging Profile': 'مظهر ملتصق بالأرض',
  'Performance-Oriented': 'موجّه للأداء',
  'Sporty Rear Fascia': 'خلفية رياضية',
  'OEM+ Appearance': 'مظهر OEM+',
  'OEM+ Styling': 'تصميم OEM+',
  'Track-Focused Appearance': 'مظهر موجّه للحلبات',
  'Track-Style Appearance': 'مظهر بأسلوب الحلبات',
  'Sculpted Performance Profile': 'مظهر أداء منحوت',
  'Low-Slung Visual Profile': 'مظهر منخفض',
  'High-Impact Front-End Upgrade': 'ترقية أمامية عالية التأثير',
  'Stealth Front-End Look': 'مظهر أمامي خفي',
  'Sportier Side Profile': 'مظهر جانبي أكثر رياضية',
  'Precision-Molded': 'مصبوب بدقة',
  'Sportier Rear Silhouette': 'خط خلفي أكثر رياضية',
  'Planted Rear Stance': 'وضعية خلفية ثابتة',
  'High-Impact Front-End Detail': 'تفصيل أمامي عالي التأثير',
  'Track-Inspired': 'مستوحى من الحلبات',
  'Precision Fitment': 'مطابقة دقيقة',
  'Vehicle-Specific Design': 'تصميم خاص بالمركبة',
  'OEM Fitment (confirm)': 'مطابقة OEM (تُؤكَّد)',
  'OEM-Style Replacement': 'بديل بأسلوب OEM',
  'OEM-Style Fitment': 'مطابقة بأسلوب OEM',
  'OEM-Style Fitment (confirm)': 'مطابقة بأسلوب OEM (تُؤكَّد)',
  'Chassis-Specific Design': 'تصميم خاص بالشاسيه',
  'Direct Replacement (confirm)': 'استبدال مباشر (يُؤكَّد)',
  'OEM-Style Mounting': 'تثبيت بأسلوب OEM',
  'OEM-Style Installation': 'تركيب بأسلوب OEM',
  'Professional Installation': 'تركيب احترافي',
  'Bolt-On (confirm)': 'تثبيت بالبراغي مباشرة (يُؤكَّد)',
  'Aerodynamic Styling Upgrade': 'ترقية التصميم الأيروديناميكي',
  'Front-End Aero Styling': 'تصميم أيروديناميكي أمامي',
  'Lightweight Performance Upgrade (confirm)': 'ترقية أداء خفيفة الوزن (تُؤكَّد)',
  'Front-End Appearance Upgrade': 'ترقية المظهر الأمامي',
  'Lower Body Styling Upgrade': 'ترقية تصميم الجزء السفلي',
  'Automotive Appearance Upgrade': 'ترقية مظهر السيارة',
  'Performance Rear Styling': 'تصميم خلفي أدائي',
  'Airflow Optimization': 'تحسين تدفق الهواء',
  'Airflow Detail Upgrade': 'ترقية تفاصيل تدفق الهواء',
  'Weight-Reduction Upgrade (confirm)': 'ترقية لتقليل الوزن (تُؤكَّد)',
  'Precision-Molded Grille': 'شبك مصبوب بدقة',
  'Planted Visual Stance': 'وضعية بصرية ثابتة',
  'Performance-Inspired Styling': 'تصميم مستوحى من الأداء',
  'High-Impact Trunk Upgrade': 'ترقية صندوق خلفي عالية التأثير',
  'Rear-End Performance Upgrade': 'ترقية الأداء الخلفي',
  'Front-End Presence Upgrade': 'ترقية حضور المقدمة',
  'Downforce Enhancement (confirm)': 'تعزيز القوة الضاغطة (يُؤكَّد)',
  'Full-Body Styling Integration': 'تكامل تصميم الهيكل الكامل',
  'Carbon Fiber Detail Upgrade': 'ترقية تفاصيل ألياف الكربون',
  'Aerodynamic Styling': 'تصميم أيروديناميكي',
  'Aerodynamic Styling Enhancement': 'تعزيز التصميم الأيروديناميكي',
  'Performance-Inspired Appearance': 'مظهر مستوحى من الأداء',
  'Performance Body Panel': 'لوح هيكل أدائي',
  'Lightweight Carbon Styling (confirm)': 'تصميم كربوني خفيف (يُؤكَّد)',
  'Aerodynamic Enhancement (confirm)': 'تعزيز أيروديناميكي (يُؤكَّد)',
  'High-Downforce Design (confirm)': 'تصميم بقوة ضاغطة عالية (يُؤكَّد)',
  'Factory Direct': 'مباشرة من المصنع',
  'Wholesale Supply': 'توريد بالجملة',
  'OEM/ODM Available': 'OEM/ODM متاح',
  'Sample Available': 'عينة متاحة',
  'Custom Logo': 'شعار مخصص',
  'Custom Packaging': 'تغليف مخصص',
  'Custom Logo / Packaging': 'شعار وتغليف مخصص',
  'Bulk Order Support': 'دعم الطلبات الكبيرة',
};

/** The sheet repeats one B2B inquiry sentence verbatim on every row. */
const B2B_INQUIRY_AR =
  'توريد مباشر من المصنع للموزعين وورش التعديل وأصحاب العلامات الخاصة؛ اطلب عرض السعر مع تحديد نسخة السيارة بدقة والكمية وبلد التسليم.';

/** Sheet type label → part kinds the taxonomy should resolve to (empty = generic, always accepted). */
const TYPE_EXPECT = {
  'Front Lip / Front Splitter': ['front-lip'],
  'Rear Diffuser / Rear Lip': ['diffuser', 'rear-lip'],
  'Rear Spoiler / Wing': ['spoiler', 'roof-spoiler'],
  'Side Skirt': ['side-skirt'],
  'Front Grille': ['grille'],
  'Hood / Bonnet': ['hood'],
  'Mirror Covers': ['mirror-cap'],
  'Canards / Aero Fins': ['canard'],
  'Fender / Fender Trim': ['fender', 'fender-trim'],
  'Full Body Kit': ['body-kit'],
  'Interior Trim': ['interior-trim', 'seat-cover'],
  'Rear Bumper Spats': ['bumper-trim', 'bumper-extension', 'rear-lip'],
  'Engine Bay Cover / Kit': ['engine-cover', 'battery-cover', 'radiator-cover', 'strut-brace', 'mesh-guard'],
  'Automotive Exterior Modification Part': [],
};

const MAX_TITLE = 60;
const MAX_DESC = 155;

const charCount = (text) => [...text].length;

function trimTo(text, max) {
  if (charCount(text) <= max) return text;
  let out = '';
  for (const ch of text) {
    if (charCount(out + ch) > max) break;
    out += ch;
  }
  return out.replace(/[\s،,|\-—/]+$/u, '');
}

/** First candidate that fits and is still unused; structural alternatives come before any counter. */
function pickUnique(candidates, seen, max) {
  for (const candidate of candidates) {
    const value = clean(candidate);
    if (!seen.has(value) && charCount(value) <= max) {
      seen.add(value);
      return value;
    }
  }
  const base = trimTo(candidates[0], max - 5);
  let index = 2;
  let next = `${base} (${index})`;
  while (seen.has(next) && index < 90) {
    index += 1;
    next = `${base} (${index})`;
  }
  seen.add(next);
  return next;
}

async function main() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils
    .sheet_to_json(workbook.Sheets['产品主表'], { defval: '' })
    .sort((a, b) => Number(a['序号']) - Number(b['序号']));

  const products = [];
  const seenTitles = new Set();
  const seenSeoTitles = new Set();
  const seenDescriptions = new Set();
  const seenSlugs = new Set();
  const unresolved = [];
  const typeConflicts = [];
  const kindCount = {};
  let expectedImages = 0;
  let actualImages = 0;
  let skipped = 0;

  for (const row of rows) {
    const rel = clean(row['图片所在目录(相对路径)']);
    const slug = clean(row['SEO文件名前缀']).toLowerCase();
    if (!slug || seenSlugs.has(slug)) {
      skipped += 1;
      continue;
    }
    seenSlugs.add(slug);

    const segments = rel.split('/');
    const leaf = segments[segments.length - 1] || slug;
    const parent = segments[segments.length - 2] || '';
    const hit = resolveClassification(row, leaf, parent, slug);
    const kind = hit?.kind || 'exterior-trim';
    const categorySlug = hit?.category || 'exterior-trim';
    const partAr = hit?.part || 'زخرفة خارجية';
    const partEn = KIND_EN[kind] || 'Carbon Fiber Part';
    if (!hit) unresolved.push(`${slug} (${rel})`);
    kindCount[kind] = (kindCount[kind] || 0) + 1;

    const sheetType = clean(row['产品类型']);
    const expectedKinds = TYPE_EXPECT[sheetType];
    if (expectedKinds && expectedKinds.length && !expectedKinds.includes(kind)) {
      typeConflicts.push({ serial: row['序号'], slug, sheetType, kind, partEn, leaf });
    }

    const fitmentRaw = `${clean(row['适用车型'])} ${clean(row['车型'])}`;
    const nameHint = `${leaf.replace(/[-_]/g, ' ')} ${clean(row['产品短标题'])}`;
    const isUniversal = /universal/i.test(fitmentRaw);
    let chassis = chassisOf(fitmentRaw);
    let needsConfirm = false;
    // "BMW Universal Accessories" + a model-specific product name → use the name, flag for confirmation.
    if (isUniversal && chassisOf(`${leaf} ${slug}`).length) {
      chassis = chassisOf(`${leaf} ${slug}`);
      needsConfirm = true;
    }
    const isTrulyUniversal = isUniversal && !chassis.length;
    const vehicle = isTrulyUniversal ? 'BMW Universal' : vehicleLabel(chassis, nameHint);
    const fitmentShort = shortFitment(fitmentRaw, chassis, vehicle);
    const fitmentPhrase = isTrulyUniversal ? 'لموديلات BMW المتوافقة' : `لسيارات ${vehicle}`;
    const fitmentPhraseShort = isTrulyUniversal ? 'لموديلات BMW المتوافقة' : `لسيارات ${fitmentShort}`;
    const model = vehicle;

    const styleEn = styleOf(leaf) || styleOf(slug) || styleOf(clean(row['产品标题']));
    const variantEn = variantOf(leaf, styleEn, vehicle);

    const rawMaterial = clean(row['材质']);
    const isAbs = /ABS|Polymer/i.test(rawMaterial);
    const materialAr = isAbs ? 'بلاستيك ABS لامع (Gloss Black)' : 'كربون جاف حقيقي (Dry Carbon Fiber)';
    const materialEn = isAbs ? 'Gloss Black ABS / Polymer' : 'Dry Carbon Fiber (DCF)';
    const materialTitleAr = isAbs ? 'بلاستيك ABS لامع' : 'كربون جاف حقيقي';
    const materialShortAr = isAbs ? 'ABS لامع' : 'كربون جاف';
    const materialLongAr = isAbs ? 'بلاستيك ABS اللامع' : 'الكربون الجاف الحقيقي';

    const phrase = (value) => {
      const text = clean(value);
      if (!text) return '';
      if (isAbs && /carbon/i.test(text)) return 'ترقية تفاصيل المظهر';
      return PHRASE_AR[text] || text;
    };
    const sellingPoints = [row['产品核心卖点1'], row['产品核心卖点2'], row['产品核心卖点3']].map(phrase);
    const [sp1 = 'تصميم عدواني', sp2 = 'مظهر OEM+', sp3 = 'ترقية المظهر الخارجي'] = sellingPoints;

    const dir = path.join(CATALOG_ROOT, rel);
    const files = readImages(dir).slice(0, MAX_IMAGES);
    expectedImages += Number(row['WebP图片(张)']) || 0;
    actualImages += files.length;

    const styleTagRaw = clean([styleEn, variantEn, qualifierOf(clean(row['产品标题']), leaf)].filter(Boolean).join(' '))
      // Collapse repeated words ("Style Style 1" → "Style 1", "HUD HUD" → "HUD") and "Mesh With Mesh" → "Mesh".
      .replace(/\b([A-Za-z0-9-]+)\s+\1\b/gi, '$1')
      .replace(/\b([A-Za-z0-9-]+)\s+With\s+\1\b/gi, '$1');
    // Drop a tag the part name already contains, e.g. "غطاء شاشة HUD" + "HUD".
    const styleTag = styleTagRaw && partAr.toLowerCase().includes(styleTagRaw.toLowerCase()) ? '' : styleTagRaw;
    const titleBase = `${partAr}${styleTag ? ` ${styleTag}` : ''} ${fitmentPhrase} — ${materialTitleAr}`;
    const title = clean(uniqueTitle(titleBase, seenTitles, leaf));

    const titleCandidates = [
      `${partAr}${styleTag ? ` ${styleTag}` : ''} — ${fitmentShort} | ${materialShortAr}`,
      // Keeps a distinct title when another SKU already owns the material-tailed version.
      `${partAr}${styleTag ? ` ${styleTag}` : ''} — ${fitmentShort} | CCF`,
      `${partAr}${styleTag ? ` ${styleTag}` : ''} — ${fitmentShort}`,
      `${materialShortAr}: ${partAr}${styleTag ? ` ${styleTag}` : ''} — ${fitmentShort}`,
      `${partAr}${styleTag ? ` ${styleTag}` : ''} | ${fitmentShort}`,
      `${materialShortAr} ${partAr}${styleTag ? ` ${styleTag}` : ''}`,
      `${partAr}${styleTag ? ` ${styleTag}` : ''}`,
    ].map(clean);
    const seoTitle = pickUnique(titleCandidates, seenSeoTitles, MAX_TITLE);

    const finishPhrase = isAbs ? 'بتشطيب أسود لامع (Gloss Black)' : 'بتشطيب لامع أو مطفي';
    const descLead = `${partAr}${styleTag ? ` ${styleTag}` : ''} ${fitmentPhraseShort}`;
    const descriptionCandidates = [
      `${descLead} — ${materialLongAr} ${finishPhrase}. توريد مباشر من مصنع CCF؛ أكّد المطابقة بصور سيارتك واطلب عرض السعر.`,
      `${descLead} من ${materialLongAr} ${finishPhrase}، توريد مباشر من مصنع CCF. أكّد المطابقة بصور سيارتك واطلب عرض السعر.`,
      `${descLead} من ${materialLongAr}. أكّد المطابقة بصور سيارتك واطلب عرض السعر من مصنع CCF.`,
      `${descLead} من ${materialLongAr} ${finishPhrase}، مع توريد مباشر من مصنع CCF. راجع المطابقة بصور سيارتك ثم اطلب عرض السعر.`,
      `${descLead} من ${materialLongAr}. توريد مباشر من مصنع CCF؛ أكّد المطابقة بصور سيارتك قبل طلب عرض السعر.`,
      `${partAr}${styleTag ? ` ${styleTag}` : ''} من ${materialLongAr} ${finishPhrase}، توريد مباشر من CCF. أكّد المطابقة بصور سيارتك واطلب عرض السعر.`,
    ].map(clean);
    const seoDescription = pickUnique(descriptionCandidates, seenDescriptions, MAX_DESC);

    const contextAr =
      CATEGORY_CONTEXT_AR[categorySlug] || 'ضمن تعديل المظهر الخارجي وتجهيز السيارات والتوريد بعلامة خاصة';
    const stylingNote = STYLING_CATEGORIES.has(categorySlug)
      ? ' موجّهة لمشترين يبحثون عن مظهر أكثر عدوانية ورياضية وموجّه للأداء.'
      : '';
    const intro = clean(
      `ترقية ${partAr}${styleEn ? ` بتصميم ${styleEn}` : ''} ${fitmentPhrase}، ${contextAr}. ${sp1} و${sp2} و${sp3}.${stylingNote}${
        needsConfirm ? ' الموديل مأخوذ من اسم القطعة ويُؤكَّد بصور سيارتك قبل العرض.' : ''
      }`
    );

    const images = [];
    if (!DRY) {
      const outDir = path.join(PUBLIC_PRODUCTS, slug);
      fs.mkdirSync(outDir, { recursive: true });
      for (let index = 0; index < files.length; index += 1) {
        const name = `${slug}-${String(index + 1).padStart(2, '0')}.webp`;
        const dest = path.join(outDir, name);
        if (!fs.existsSync(dest)) await fs.promises.copyFile(files[index], dest);
        const meta = await sharp(dest).metadata();
        const variant = { url: `/images/products/${slug}/${name}`, width: meta.width, height: meta.height };
        images.push({ lg: variant, md: variant, sm: variant });
      }
    } else {
      const meta = files.length ? await sharp(files[0]).metadata() : { width: 1200, height: 900 };
      const variant = { url: `/images/products/${slug}/${slug}-01.webp`, width: meta.width, height: meta.height };
      images.push({ lg: variant, md: variant, sm: variant });
    }

    const product = {
      reviewedAt: '2026-11-16',
      slug,
      productDirName: leaf,
      title,
      description: intro,
      seoTitle,
      seoDescription,
      highlights: [
        isAbs ? 'بلاستيك ABS لامع (Gloss Black) بجودة مصنع' : 'كربون جاف حقيقي (DCF) وليس طبقة زخرفية',
        isTrulyUniversal
          ? 'مطابقة تُؤكَّد بصور سيارتك قبل العرض'
          : `مطابقة مصممة لهيكل ${vehicle}${needsConfirm ? ' — تُؤكَّد بصور سيارتك' : ''}`,
        sp1,
        sp3,
      ],
      keywords: [
        clean(row['主关键词']),
        clean(row['变体长尾词']),
        clean(row['Keyword Cluster']).replace(/\s*\|\s*/g, ' '),
        ...clean(row['B2B采购关键词']).split(';'),
        clean(row['产品短标题']),
      ]
        .map(clean)
        .filter(Boolean)
        // The sheet repeats its boilerplate "BMW Universal Accessories …" title on model-specific rows.
        .filter((value) => /universal/i.test(value) === /universal/i.test(vehicle))
        // An ABS part must never carry a "dry carbon fiber" keyword.
        .filter((value) => !(isAbs && /carbon/i.test(value)))
        .filter((value, index, list) => list.findIndex((v) => v.toLowerCase() === value.toLowerCase()) === index)
        .slice(0, 8),
      categorySlug,
      categoryAr: productCategories[categorySlug] || 'زخارف خارجية',
      categoryArShort: CATEGORY_SHORT_AR[categorySlug] || 'قطعة كربون',
      partType: kind,
      partTypeEn: partEn,
      partTypeAr: partAr,
      chassisCodes: chassis,
      model,
      yearStart: 0,
      yearEnd: 9999,
      material: materialAr,
      materialEn,
      manufacturing: isAbs
        ? 'حقن بلاستيك ABS داخل قالب ثم تشطيب لامع (Gloss Black)'
        : 'Dry Carbon — قشرة كربونية مسبقة التشريب داخل قالب',
      images,
      imageCount: images.length,
      featuredImage: images[0]?.lg.url || '',
      featuredSm: images[0]?.sm.url || '',
      youtube: /^https?:\/\//i.test(clean(row['Youtube地址址'])) ? clean(row['Youtube地址址']) : '',
      checks: [
        'المطابقة النهائية تتطلب تأكيد السنة وإصدار الهيكل وصور الجزء الحالي؛ رمز الشاسيه وحده لا يثبت التوافق.',
        `أكّد تفاصيل ${partAr} (النسخة والجانب والقطع المشمولة) قبل اعتماد الطلب.`,
        `أكّد المادة (${materialTitleAr}) والتشطيب ووحدة البيع كتابةً قبل العرض.`,
        'يتوفر توريد بالجملة من مصنع CCF؛ تُحدّد الكمية الدنيا ومدة التجهيز والشحن بحسب المرجع.',
      ],
      specs: [
        ['نوع القطعة', partAr],
        ['مرجع المركبة', vehicle],
        ['التصميم أو النسخة', styleEn || 'قياسي'],
        ['المادة والتشطيب', `${materialTitleAr}؛ لامع أو مطفي حسب الطلب`],
        ['التوريد', 'مصنع CCF — جملة / OEM-ODM'],
        ['بلد المنشأ', 'الصين — مصنع CCF'],
        ['محتويات التوريد', 'تُحدّد في عرض السعر'],
      ],
      specs16: {
        productType: `${partEn} — ${partAr}`,
        fitment: needsConfirm
          ? `${vehicle} — الموديل مأخوذ من اسم القطعة (ملف المورد يذكر Universal Accessories)؛ تُؤكَّد المطابقة بصور سيارتك.`
          : `${vehicle} — يُؤكَّد الموديل والسنة والإصدار (Pre-LCI / LCI) بصور سيارتك.`,
        material: isAbs
          ? 'بلاستيك ABS (Gloss Black ABS / Polymer) مصبوب بالحقن؛ يُؤكَّد لون التشطيب وملمسه قبل العرض.'
          : 'كربون جاف حقيقي (Dry Carbon Fiber — DCF): قشرة كربونية مسبقة التشريب؛ تُؤكَّد بنية الطبقات ونظام الراتنج للمرجع.',
        weave: isAbs
          ? 'لا ينطبق — قطعة ABS مصبوبة بالحقن وليست منسوجة.'
          : 'نسج 3K — Twill 2×2 أو Plain 1×1 حسب الطلب؛ يُؤكَّد نمط النسج للمرجع قبل العرض.',
        finish: isAbs
          ? 'أسود لامع (Gloss Black) قياسي؛ يُؤكَّد التشطيب المطفي قبل الطلب.'
          : 'لامع (Gloss) أو مطفي (Matte) عند الطلب؛ Forged Carbon حسب التوفر ويُؤكَّد قبل الطلب.',
        process: isAbs
          ? 'حقن بلاستيك ABS داخل قالب، ثم تشطيب وتجميع يدوي؛ تُؤكَّد تفاصيل العملية لكل مرجع.'
          : 'تشكيل بقشرة كربونية مسبقة التشريب داخل قالب مع معالجة حرارية تحت ضغط، ثم تشطيب وتجميع يدوي؛ تُؤكَّد تفاصيل العملية لكل مرجع.',
        weight: 'يُوزَن المرجع المحدد ويُثبَّت في عرض السعر — لا نعتمد وزناً تقديرياً.',
        thickness: 'تختلف السماكة بحسب المنطقة ونقاط التثبيت؛ تُقاس وتُثبَّت في عرض السعر.',
        installation:
          'تركيب مباشر على نقاط التثبيت الأصلية بعد تأكيد المطابقة؛ قد يتطلب لاصق 3M أو براغي حسب المرجع، ويُنصح بالتركيب لدى ورشة متخصصة.',
        moq: 'عينة واحدة (MOQ = 1)؛ للإنتاج بالجملة تُحدَّد الكمية المثلى لتقليل تكلفة الوحدة حسب المرجع.',
        sampleLeadTime: 'تُؤكَّد مدة العينة بعد اعتماد المرجع والكمية؛ تكون عادةً أقصر من الإنتاج بالجملة.',
        bulkLeadTime: '25–30 يوماً من تأكيد الطلب والدفعة، حسب المرجع والكمية.',
        customization: 'شعار مخصص (Logo)، لون وتشطيب، نمط نسج، تغليف مخصص، وقالب خاص لموديل جديد (OEM/ODM).',
        packaging:
          'كل قطعة داخل كيس هوائي وإسفنج حماية، ثم كرتون مقوّى بزوايا حماية، ثم صندوق خشبي أو منصة نقالة للشحنات الكبيرة.',
        warranty: 'ضمان سنة واحدة على عيوب التصنيع من تاريخ التسليم.',
        damage: 'نتحمّل مسؤولية التلف أثناء النقل: استبدال القطع المتضررة أو إعادة شحنها بعد تأكيد التلف بالصور.',
      },
      faq: [
        {
          q: 'كيف أتأكد من مطابقة القطعة لسيارتي؟',
          a: `أرسل صور السيارة من الأمام والخلف والجانب وصور الجزء الحالي، مع سنة الصنع وإصدار السيارة. نراجع ${partAr} ${
            isTrulyUniversal ? 'مع بيانات سيارتك' : `على هيكل ${vehicle}`
          } ونؤكد المطابقة قبل عرض السعر.`,
        },
        {
          q: 'ما المادة والتشطيب المتاح؟',
          a: isAbs
            ? 'المادة بلاستيك ABS (Gloss Black ABS / Polymer) مصبوب بالحقن وليس كربوناً. التشطيب أسود لامع قياسياً، ويُؤكَّد التشطيب المطفي واللون للمرجع قبل الإنتاج.'
            : 'المادة كربون جاف حقيقي (Dry Carbon Fiber) وليست طبقة زخرفية. التشطيب لامع أو مطفي حسب الطلب، ويُؤكَّد نمط النسج والراتنج للمرجع قبل الإنتاج.',
        },
        {
          q: 'ما الحد الأدنى للطلب وكيف يتم التغليف؟',
          a: 'يمكن طلب عينة واحدة (MOQ = 1). التغليف: كيس هوائي وإسفنج، ثم كرتون مقوّى بزوايا حماية، ثم صندوق خشبي أو منصة نقالة للشحنات الكبيرة.',
        },
        {
          q: 'هل يمكن طباعة شعارنا وتغليف مخصص؟',
          a: `نعم. نوفر شعاراً مخصصاً على القطعة أو التغليف (${phrase(row['B2B采购词3'])} / ${phrase(
            row['B2B采购词4']
          )}). ${clean(row['B2B询盘卖点']) ? B2B_INQUIRY_AR : ''}`.trim(),
        },
        {
          q: 'ما الضمان وسياسة التلف أثناء النقل؟',
          a: 'ضمان سنة واحدة على عيوب التصنيع من تاريخ التسليم. عند تلف أثناء النقل نتحمّل الاستبدال أو إعادة الشحن بعد تأكيد التلف بالصور.',
        },
      ],
      intentSegments: [
        `${partAr} ${vehicle}`,
        `${partAr} ${materialShortAr} بالجملة`,
        clean(row['汽车改装用途']).replace(/\s*\/\s*/g, ' / '),
      ].filter(Boolean),
    };
    products.push(product);
  }

  const titleLens = products.map((p) => charCount(p.seoTitle)).sort((a, b) => a - b);
  const descLens = products.map((p) => charCount(p.seoDescription)).sort((a, b) => a - b);
  const median = (list) => list[Math.floor(list.length / 2)];
  const within = (list, max) => Math.round((list.filter((v) => v <= max).length / list.length) * 100);
  console.log(
    `seoTitle ≤${MAX_TITLE}: ${within(titleLens, MAX_TITLE)}% | max ${titleLens.at(-1)} | p50 ${median(titleLens)}`
  );
  console.log(
    `seoDescription ≤${MAX_DESC}: ${within(descLens, MAX_DESC)}% | max ${descLens.at(-1)} | p50 ${median(descLens)}`
  );
  console.log('material ABS:', products.filter((p) => /ABS/.test(p.materialEn)).length);
  console.log(
    'fitment flagged for confirmation:',
    products.filter((p) => /Universal Accessories/.test(p.specs16.fitment)).length
  );
  console.log('sheet type conflicts:', typeConflicts.length);

  if (DRY) {
    console.log('rows:', rows.length, '| products:', products.length, '| skipped:', skipped);
    console.log('expected images (sheet):', expectedImages, '| used (max 12):', actualImages);
    console.log('unresolved classification:', unresolved.length);
    unresolved.slice(0, 20).forEach((u) => console.log('  ?', u));
    console.log(
      'kinds:',
      Object.entries(kindCount)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}:${v}`)
        .join(', ')
    );
    console.log('first 3 titles:');
    products.slice(0, 3).forEach((p) => console.log('  -', p.title));
    console.log('titles needing numeric fallback:', products.filter((p) => p.title.includes('— نسخة')).length);
    console.log('sample titles across kinds:');
    const seenKinds = new Set();
    for (const p of products) {
      if (seenKinds.has(p.partType)) continue;
      seenKinds.add(p.partType);
      console.log(`  [${p.partType}] ${p.title}`);
      if (seenKinds.size >= 14) break;
    }
    console.log('last 3 titles:');
    products.slice(-3).forEach((p) => console.log('  -', p.title));
    return;
  }

  const helpers = fs.readFileSync(path.join(ROOT, 'scripts/catalog-helpers.txt'), 'utf8');
  const body = `import { localizeProductRu } from './product-localization-ru.ts';
import type { ProductDetail } from './all-products-types';

export type { ProductDetail } from './all-products-types';

const sourceProducts: ProductDetail[] = ${JSON.stringify(products.map(correctCslTailLights), null, 2)};

export const allProducts: ProductDetail[] = sourceProducts.map(localizeProductRu);
${helpers}`;
  fs.writeFileSync(OUT_TS, body, 'utf8');

  const reportPath = path.join(ROOT, 'reports/catalog-type-conflicts.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = [
    '# 产品类型冲突报告（xlsx `产品类型` vs 站点分类）',
    '',
    `生成时间：${new Date().toISOString()} | 基准：完整产品图片/ALL.xlsx → 产品主表`,
    '',
    `冲突 ${typeConflicts.length} 条。站点保留目录/路径细化分类，xlsx 标签仅作校验。`,
    '',
    '| 序号 | SEO文件名前缀 | xlsx 产品类型 | 站点 partType (partEn) | 目录叶子 |',
    '| --- | --- | --- | --- | --- |',
    ...typeConflicts.map((c) => `| ${c.serial} | ${c.slug} | ${c.sheetType} | ${c.kind} (${c.partEn}) | ${c.leaf} |`),
    '',
  ].join('\n');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, reportPath)} — ${typeConflicts.length} conflicts`);
  console.log(`Wrote ${path.relative(ROOT, OUT_TS)} — ${products.length} products, ${actualImages} images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
