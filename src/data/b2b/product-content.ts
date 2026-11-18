import type { ProductDetail } from './all-products';

/** Stable published URLs must survive a new image import. */
const publishedSlugs: Record<string, string> = {
  'bmw-g80-g82-carbon-fiber-r44-style-front-lip': 'bmw-g80-g82-carbon-fiber-front-lip-r44-style',
  'bmw-g80-g82-carbon-fiber-csl-style-3-piece-front-lip': 'bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style',
  'bmw-g80-g82-carbon-fiber-mp-style-rear-diffuser': 'bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style',
};

/** Collapse repeated "-carbon-fiber" segments produced by folder names. */
function cleanSlug(slug: string): string {
  const marker = '-carbon-fiber';
  const first = slug.indexOf(marker);
  if (first === -1) return slug;
  return slug.slice(0, first + marker.length) + slug.slice(first + marker.length).replace(/-carbon-fiber/g, '');
}

export const productCategories = {
  'front-lips-splitters': 'Передние сплиттеры',
  'rear-diffusers': 'Задние диффузоры',
  'spoilers-wings': 'Спойлеры и антикрылья',
  'side-skirts': 'Боковые пороги',
  hoods: 'Капоты',
  'trunk-lids': 'Крышки багажника',
  'mirror-caps': 'Накладки зеркал',
  'grilles-air-intake': 'Решётки и воздухозаборники',
  lighting: 'Автомобильная оптика',
  'interior-trim': 'Детали салона',
  'body-panels': 'Кузовные панели',
  'exterior-trim': 'Наружные накладки',
  'engine-bay': 'Детали моторного отсека',
} as const;

export interface ProductClassification {
  part: string;
  kind: string;
  category: string;
}

type Rule = {
  test: RegExp;
  part: string | ((name: string) => string);
  kind: string;
  category: string;
};

/**
 * Ordered, explicit part taxonomy. The first matching rule wins.
 * Keep specific patterns before generic ones (Hood-Vent-Trim before Hood, etc.).
 */
