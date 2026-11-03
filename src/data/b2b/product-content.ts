import type { ProductDetail } from './all-products';

/** Stable published URLs must survive a new image import. */
const publishedSlugs: Record<string, string> = {
  'bmw-g80-g82-carbon-fiber-r44-style-front-lip': 'bmw-g80-g82-carbon-fiber-front-lip-r44-style',
  'bmw-g80-g82-carbon-fiber-csl-style-3-piece-front-lip': 'bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style',
  'bmw-g80-g82-carbon-fiber-mp-style-rear-diffuser': 'bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style',
};

export const productCategories = {
  'front-lips-splitters': 'الشفاه الأمامية والكانارد',
  'grilles-air-intake': 'الشبكات وأنظمة سحب الهواء',
  'side-skirts': 'التنانير الجانبية',
  'mirror-caps': 'أغطية المرايا',
  hoods: 'أغطية المحرك',
  'spoilers-wings': 'السبويلر والأجنحة',
  'rear-diffusers': 'الناشرات وملحقات المصد الخلفي',
  'exterior-trim': 'زخارف الفتحات الخارجية',
  'interior-trim': 'أغطية المقاعد الداخلية',
  'body-panels': 'الأبواب والرفارف',
  'engine-bay': 'أغطية حجرة المحرك',
} as const;

