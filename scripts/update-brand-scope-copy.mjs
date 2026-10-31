import fs from 'node:fs';
const replacements = {
  'src/pages/index.astro': [
    [
      'قطع ألياف كربون متوفرة لمركبات BMW و Mercedes-AMG و Porsche و Audi و Ferrari و Lamborghini وغيرها.',
      'قطع ألياف كربون لسيارات BMW وMercedes-AMG وPorsche، مع كتالوجات حسب الطراز وتوريد B2B.',
    ],
    [
      'علامات مختارة من كتالوجنا — تتوفر تطبيقات إضافية تشمل McLaren و Maserati و Tesla وغيرها عند الطلب.',
      'يركز هذا الموقع على BMW وMercedes-AMG وPorsche. اختر العلامة للوصول إلى كتالوجات الطرازات ومراجع القطع.',
    ],
  ],
  'src/pages/vehicles/index.astro': [
    [
      'تغطي CCF أكثر من 76 طراز مركبة عبر العلامات الأوروبية الفاخرة والرياضية. اختر علامتك لعرض القطع المتوفرة — وتتوفر علامات إضافية عبر الكتالوجات أو التطوير المخصص.',
      'اختر BMW أو Mercedes-AMG أو Porsche، ثم افتح كتالوج الطراز المناسب. يعرض هذا الموقع هذه العلامات الثلاث فقط؛ تُراجع مطابقة القطعة وتوفرها للطلب المحدد.',
    ],
    ['columns={4}', 'columns={3}'],
    [
      'يعرض الموقع التطبيقات المختارة فقط — الكتالوج الفعلي أوسع. أرسل لنا بيانات مركبتك للتحقق من تغطية الكتالوج، أو لتقييم طلب تطوير مخصص عبر OEM/ODM.',
      'إذا كان طرازك من BMW أو Mercedes-AMG أو Porsche غير مدرج، أرسل السنة ورمز الهيكل والقطعة المطلوبة لمراجعة التطبيق ضمن نطاق العلامات الثلاث.',
    ],
    ['title="لم تجد مركبتك؟"', 'title="لم تجد طرازك ضمن العلامات الثلاث؟"'],
    ['https://ccfrp.com/vehicles/', '/catalogs'],
    ['تصفح المركبات على الموقع الرئيسي', 'تصفح كتالوجات العلامات الثلاث'],
  ],
  'src/pages/products/front-lips-splitters.astro': [
    [
      'تشمل هذه المجموعة 19 تصميم شفاه أمامية وسبليتر لمركبات BMW M — من G80/G82 و G87 M2 إلى G90 M5 وأجيال F السابقة، إضافة إلى Aston Martin DBX. توريد كتالوج بالجملة وتطوير مخصص للموزعين وورش التعديل.',
      'استعرض شفاه أمامية وسبليتر لسيارات BMW M، تشمل تطبيقات G80/G82 وG87 M2 وG90 M5 وأجيال F المختارة. أرسل مرجع التصميم ونسخة المصد والكمية لمراجعة طلب التوريد.',
    ],
  ],
  'src/pages/products/grilles-air-intake.astro': [
    [
      'تشمل هذه المجموعة 16 تصميم شبك أمامي وفتحات تهوية لمركبات BMW — من G80/G82 و G87 M2 إلى G20 و G90 M5 — إضافة إلى إطار شبك Aston Martin DBX. توريد كتالوج بالجملة وتطوير مخصص للموزعين وورش التعديل.',
      'استعرض شبكات أمامية وقطع فتحات هواء لسيارات BMW، تشمل تطبيقات G80/G82 وG87 M2 وG20 وG90 M5. أكّد نسخة المصد والتجهيزات ومرجع المنتج قبل الطلب.',
    ],
  ],
  'src/pages/products/rear-diffusers.astro': [
    [
      'تشمل هذه المجموعة 16 تصميم ناشر خلفي لمركبات BMW M — من G80/G82 و G87 M2 إلى F90 M5 — إضافة إلى Aston Martin DBX. خيارات تشمل الإدخال الأوسط والتجميعة الكاملة وتصاميم بإضاءة مركزية.',
      'استعرض ناشرات خلفية لسيارات BMW M، تشمل تطبيقات G80/G82 وG87 M2 وF90 M5. تختلف الأقسام وتصاميم مخارج العادم والإضاءة حسب المرجع المختار.',
    ],
  ],
  'src/pages/products/side-skirts.astro': [
    ['وAston Martin DBX', ''],
    ['BMW M وMercedes-Benz W465 G63 و', 'BMW M وMercedes-Benz W465 G63؛'],
  ],
  'src/pages/products/spoilers-wings.astro': [
    [
      'تشمل هذه المجموعة 9 تصاميم سبويلر وأجنحة خلفية لمركبات BMW M — من G80/G82 و G87 M2 إلى F90 M5 — إضافة إلى سبويلر سقف Aston Martin DBX. توريد كتالوج بالجملة وتطوير مخصص للموزعين وورش التعديل.',
      'استعرض سبويلر وأجنحة خلفية لسيارات BMW M، تشمل تطبيقات G80/G82 وG87 M2 وF90 M5. أرسل مرجع التصميم ونسخة الهيكل لمراجعة نقاط التثبيت ومحتويات التوريد.',
    ],
  ],
  'src/pages/products/index.astro': [
    [
      'تصنع CCF أكثر من 1500 قطعة من ألياف الكربون لأكثر من 76 طراز مركبة، تشمل الشفاه الأمامية والناشرات والتنانير الجانبية والسبويلر وأغطية المحرك وغيرها. تصفح حسب نوع القطعة أو اعثر على القطع المتوفرة لمركبتك.',
      'تصفّح قطع ألياف الكربون ضمن نطاق BMW وMercedes-AMG وPorsche: شفاه أمامية، ناشرات، قطع جانبية، أجنحة، أغطية محرك وصندوق ومرايا وشبكات. تختلف القطع المتاحة حسب الطراز والمرجع.',
    ],
  ],
  'src/pages/products/trunk-lids.astro': [
    [
      'كتالوجنا يغطي أكثر من 76 طراز مركبة — أرسل لنا طرازك للتحقق من التوفر أو تقييم تطوير مخصص.',
      'أرسل طراز BMW أو Mercedes-AMG أو Porsche والسنة والقطعة المطلوبة لمراجعة التطبيق ضمن نطاق هذا الموقع.',
    ],
  ],
  'src/pages/cases/index.astro': [
    [
      'توثّق هذه القصص طرقاً مختلفة يعمل بها العملاء مع CCF — مشروع تطوير مخصص وزيارات حقيقية وجهاً لوجه لمشتري دوليين.',
      'توثّق هذه القصص زيارات حقيقية إلى CCF ومناقشات المنتجات والتوريد مع مشترين من الولايات المتحدة وكندا.',
    ],
    ['من تطوير قطع كربون مخصصة إلى مناقشات المشاريع وجهاً لوجه', 'من مراجعة المنتجات إلى مناقشات المشاريع وجهاً لوجه'],
    ['columns={3}', 'columns={2}'],
  ],
};
for (const [file, pairs] of Object.entries(replacements)) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [before, after] of pairs) content = content.replaceAll(before, after);
  if (file === 'src/pages/index.astro') content = content.replace(/(<Projects[\s\S]*?)columns=\{3\}/, '$1columns={2}');
  fs.writeFileSync(file, content);
}