const PART_RULES: Rule[] = [
  {
    test: /Engine[- ]Bay[- ]Cover[- ]Set|Engine[- ]Bay[- ]Complete[- ]Kit/i,
    part: 'طقم أغطية حجرة المحرك',
    kind: 'engine-cover',
    category: 'engine-bay',
  },
  {
    // Sits inside a "…-Body-Kit" folder in the sheet, so the leaf name must win over the parent.
    test: /Center[- ]Console(?:[- ]Trim)?/i,
    part: 'زخرفة الكونسول الوسطي',
    kind: 'interior-trim',
    category: 'interior-trim',
  },
  {
    test: /Full[- ]?Body[- ]?Kit|Full[- ]?Carbon[- ]?Fiber[- ]?(?:Body[- ]?)?Kit|Body[- ]?Kit|Complete[- ]Kit/i,
    part: 'طقم هيكل كامل',
    kind: 'body-kit',
    category: 'body-panels',
  },
  { test: /Oil[- ]Pan[- ]Guard/i, part: 'حماية حوض الزيت', kind: 'oil-pan-guard', category: 'engine-bay' },
  {
    test: /Oil[- ]Cooler[- ]Protection[- ]Plate/i,
    part: 'لوح حماية مبرد الزيت',
    kind: 'oil-cooler-guard',
    category: 'engine-bay',
  },
  { test: /Underbody[- ]Guard/i, part: 'حماية أسفل الهيكل', kind: 'underbody-guard', category: 'engine-bay' },
  { test: /Mesh[- ]Debris[- ]Guard/i, part: 'حماية شبكية من الحطام', kind: 'mesh-guard', category: 'engine-bay' },
  { test: /Strut[- ]Brace/i, part: 'دعامة حجرة المحرك', kind: 'strut-brace', category: 'engine-bay' },
  {
    test: /Rear[- ]Lip/i,
    part: 'شفّة خلفية',
    kind: 'rear-lip',
    category: 'rear-diffusers',
  },
  { test: /Tail[- ]Lights?/i, part: 'إضاءة خلفية', kind: 'tail-light', category: 'lighting' },
  {
    test: /Daytime[- ]Running[- ]Lights?|DRL/i,
    part: 'إضاءة نهارية',
    kind: 'drl',
    category: 'lighting',
  },
  {
    test: /Shark[- ]Fin[- ]Antenna[- ]Cover|Antenna[- ]Cover/i,
    part: 'غطاء هوائي زعنفة القرش',
    kind: 'antenna-cover',
    category: 'exterior-trim',
  },
  { test: /Wheel[- ]Arch[- ]Trims?/i, part: 'زخارف أقواس العجلات', kind: 'wheel-arch-trim', category: 'exterior-trim' },
  {
    test: /Fog[- ]Light[- ](?:Corner[- ])?Trims?/i,
    part: 'زخارف مصابيح الضباب',
    kind: 'fog-trim',
    category: 'exterior-trim',
  },
  {
    test: /Fender[- ](?:Vents?|Trims?|Side[- ]Vent[- ]Set)/i,
    part: 'زخارف فتحات الرفارف',
    kind: 'fender-trim',
    category: 'exterior-trim',
  },
  { test: /Fuel[- ]Cap[- ]Cover/i, part: 'غطاء فتحة الوقود', kind: 'fuel-cover', category: 'exterior-trim' },
  { test: /License[- ]Plate[- ]Frame/i, part: 'إطار لوحة الترخيص', kind: 'plate-frame', category: 'exterior-trim' },
  {
    test: /Interior[- ]Trim(?:[- ]Set)?/i,
    part: 'طقم زخارف داخلية',
    kind: 'interior-trim',
    category: 'interior-trim',
  },
  {
    test: /Seat[- ]Back[- ](?:Covers?|Panel[- ]Set)/i,
    part: 'أغطية ظهر المقاعد',
    kind: 'seat-cover',
    category: 'interior-trim',
  },
  { test: /Trunk[- ]Lid/i, part: 'غطاء صندوق خلفي', kind: 'trunk-lid', category: 'trunk-lids' },
  { test: /Roof[- ]Spoiler/i, part: 'سبويلر سقف', kind: 'roof-spoiler', category: 'spoilers-wings' },
  { test: /Rear[- ]Wing/i, part: 'جناح خلفي', kind: 'spoiler', category: 'spoilers-wings' },
  { test: /Rear[- ]Spoilers?/i, part: 'سبويلر خلفي', kind: 'spoiler', category: 'spoilers-wings' },
  {
    test: /Front[- ](?:Lip|Splitter)|Front[- ]Bumper[- ]Lip/i,
    part: 'شفّة أمامية',
    kind: 'front-lip',
    category: 'front-lips-splitters',
  },
  { test: /Front[- ]Canards?|Canards?/i, part: 'كانارد أمامي', kind: 'canard', category: 'front-lips-splitters' },
  { test: /Side[- ]Winglets?/i, part: 'زعانف جانبية', kind: 'side-winglet', category: 'exterior-trim' },
  {
    test: /Front[- ]Corner[- ]Splitters?/i,
    part: 'سبليترات زوايا المصد الأمامي',
    kind: 'bumper-trim',
    category: 'exterior-trim',
  },
  {
    test: /Rear[- ]Corner[- ]Splitters?/i,
    part: 'سبليترات زوايا المصد الخلفي',
    kind: 'bumper-trim',
    category: 'rear-diffusers',
  },
  {
    test: /Front[- ]Bumper[- ]Corner[- ](?:Trims?|Splitters?)/i,
    part: 'زخارف زوايا المصد الأمامي',
    kind: 'bumper-trim',
    category: 'exterior-trim',
  },
  {
    test: /Rear[- ]Bumper[- ]Corner[- ](?:Trims?|Splitters?)/i,
    part: 'زخارف زوايا المصد الخلفي',
    kind: 'bumper-trim',
    category: 'rear-diffusers',
  },
  {
    test: /Front[- ]Bumper[- ](?:Air[- ]Vents?|Vent[- ]Trim|Air[- ]Intake[- ]Trims?)/i,
    part: 'زخارف فتحات المصد الأمامي',
    kind: 'bumper-vent',
    category: 'exterior-trim',
  },
  {
    test: /Front[- ]Bumper[- ]Trims?/i,
    part: 'زخارف المصد الأمامي',
    kind: 'bumper-trim',
    category: 'exterior-trim',
  },
  {
    test: /Rear[- ]Bumper[- ](?:Splitters?|Trims?)/i,
    part: 'زخارف المصد الخلفي',
    kind: 'bumper-trim',
    category: 'rear-diffusers',
  },
  {
    test: /Rear[- ]Bumper[- ]Extensions?/i,
    part: 'امتدادات المصد الخلفي',
    kind: 'bumper-extension',
    category: 'rear-diffusers',
  },
  {
    test: /Double[- ]Bar[- ]Air[- ]Vent|Air[- ]Vents?\b/i,
    part: 'فتحة هواء',
    kind: 'air-vent',
    category: 'exterior-trim',
  },
  {
    test: /Rear[- ]Diffuser/i,
    part: (n) =>
      /Outer[- ]Frame/i.test(n)
        ? 'إطار ناشر خلفي'
        : /Center[- ]Exit/i.test(n)
          ? 'طقم ناشر للعادم المركزي'
          : 'ناشر خلفي',
    kind: 'diffuser',
    category: 'rear-diffusers',
  },
  {
    test: /Front[- ]Bumper[- ]and[- ]Fenders?/i,
    part: 'طقم مصد أمامي ورفارف',
    kind: 'body-panel-set',
    category: 'body-panels',
  },
  {
    test: /Front[- ]Bumper(?![- ](?:Corner|Trims?|Splitters?|Extensions?|Air|Vents?))/i,
    part: 'مصد أمامي',
    kind: 'front-bumper',
    category: 'body-panels',
  },
  {
    test: /Rear[- ]Bumper(?![- ](?:Corner|Trims?|Splitters?|Extensions?|Air|Vents?))/i,
    part: 'مصد خلفي',
    kind: 'rear-bumper',
    category: 'body-panels',
  },
  {
    test: /Side[- ]Skirts?|Side[- ]Skirt[- ]Extensions?/i,
    part: (n) => (/Flat/i.test(n) ? 'تنانير جانبية مسطحة' : 'تنانير جانبية'),
    kind: 'side-skirt',
    category: 'side-skirts',
  },
  { test: /Front[- ]Fenders?|Fenders?/i, part: 'رفارف', kind: 'fender', category: 'body-panels' },
  {
    test: /Hood[- ]Vent[- ]Trim/i,
    part: 'زخارف فتحات غطاء المحرك',
    kind: 'hood-trim',
    category: 'exterior-trim',
  },
  { test: /Hood\b/i, part: 'غطاء محرك', kind: 'hood', category: 'hoods' },
  {
    test: /Lower[- ]Grille/i,
    part: 'شبك سفلي',
    kind: 'grille',
    category: 'grilles-air-intake',
  },
  {
    test: /Kidney[- ]Grille[- ]Trim|Grille[- ]with[- ]Mesh|Double[- ]Slat[- ]Grille|Grille\b|Front[- ]Grille/i,
    part: 'شبك أمامي',
    kind: 'grille',
    category: 'grilles-air-intake',
  },
  {
    test: /Air[- ]Intake[- ]Kit|Air[- ]Intake\b/i,
    part: 'طقم سحب هواء',
    kind: 'intake',
    category: 'grilles-air-intake',
  },
  { test: /Doors?\b/i, part: 'أبواب', kind: 'door', category: 'body-panels' },
  {
    test: /Mirror[- ](?:Covers?|Caps?)/i,
    part: 'أغطية مرايا',
    kind: 'mirror-cap',
    category: 'mirror-caps',
  },
  { test: /Battery[- ]Cover/i, part: 'غطاء البطارية', kind: 'battery-cover', category: 'engine-bay' },
  { test: /Engine[- ]Cover/i, part: 'غطاء محرك تجميلي', kind: 'engine-cover', category: 'engine-bay' },
  { test: /Radiator[- ]Cover/i, part: 'غطاء منطقة الردياتير', kind: 'radiator-cover', category: 'engine-bay' },
  {
    test: /Bumper[- ]Corner[- ](?:Trims?|Splitters?)/i,
    part: 'زخارف زوايا المصد',
    kind: 'bumper-trim',
    category: 'exterior-trim',
  },
];