export function normalizeProduct(product: ProductDetail): ProductDetail {
  const name = product.productDirName;
  const matches = name.match(/\b[FG]\d{2}\b/g);
  const chassis = matches?.length ? [...new Set(matches)] : product.chassisCodes;
  const style =
    name.match(/-([A-Z0-9]+)-Style/i)?.[1].toUpperCase() ||
    name.match(/-(AX|MP)-(?:Front-Lip|Rear-Diffuser|Side-Skirts)/i)?.[1].toUpperCase();
  let category = product.categorySlug;
  let part = product.categoryArShort;
  let kind = product.partType;
  if (/Front-Lip/i.test(name)) {
    part = 'شفّة أمامية';
    kind = 'front-lip';
    category = 'front-lips-splitters';
  }
  if (/Canards/i.test(name)) {
    part = 'كانارد أمامي';
    kind = 'canard';
    category = 'front-lips-splitters';
  }
  if (/Grille/i.test(name)) {
    part = 'شبك أمامي';
    kind = 'grille';
    category = 'grilles-air-intake';
  }
  if (/Air-Intake-Kit/i.test(name)) {
    part = 'طقم سحب هواء';
    kind = 'intake';
    category = 'grilles-air-intake';
  }
  if (/Side-Skirts/i.test(name)) {
    part = /Flat/i.test(name) ? 'تنانير جانبية مسطحة' : 'تنانير جانبية';
    kind = 'side-skirt';
    category = 'side-skirts';
  }
  if (/Rear-Spoiler/i.test(name)) {
    part = 'سبويلر خلفي';
    kind = 'spoiler';
    category = 'spoilers-wings';
  }
  if (/Rear-Diffuser/i.test(name)) {
    part = /Outer-Frame/i.test(name)
      ? 'إطار ناشر خلفي'
      : /Center-Exit/i.test(name)
        ? 'طقم ناشر للعادم المركزي'
        : 'ناشر خلفي';
    kind = 'diffuser';
    category = 'rear-diffusers';
  }
  if (/Rear-Bumper-Extensions/i.test(name)) {
    part = 'امتدادات المصد الخلفي';
    kind = 'bumper-extension';
    category = 'rear-diffusers';
  }
  if (/Bumper-Corner-Trim/i.test(name)) {
    part = /Rear/i.test(name) ? 'زخارف زوايا المصد الخلفي' : 'زخارف زوايا المصد الأمامي';
    kind = 'bumper-trim';
    category = /Rear/i.test(name) ? 'rear-diffusers' : 'exterior-trim';
  }
  if (/Fender-Vent-Trim/i.test(name)) {
    part = 'زخارف فتحات الرفارف';
    kind = 'fender-trim';
    category = 'exterior-trim';
  }
  if (/Front-Bumper-(?:Air-Vents|Vent-Trim)/i.test(name)) {
    part = 'زخارف فتحات المصد الأمامي';
    kind = 'bumper-vent';
    category = 'exterior-trim';
  }
  if (/Hood-Vent-Trim/i.test(name)) {
    part = 'زخارف فتحات غطاء المحرك';
    kind = 'hood-trim';
    category = 'exterior-trim';
  }
  if (/Front-Fenders/i.test(name)) {
    part = 'رفارف أمامية';
    kind = 'fender';
    category = 'body-panels';
  }
  if (/Doors/i.test(name)) {
    part = 'أبواب M4 كوبيه';
    kind = 'door';
    category = 'body-panels';
  }
  if (/Seat-Back-Covers/i.test(name)) {
    part = 'أغطية ظهر المقاعد';
    kind = 'seat-cover';
    category = 'interior-trim';
  }
  if (/Mirror-Caps/i.test(name)) {
    part = 'أغطية مرايا';
    kind = 'mirror-cap';
    category = 'mirror-caps';
  }
  if (/-Hood$/i.test(name)) {
    part = 'غطاء محرك';
    kind = 'hood';
    category = 'hoods';
  }
  if (/Battery-Cover/i.test(name)) {
    part = 'غطاء البطارية';
    kind = 'battery-cover';
    category = 'engine-bay';
  }
  if (/Engine-Cover/i.test(name)) {
    part = 'غطاء تجميلي للمحرك';
    kind = 'engine-cover';
    category = 'engine-bay';
  }
  if (/Radiator-Cover/i.test(name)) {
    part = 'غطاء منطقة الردياتير';
    kind = 'radiator-cover';
    category = 'engine-bay';
  }
  if (kind === 'custom' || /قطعة كربون مخصصة/.test(part)) {
    throw new Error(`Unmapped product name: ${name}. Add an explicit part/category mapping before publishing.`);
  }
  const details = [
    style ? `تصميم ${style}` : '',
    /3-Piece/i.test(name) ? 'ثلاث قطع' : '',
    /No-ACC/i.test(name) ? 'بدون ACC' : /With-ACC/i.test(name) ? 'مع ACC' : '',
    /Red/i.test(name) ? 'كربون أحمر' : '',
  ].filter(Boolean);
  // Some source names omit “Style”; retain CSL and M3 distinctions explicitly.
  if (!style && /CSL-Grille/i.test(name)) details.unshift('تصميم CSL');
  if (/G80-M3-Rear-Spoiler/i.test(name)) details.push('مرجع M3');
  const variant = details.join('، ');
  const models: Record<string, string> = {
    G80: 'M3',
    G82: 'M4',
    G83: 'M4',
    G87: 'M2',
    G90: 'M5',
    F80: 'M3',
    F82: 'M4',
    F83: 'M4',
    F87: 'M2',
    F90: 'M5',
  };
  const vehicle = `BMW ${chassis.map((c) => `${models[c] ? models[c] + ' ' : ''}${c}`).join('/')}`;
  const title = `${part} كربون ${vehicle}${variant ? ` — ${variant}` : ''}`;
  const fitment =
    'المطابقة النهائية تتطلب تأكيد السنة ونسخة الهيكل وصور الجزء الحالي؛ رمز الشاسيه وحده لا يثبت التوافق.';
  const specific =
    kind === 'front-lip' || kind === 'canard'
      ? 'أرسل صورة المصد الأمامي؛ أكّد نسخة المصد وعدد الأقسام ونقاط التثبيت والخلوص الأرضي قبل الطلب.'
      : kind === 'side-skirt'
        ? 'أكّد نوع الهيكل وطول العتبة ونقاط التثبيت ووحدة البيع يميناً ويساراً.'
        : kind === 'spoiler'
          ? 'أرسل صورة غطاء الصندوق وحدّد سيدان أو كوبيه؛ أكّد قواعد التثبيت وما إذا كان يلزم حفر.'
          : kind === 'grille'
            ? 'أكّد موضع حساس ACC وتجهيزات المصد قبل اعتماد الشبك.'
            : kind === 'diffuser' || kind === 'bumper-trim' || kind === 'bumper-extension'
              ? 'أرسل صور المصد والعادم لتأكيد الأقسام والمخارج المطلوبة.'
              : kind === 'hood'
                ? 'أكّد القفل والمفصلات وفتحات التهوية ومحتويات التوريد قبل الطلب.'
                : kind === 'door'
                  ? 'هذا مرجع أبواب كوبيه؛ أكّد الجهة والعدد والزجاج والمثبتات والتجهيزات المشمولة.'
                  : kind === 'seat-cover'
                    ? 'أرسل صورة المقاعد؛ تصميم المقعد وتجهيزاته يحددان المطابقة وطريقة التثبيت.'
                    : kind === 'intake'
                      ? 'أكّد المحرك ومحتويات الطقم ومتطلبات التثبيت قبل المقارنة.'
                      : 'أكّد ما إذا كانت القطعة غطاءً إضافياً أو بديلاً، وعدد الأقسام وطريقة التثبيت.';
  return {
    ...product,
    slug: publishedSlugs[product.slug] || product.slug,
    chassisCodes: chassis,
    model: vehicle,
    title,
    seoTitle: `${title} | CCF`,
    seoDescription: `${title}. راجع الصور والمطابقة والمادة ومحتويات التوريد، وأرسل الكمية والوجهة لعرض سعر عبر واتساب.`,
    description: `${part}${variant ? ` (${variant})` : ''} ضمن مراجع ${vehicle}. ${specific} أرسل سنة السيارة وصور الجزء الحالي والكمية والوجهة لتأكيد المواصفة وطلب السعر.`,
    categorySlug: category,
    categoryAr: productCategories[category as keyof typeof productCategories] || product.categoryAr,
    categoryArShort: part,
    partType: kind,
    material: 'ألياف كربون؛ تُؤكّد البنية والمادة للمرجع المطلوب',
    manufacturing: 'تُؤكّد طريقة التصنيع والتشطيب في عرض السعر',
    keywords: [],
    checks: [
      fitment,
      specific,
      'أكّد المادة والتشطيب ووحدة البيع والمثبتات المشمولة كتابةً.',
      'تُحدّد الكمية الدنيا ومدة التجهيز والشحن بحسب المرجع والطلب.',
    ],
    specs: [
      ['نوع القطعة', part],
      ['مرجع المركبة', vehicle],
      ['التصميم أو النسخة', variant || 'حسب الصور والمرجع'],
      ['المادة والتشطيب', 'يُؤكّدان للمرجع قبل الطلب'],
      ['محتويات التوريد', 'تُحدّد في عرض السعر'],
      ['التوريد', 'جملة؛ تطوير OEM/ODM حسب المشروع'],
    ],
    intentSegments: [`${part} ${vehicle}`, variant],
  };
}