// Do not reuse whole-company product/model totals as counts for the narrowed website.
for (const file of ['index', 'about', 'grow/wholesale', 'products/index', 'vehicles/index']) {
  const name = `src/pages/${file}.astro`;
  let text = fs.readFileSync(name, 'utf8');
  text = text.replace(/\s*\{ amount: '(?:1,500\+|76\+)', title: '[^']*' \},?/g, '');
  text = text.replace(/stats=\{\[/, "stats={[\n{ amount: '3', title: 'علامات مركبات في هذا الموقع' },");
  text = text.replace(/\s*\{ amount: '8', title: 'علامات رئيسية' \},?/g, '');
  fs.writeFileSync(name, text);
}
// A brand scope change must reach per-page source metadata as well as the central map.
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
for (const file of fs
  .readdirSync('src/pages', { recursive: true })
  .filter((name) => name.endsWith('.astro') && !name.includes('['))) {
  let route =
    '/' +
    file
      .replaceAll('\\', '/')
      .replace(/(?:\/)?index\.astro$/, '')
      .replace(/\.astro$/, '');
  if (route === '/404') route = '/404.html';
  const record = seo[route];
  if (!record) continue;
  const full = 'src/pages/' + file;
  let content = fs.readFileSync(full, 'utf8');
  content = content.replace(/const metadata = \{[\s\S]*?\n\};/, (block) =>
    block.replace(/description:\s*'[^']*'/, () => `description: '${record.description}'`)
  );
  fs.writeFileSync(full, content);
}
let names = fs.readFileSync('src/components/widgets/ModelCatalogs.astro', 'utf8');
names = names.replace(
  'للموديلات غير المدرجة، أرسل السنة وصورة القطعة عبر واتساب.',
  'للطرازات غير المدرجة ضمن BMW وMercedes-AMG وPorsche، أرسل السنة وصورة القطعة عبر واتساب.'
);
fs.writeFileSync('src/components/widgets/ModelCatalogs.astro', names);