const MODEL_BY_CHASSIS: Record<string, string> = {
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
  G38: '5 Series',
  G60: '5 Series',
  G68: '5 Series',
  G05: 'X5',
  G06: 'X6',
  G14: '8 Series',
  G15: '8 Series',
  G29: 'Z4',
  G42: '2 Series',
  F20: '1 Series',
  F22: '2 Series',
  F16: 'X6',
  F26: 'X4',
  F95: 'X5 M',
  F97: 'X3 M',
  F98: 'X4 M',
  F96: 'X6 M',
  E90: '3 Series',
  E91: '3 Series',
  E92: '3 Series',
  E93: '3 Series',
  E82: '1 Series',
  E88: '1 Series',
  IX2: 'iX2',
  IX3: 'iX3',
};

/** Canonical English part names used for bilingual keyword coverage. */
const KIND_EN: Record<string, string> = {
  'body-kit': 'Full Body Kit',
  'engine-cover': 'Engine Bay Cover',
  'oil-pan-guard': 'Oil Pan Guard',
  'oil-cooler-guard': 'Oil Cooler Protection Plate',
  'underbody-guard': 'Underbody Guard',
  'mesh-guard': 'Mesh Debris Guard',
  'strut-brace': 'Strut Brace',
  'rear-lip': 'Rear Lip',
  'tail-light': 'Tail Light',
  drl: 'Daytime Running Light',
  'antenna-cover': 'Shark Fin Antenna Cover',
  'wheel-arch-trim': 'Wheel Arch Trim',
  'fog-trim': 'Fog Light Trim',
  'fender-trim': 'Fender Vent Trim',
  'fuel-cover': 'Fuel Cap Cover',
  'plate-frame': 'License Plate Frame',
  'interior-trim': 'Interior Trim Set',
  'seat-cover': 'Seat Back Cover',
  'trunk-lid': 'Trunk Lid',
  'roof-spoiler': 'Roof Spoiler',
  spoiler: 'Rear Spoiler',
  'front-lip': 'Front Lip Splitter',
  canard: 'Front Canards',
  'side-winglet': 'Side Winglets',
  'bumper-trim': 'Bumper Trim',
  'bumper-vent': 'Front Bumper Air Vent Trim',
  'bumper-extension': 'Rear Bumper Extension',
  'air-vent': 'Air Vent Trim',
  diffuser: 'Rear Diffuser',
  'body-panel-set': 'Front Bumper and Fender Set',
  'front-bumper': 'Front Bumper',
  'rear-bumper': 'Rear Bumper',
  'side-skirt': 'Side Skirts',
  fender: 'Front Fenders',
  'hood-trim': 'Hood Vent Trim',
  hood: 'Hood',
  grille: 'Front Grille',
  intake: 'Air Intake Kit',
  door: 'Doors',
  'mirror-cap': 'Mirror Caps',
  'battery-cover': 'Battery Cover',
  'radiator-cover': 'Radiator Cover',
};

export function extractChassisCodes(name: string): string[] {
  const matches = name.match(/\b(?:[FGEU]\d{2,3}|iX[23])\b/gi) || [];
  const codes: string[] = [];
  for (const match of matches) {
    const code = match.toUpperCase();
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function classifyProduct(name: string): ProductClassification | null {
  for (const rule of PART_RULES) {
    if (rule.test.test(name)) {
      return {
        part: typeof rule.part === 'function' ? rule.part(name) : rule.part,
        kind: rule.kind,
        category: rule.category,
      };
    }
  }
  return null;
}

function buildVehicle(chassis: string[], name: string): string {
  if (/3[- ]Series[- ]M3[- ]G80/i.test(name)) return 'BMW 3 Series M3 G80';
  const groups = new Map<string, string[]>();
  for (const code of chassis) {
    const model = MODEL_BY_CHASSIS[code];
    if (!model) continue;
    if (!groups.has(model)) groups.set(model, []);
    groups.get(model)!.push(code);
  }
  if (groups.size) {
    return `BMW ${[...groups.entries()].map(([model, codes]) => `${model} ${codes.join('/')}`).join(' / ')}`;
  }

  const hints: string[] = [];
  if (/X5M/i.test(name)) hints.push('X5 M');
  else if (/X6M/i.test(name)) hints.push('X6 M');
  if (/\biX2\b/i.test(name)) hints.push('iX2');
  if (/\biX3\b/i.test(name)) hints.push('iX3');
  if (/\bZ4\b/i.test(name)) hints.push('Z4');
  if (/\bX6\b/i.test(name)) hints.push('X6');
  if (/5-Series/i.test(name)) hints.push('5 Series');
  if (/3-Series/i.test(name)) hints.push('3 Series');
  return hints.length ? `BMW ${[...new Set(hints)].join(' / ')}` : 'BMW';
}

/** Marketing model names (M3, M5, 3 Series…) derived from chassis codes. */
function buildKeywordModels(chassis: string[]): string[] {
  const models: string[] = [];
  for (const code of chassis) {
    const model = MODEL_BY_CHASSIS[code];
    if (model && !models.includes(model)) models.push(model);
  }
  return models;
}

const VARIANT_STOPWORDS = new Set(
  (
    'front rear side roof trunk hood engine upper lower middle left right inner outer main full ' +
    'lip lips splitter splitters skirt skirts spoiler spoilers wing wings diffuser diffusers ' +
    'canard canards grille grilles vent vents trim trims cover covers guard guards panel panels ' +
    'door doors mirror mirrors kit kits set sets mesh frame lid light lights intake brace antenna ' +
    'fuel cap plate seat back exterior interior accessory accessories installed replacement style ' +
    'up onwards lci pre lwb acc led drl and with without no one piece pieces carbon fiber dry gloss ' +
    'matte double bar flat corner extension extensions dragon scale new bmw air body fender bumper ' +
    'caps cap lids fenders fog wheel arch arches shark fin kidney battery radiator oil pan cooler protection debris single competition series 540i'
  ).split(' ')
);

/** Style/brand tokens left after removing chassis, part words and fitment keywords. */
function extractVariantTokens(name: string): string {
  const kept = name.split(/[-_\s]+/).filter((token) => {
    if (!token || /^(?:x[346]m|m[2345])$/i.test(token)) return false;
    const lower = token.toLowerCase();
    if (/^(?:[fgeu]\d{2,3}|ix[23])$/i.test(lower)) return false;
    if (/^(?:19|20)\d{2}$/.test(lower) || /^\d+$/.test(lower)) return false;
    return !VARIANT_STOPWORDS.has(lower);
  });
  return kept.join(' ');
}

function buildVariant(name: string): string {
  const details: string[] = [];
  const style = name.match(/\b([A-Za-z0-9]{1,8})-Style\b/i)?.[1];
  const hasStyle = Boolean(style && !VARIANT_STOPWORDS.has(style.toLowerCase()));
  if (hasStyle) details.push(`تصميم ${style!.toUpperCase()}`);
  if (!hasStyle) {
    const fallback = extractVariantTokens(name);
    if (fallback) details.push(`تصميم ${fallback.toUpperCase()}`);
  }
  if (/3[- ]Piece/i.test(name)) details.push('ثلاث قطع');
  if (/No[- ]ACC/i.test(name)) details.push('بدون ACC');
  else if (/With[- ]ACC/i.test(name)) details.push('مع ACC');
  if (/Red[- ]?Carbon|\bRed\b/i.test(name)) details.push('كربون أحمر');
  if (/Pre[- ]LCI/i.test(name)) details.push('نسخة ما قبل LCI');
  else if (/\bLCI\b/i.test(name)) details.push('نسخة LCI');
  if (/LWB|Long[- ]Wheelbase/i.test(name)) details.push('قاعدة عجلات طويلة');
  if (/With[- ]LED/i.test(name)) details.push('مع إضاءة LED');
  else if (/Without[- ]LED/i.test(name)) details.push('بدون إضاءة LED');
  if (/Installed/i.test(name)) details.push('صور تركيب');
  if (/Replacement/i.test(name)) details.push('استبدال مباشر');
  if (/Single[- ]Bar/i.test(name)) details.push('بقضيب واحد');
  if (/Double[- ]Slat|Double[- ]Bar/i.test(name)) details.push('قضبان مزدوجة');
  if (/Dragon[- ]Scale/i.test(name)) details.push('حراشف التنين');
  if (/Competition/i.test(name)) details.push('نسخة Competition');
  if (/1st[- ]Gen/i.test(name)) details.push('الجيل الأول');
  const styleNumber = name.match(/\bStyle[- ]0?([1-9]\d?)(?![- ]?(?:piece|pieces)\b)(?!\d)/i)?.[1];
  if (styleNumber) details.push(`الإصدار ${styleNumber}`);
  if (/Flat/i.test(name)) details.push('تصميم مسطح');
  if (/Splitter/i.test(name)) details.push('سبليتر سفلي');
  if (/Extensions?/i.test(name)) details.push('امتداد سفلي');
  if (/Canards?/i.test(name) && /Front[- ]Lip/i.test(name)) details.push('مع كانارد');
  if (/Corner[- ]Trims?/i.test(name) && /Rear[- ]Lip/i.test(name)) details.push('مع زخارف زوايا');
  if (/with[- ]Side[- ]Extensions?/i.test(name)) details.push('مع امتدادات جانبية');
  if (/with[- ]Side[- ]Splitters?/i.test(name)) details.push('مع شفرات جانبية');
  if (/with[- ]Mesh/i.test(name)) details.push('مع شبكة');
  if (/Outer[- ]Frame/i.test(name)) details.push('إطار خارجي');
  if (/540i/i.test(name)) details.push('نسخة 540i');
  if (/M40i/i.test(name)) details.push('نسخة M40i');
  if (/Long[- ]?Wheelbase/i.test(name)) details.push('قاعدة عجلات طويلة');

  const year = name.match(/\b(20\d{2})\s*[-–]\s*(20\d{2}|Onwards|Up)\b/i);
  if (year) details.push(`طراز ${year[1]}–${year[2]}`);

  return [...new Set(details)].join('، ');
}

function buildSpecific(kind: string): string {
  switch (kind) {
    case 'front-lip':
    case 'canard':
      return 'أرسل صورة المصد الأمامي؛ أكّد نسخة المصد وعدد الأقسام ونقاط التثبيت والخلوص الأرضي قبل الطلب.';
    case 'side-skirt':
      return 'أكّد نوع الهيكل وطول العتبة ونقاط التثبيت ووحدة البيع يميناً ويساراً.';
    case 'spoiler':
    case 'roof-spoiler':
      return 'أرسل صورة غطاء الصندوق أو السقف وحدّد سيدان أو كوبيه؛ أكّد قواعد التثبيت وما إذا كان يلزم حفر.';
    case 'grille':
      return 'أكّد موضع حساس ACC وتجهيزات المصد قبل اعتماد الشبك.';
    case 'diffuser':
    case 'rear-lip':
    case 'bumper-trim':
    case 'bumper-extension':
    case 'bumper-vent':
      return 'أرسل صور المصد والعادم لتأكيد الأقسام والمخارج المطلوبة.';
    case 'hood':
      return 'أكّد القفل والمفصلات وفتحات التهوية ومحتويات التوريد قبل الطلب.';
    case 'hood-trim':
    case 'fender-trim':
    case 'air-vent':
      return 'أكّد شكل الفتحة ونسخة الرفرف أو غطاء المحرك ونقاط التثبيت.';
    case 'door':
      return 'أكّد الجهة والعدد والزجاج والمثبتات والتجهيزات المشمولة قبل الطلب.';
    case 'seat-cover':
    case 'interior-trim':
      return 'أرسل صورة المقاعد أو المقصورة؛ التصميم والتجهيزات يحددان المطابقة وطريقة التثبيت.';
    case 'intake':
      return 'أكّد المحرك ومحتويات الطقم ومتطلبات التثبيت قبل المقارنة.';
    case 'trunk-lid':
      return 'أكّد سنة الطراز ونوع الصندوق والمفصلات والقفل والتجهيزات الداخلية.';
    case 'fender':
    case 'front-bumper':
    case 'rear-bumper':
    case 'body-panel-set':
      return 'أكّد سنة الطراز وتكوين الهيكل ونقاط التثبيت الأصلية ومحتويات الطقم.';
    case 'mirror-cap':
      return 'أكّد تجهيز المرآة (طي كهربائي، كاميرا، تسخين) قبل اختيار الغطاء.';
    case 'engine-cover':
    case 'battery-cover':
    case 'radiator-cover':
    case 'strut-brace':
      return 'أكّد المحرك وسنة الطراز ونقاط التثبيت والقطع الأصلية التي سيغطيها المنتج.';
    case 'oil-pan-guard':
    case 'oil-cooler-guard':
    case 'underbody-guard':
    case 'mesh-guard':
      return 'أكّد المحرك وهيكل الحماية السفلي ونقاط التثبيت والخلوص المطلوب.';
    case 'tail-light':
    case 'drl':
      return 'أكّد سنة الطراز ونوع الإضاءة الأصلية والمقابس والتجهيزات المطلوبة.';
    case 'body-kit':
      return 'أكّد قائمة القطع المشمولة ونسخة المصد والعتبات والعادم قبل اعتماد الطقم.';
    default:
      return 'أكّد ما إذا كانت القطعة غطاءً إضافياً أو بديلاً، وعدد الأقسام وطريقة التثبيت.';
  }
}

export function normalizeProduct(product: ProductDetail): ProductDetail {
  const name = product.productDirName;
  const info = classifyProduct(name);
  if (!info) {
    throw new Error(`Unmapped product name: ${name}. Add an explicit part/category mapping before publishing.`);
  }

  const fromName = extractChassisCodes(name);
  const chassis = fromName.length ? fromName : product.chassisCodes;
  const vehicle = buildVehicle(chassis, name);
  const variant = buildVariant(name);
  const modelYears =
    product.yearStart > 0
      ? `${product.yearStart}–${product.yearEnd && product.yearEnd !== 9999 ? product.yearEnd : 'الآن'}`
      : '';
  const { part, kind, category } = info;
  const lighting = category === 'lighting';
  const guard = ['mesh-guard', 'underbody-guard', 'oil-pan-guard', 'oil-cooler-guard'].includes(kind);
  const accessory = /with[- ]led/i.test(name)
    ? 'وحدة الإضاءة LED'
    : /with[- ]mesh/i.test(name)
      ? 'الشبكة الداخلية'
      : '';
  if (lighting || guard || accessory) {
    const style = !lighting
      ? variant
      : /dragon[- ]scale/i.test(name)
        ? 'بتصميم حراشف التنين'
        : /\bCSL\b/i.test(name)
          ? 'بتصميم CSL'
          : '';
    const title = [part, style, `لسيارات ${vehicle}`].filter(Boolean).join(' ');
    const material = accessory ? `الكربون الجاف يخص جسم القطعة. تُؤكّد مواصفات ${accessory} على حدة.` : '';
    const checks = lighting
      ? [
          'تحقّق من سنة الصنع ونسخة المصباح الأصلي.',
          'أرسل صورة الموصل لتأكيد المطابقة.',
          'اطلب بيان وحدات الإضاءة والملحقات المشمولة.',
        ]
      : [
          'أرسل سنة الصنع وصور موضع التركيب.',
          'أكّد نقاط التثبيت ومحتويات الطقم قبل الطلب.',
          material || 'اطلب مواصفات مادة الحماية والتشطيب في عرض السعر.',
        ];
    const description = !lighting
      ? checks.join(' ')
      : 'أرسل سنة الصنع وصور المصباح الأصلي وموصله والكمية المطلوبة لتأكيد المطابقة ومحتويات الطلب قبل التسعير.';
    return {
      ...product,
      title,
      model: vehicle,
      chassisCodes: chassis,
      partType: kind,
      categorySlug: category,
      categoryAr: productCategories[category as keyof typeof productCategories],
      categoryArShort: part,
      seoTitle: `${title} | CCF`,
      description,
      seoDescription: `${title}. ${description}`,
      keywords: [part, style, vehicle],
      material,
      manufacturing: '',
      checks,
      specs: [
        ['نوع القطعة', part],
        ['مرجع المركبة', vehicle],
        ...(style ? [['التصميم', style] as [string, string]] : []),
        ...(material ? [['المادة', material] as [string, string]] : []),
        ['محتويات التوريد', 'تُحدّد في عرض السعر'],
      ],
      intentSegments: [part, style, vehicle],
    };
  }
  const title = `${part} من الكربون الجاف الحقيقي لسيارات ${vehicle}${variant ? ` — ${variant}` : ''}`;
  const seoTitle = `${part} كربون جاف حقيقي ${vehicle}${variant ? ` — ${variant}` : ''} | مصنع CCF بالجملة`;
  const seoDescription =
    `${part} كربون جاف حقيقي (Dry Carbon Fiber) لسيارات ${vehicle}${variant ? ` — ${variant}` : ''}` +
    `${modelYears ? ` (موديل ${modelYears})` : ''}. ` +
    'تُراجع المطابقة قبل التوريد من مصنع CCF — توريد بالجملة أو OEM/ODM. اطلب عرض السعر عبر واتساب.';
  const description =
    `${part} من الكربون الجاف الحقيقي بتصميم أكثر عدوانية لسيارات ${vehicle}` +
    `${variant ? ` (${variant})` : ''}${modelYears ? ` موديل ${modelYears}` : ''} — خيارك الأفضل لمشروع تعديل لافت. ` +
    'تُؤكَّد السنة ونسخة الهيكل بالصور، وتُورَّد مباشرة من مصنع CCF ' +
    'بالجملة أو ضمن مشروع OEM/ODM. أرسل صور الجزء الحالي والكمية ووجهة الشحن لعرض السعر عبر واتساب.';

  const fitment =
    'المطابقة النهائية تتطلب تأكيد السنة ونسخة الهيكل وصور الجزء الحالي؛ رمز الشاسيه وحده لا يثبت التوافق.';
  const specific = buildSpecific(kind);
  const keywordModels = buildKeywordModels(chassis);
  const englishPart = KIND_EN[kind] || part;
  const englishKeyword = `Dry Carbon Fiber ${englishPart} BMW ${[...chassis, ...keywordModels].join(' ')}`.trim();

  const keywords = [
    `${part} ${vehicle}`,
    keywordModels.length ? `${part} BMW ${keywordModels.join(' ')}` : '',
    `${part} كربون جاف`,
    `${part} كربون جاف حقيقي`,
    `${part} بالجملة`,
    modelYears ? `${part} موديل ${modelYears}` : '',
    chassis.length ? `BMW ${chassis.join(' ')} كربون جاف` : 'BMW كربون جاف',
    'مصنع CCF',
    'مصنع كربون فيبر',
    'توريد بالجملة',
    'OEM ODM كربون',
    'كربون جاف حقيقي',
    'تصميم أكثر عدوانية',
    englishKeyword,
    variant,
  ].filter(Boolean);

  return {
    ...product,
    slug: cleanSlug(publishedSlugs[product.slug] || product.slug),
    chassisCodes: chassis,
    model: vehicle,
    title,
    seoTitle,
    seoDescription,
    description,
    categorySlug: category,
    categoryAr: productCategories[category as keyof typeof productCategories] || product.categoryAr,
    categoryArShort: part,
    partType: kind,
    material: 'كربون جاف حقيقي؛ تُؤكَّد البنية والتشطيب للمرجع المطلوب',
    manufacturing: 'كربون جاف من مصنع CCF؛ تُؤكَّد طريقة التصنيع والتشطيب في عرض السعر',
    keywords,
    checks: [
      fitment,
      specific,
      'أكّد المادة (كربون جاف حقيقي) والتشطيب ووحدة البيع والمثبتات المشمولة كتابةً.',
      'يتوفر توريد بالجملة من مصنع CCF؛ تُحدّد الكمية الدنيا ومدة التجهيز والشحن بحسب المرجع والطلب.',
    ],
    specs: [
      ['نوع القطعة', part],
      ['مرجع المركبة', vehicle],
      ['التصميم أو النسخة', variant || 'حسب الصور والمرجع'],
      ['المادة والتشطيب', 'كربون جاف حقيقي؛ يُؤكَّد التشطيب للمرجع'],
      ['التوريد', 'مصنع CCF — جملة / OEM-ODM'],
      ['بلد المنشأ', 'الصين — مصنع CCF'],
      ['محتويات التوريد', 'تُحدّد في عرض السعر'],
    ],
    intentSegments: [`${part} ${vehicle}`, `${part} مصنع`, `${part} بالجملة`, variant].filter(Boolean),
  };
}
