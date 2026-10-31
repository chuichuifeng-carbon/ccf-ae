import fs from 'node:fs';

// One-time migration: preserve the original before/after audit on accidental reruns.
if (fs.existsSync('reports/seo-intent-2026-10-31/before.json')) {
  throw new Error('Already applied. Edit src/data/seo.json and the active manifest for later changes.');
}

// Editorial changes are explicit, route-specific and independent of search-volume assumptions.
const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const write = (path, value) => fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const seo = read('src/data/seo.json');
const before = structuredClone(seo);
const planPath = 'reports/seo-metadata-plan/metadata-plan.json';
const plan = read(planPath);
const updates = {
  '/': [
    'مصنع قطع كربون فايبر للسيارات في الصين | CCF',
    'مصنع قطع ألياف الكربون للسيارات في الصين',
    'مصنع CCF لقطع كربون فايبر BMW ومرسيدس AMG وبورش. توريد للموزعين وورش التعديل وتطوير OEM/ODM؛ أرسل الطراز والكمية لطلب عرض سعر عبر واتساب.',
  ],
  '/products': [
    'قطع كربون فايبر للسيارات حسب نوع القطعة | CCF',
    'قطع كربون فايبر للسيارات حسب نوع القطعة',
    'اختر قطع ألياف الكربون حسب النوع: شفة أمامية، ديفيوزر، سبويلر، غطاء محرك ومرايا. راجع التطبيقات المختارة واطلب عرض توريد للموزعين وورش التعديل.',
  ],
  '/vehicles': [
    'قطع كربون BMW ومرسيدس AMG وبورش | CCF',
    'قطع ألياف الكربون حسب ماركة السيارة',
    'اختر BMW أو مرسيدس AMG أو بورش للوصول إلى كتالوجات قطع الكربون حسب الطراز والجيل. أرسل مرجع القطعة وسنة المركبة والكمية لطلب التوريد.',
  ],
  '/catalogs': [
    'كتالوج قطع كربون BMW ومرسيدس وبورش PDF | CCF',
    'كتالوجات قطع ألياف الكربون PDF حسب المركبة',
    'افتح كتالوجات PDF لقطع كربون BMW وMercedes-AMG وPorsche حسب الطراز والجيل. حدّد رقم المرجع والمادة ثم أرسل الكمية والوجهة لطلب السعر عبر واتساب.',
  ],
  '/grow': [
    'توريد قطع كربون للشركات: جملة وOEM ودروبشيبينغ | CCF',
    'اختر طريقة توريد قطع الكربون لأعمالك',
    'قارن طرق التعاون مع مصنع CCF: شراء بالجملة، تصنيع OEM/ODM، دروبشيبينغ أو شراكة توزيع. اختر المسار وفق منتجاتك وحجم الطلب وقنوات البيع.',
  ],
  '/grow/wholesale': [
    'قطع كربون فايبر للسيارات بالجملة من المصنع | CCF',
    'توريد قطع ألياف الكربون للسيارات بالجملة',
    'توريد قطع كربون BMW ومرسيدس AMG وبورش للموزعين وورش التعديل. راجع العينة والكمية والطلبات المختلطة، وأرسل قائمة القطع والوجهة لطلب سعر الجملة.',
  ],
  '/grow/oem-odm': [
    'تصنيع قطع كربون فايبر حسب الطلب OEM/ODM | CCF',
    'تصنيع قطع ألياف الكربون حسب الطلب OEM/ODM',
    'طوّر قطع كربون لعلامتك مع مصنع CCF. ابدأ بعينة أو CAD أو صور مرجعية؛ ناقش القوالب والنموذج الأولي واعتماد العينة قبل تحديد الإنتاج والسعر.',
  ],
  '/grow/dropshipping': [
    'دروبشيبينغ قطع كربون السيارات للمتاجر | CCF',
    'دروبشيبينغ قطع الكربون للمتاجر الإلكترونية',
    'اختبر بيع قطع كربون مختارة بتنفيذ طلبات فردية من CCF. تحقّق من المنتج والوجهة والتغليف وتكلفة الشحن وسياسة المطالبات قبل قبول طلب عميلك.',
  ],
  '/grow/channel-partners': [
    'شراكة توزيع قطع كربون السيارات للموزعين | CCF',
    'شراكة توزيع قطع الكربون للموزعين والتجار',
    'ناقش شراكة توزيع قطع كربون السيارات مع CCF. قدّم سوقك وقنوات البيع وخطة المنتجات والشراء لمراجعة شروط التعاون والمنطقة دون افتراض حصرية تلقائية.',
  ],
  '/vehicles/bmw': [
    'قطع كربون BMW M2 وM3 وM4 وM5 بالجملة | CCF',
    'قطع ألياف الكربون لسيارات BMW',
    'كتالوجات قطع كربون بي إم دبليو BMW M2 وM3 وM4 وM5 وأجيال G وF المختارة. حدّد الطراز والشاسيه ومرجع القطعة لطلب عرض توريد من المصنع.',
  ],
  '/vehicles/mercedes-amg': [
    'قطع كربون مرسيدس AMG: G63 وGT وC63 | CCF',
    'قطع ألياف الكربون لمرسيدس Mercedes-AMG',
    'تصفّح كتالوجات قطع كربون مرسيدس Mercedes-AMG لطرازات G63 وAMG GT وC63 وA45 وCLA45 المختارة. أكّد الجيل ومرجع القطعة والكمية لطلب سعر التوريد.',
  ],
  '/vehicles/porsche': [
    'قطع كربون بورش 911 و718 وكايين وتايكان | CCF',
    'قطع ألياف الكربون لبورش Porsche',
    'كتالوجات قطع كربون بورش Porsche 911 و718 وباناميرا وكايين وتايكان. اختر الجيل ومرجع القطعة ثم أرسل الكمية والوجهة لطلب عرض توريد من CCF.',
  ],
  '/products/front-lips-splitters': [
    'شفة أمامية وسبليتر كربون BMW M بالجملة | CCF',
    'شفاه أمامية وسبليتر كربون لسيارات BMW M',
    'قارن شفاه أمامية وسبليتر كربون BMW M بتصاميم CSL وR44 وMP المختارة. راجع المصد والمادة ومحتويات الطقم وأرسل المرجع والكمية لطلب سعر الجملة.',
  ],
  '/products/rear-diffusers': [
    'ديفيوزر خلفي كربون BMW M بالجملة | CCF',
    'ديفيوزر وناشرات خلفية كربون لسيارات BMW M',
    'استعرض ديفيوزر كربون BMW M لتطبيقات G80/G82 وG87 وF90 المختارة. أكّد نسخة المصد ومخارج العادم وأقسام الطقم قبل طلب عرض توريد من CCF.',
  ],
  '/products/side-skirts': [
    'عتبات جانبية كربون BMW ومرسيدس G63 | CCF',
    'عتبات وتنانير جانبية كربون BMW ومرسيدس G63',
    'قارن عتبات وتنانير كربون جانبية لتطبيقات BMW M ومرسيدس W465 G63 المختارة. أكّد الهيكل ووظيفة القطعة ومحتويات الطقم والكمية قبل طلب السعر.',
  ],
  '/products/spoilers-wings': [
    'سبويلر وأجنحة خلفية كربون BMW M بالجملة | CCF',
    'سبويلر وأجنحة خلفية كربون لسيارات BMW M',
    'اختر سبويلر أو جناحاً خلفياً كربون لسيارات BMW M المختارة. قارن التصميم وطريقة التثبيت ومحتويات التوريد، وأرسل المرجع والكمية لطلب سعر الجملة.',
  ],
  '/products/hoods': [
    'غطاء محرك كربون BMW M2 وM3 وM5 | CCF',
    'أغطية محرك كربون لسيارات BMW',
    'استعرض أغطية محرك كربون BMW بتصاميم وفتحات تهوية مختارة. راجع الجيل والقفل والمفصلات وبنية المادة، وأرسل المرجع والكمية لطلب عرض توريد.',
  ],
  '/products/trunk-lids': [
    'غطاء صندوق أمتعة كربون BMW M2 وM3 وM4 وM5 | CCF',
    'أغطية صندوق الأمتعة كربون لسيارات BMW',
    'تصفّح أغطية شنطة وصندوق أمتعة كربون لتطبيقات BMW M2 وM3 وM4 وM5 المختارة. أكّد الهيكل والقفل والتجهيزات ومحتويات التوريد قبل طلب سعر الجملة.',
  ],
  '/products/grilles-air-intake': [
    'شبك أمامي وقطع فتحات هواء كربون BMW | CCF',
    'شبكات أمامية وقطع فتحات هواء كربون BMW',
    'شبكات أمامية وقطع فتحات هواء كربون BMW لتطبيقات G80/G82 وG87 وG20 وG90 المختارة. أرسل صورة المصد وتجهيزاته ومرجع المنتج لتأكيد النسخة والسعر.',
  ],
  '/products/mirror-caps': [
    'أغطية مرايا كربون BMW F90 وF8x | CCF',
    'أغطية مرايا جانبية كربون لسيارات BMW',
    'قارن أغطية مرايا كربون BMW F90 وF8x المختارة وخيارات النسيج والتصميم. أرسل صورة المرآة وسنة المركبة لتأكيد الغطاء البديل وطريقة التركيب والسعر.',
  ],
  '/products/bmw-g80-g82-carbon-fiber-front-lip-r44-style': [
    'شفة كربون BMW M3 G80 وM4 G82 تصميم R44 | CCF',
    'شفّة أمامية كربون BMW M3 G80 وM4 G82 — تصميم R44',
    'شفّة أمامية R44 لسيارات BMW M3 G80 وM4 G82 بمراجع DCF وWet carbon منفصلة. راجع الصور والمادة، وأرسل نسخة المصد والكمية لطلب عرض سعر.',
  ],
  '/products/bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style': [
    'شفة كربون BMW M3 G80 وM4 G82 تصميم CSL | CCF',
    'شفّة كربون BMW M3 G80 وM4 G82 — CSL من ثلاث قطع',
    'شفّة أمامية كربون بتصميم CSL من ثلاث قطع لسيارات BMW M3 G80 وM4 G82. راجع صور المنتج ومراجع المادة وأكّد المصد ومحتويات الطقم قبل طلب السعر.',
  ],
  '/products/bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style': [
    'ديفيوزر كربون BMW M3 G80 وM4 G82 تصميم MP | CCF',
    'ديفيوزر كربون BMW M3 G80 وM4 G82 — تصميم MP',
    'ديفيوزر خلفي كربون بتصميم MP لسيارات BMW M3 G80 وM4 G82، مرجع 44 في الكتالوج. أكّد مخارج العادم ومحتويات التوريد والكمية لطلب السعر.',
  ],
  '/products/bmw-g87-m2-carbon-fiber-hood': [
    'غطاء محرك كربون BMW M2 G87 بفتحات تهوية | CCF',
    'غطاء محرك كربون BMW M2 G87 بفتحات تهوية',
    'راجع صور غطاء محرك كربون BMW M2 G87 بفتحات تهوية. أرسل سنة المركبة وصورة الغطاء والكمية لتأكيد المادة والقفل والمفصلات وطلب عرض التوريد.',
  ],
  '/cases': [
    'زيارات عملاء مصنع قطع الكربون ومراجعة المورد | CCF',
    'زيارات العملاء ومناقشات توريد قطع الكربون',
    'شاهد صور زيارات عملاء من كندا والولايات المتحدة إلى CCF لمناقشة قطع الكربون ومراجعة المنتجات. استخدم الأدلة لتقييم المورد قبل طلب التوريد.',
  ],
  '/about': [
    'عن CCF: مصنع قطع الكربون في قوانغدونغ، الصين',
    'شركة CCF ومصنع قطع الكربون في الصين',
    'تعرّف على شركة CCF ومكتب قوانغتشو وقاعدة الإنتاج في تشينغيوان بالصين. راجع صور المصنع وتاريخ التصنيع ووثائق التحقق قبل اختيار مورد قطع الكربون.',
  ],
  '/contact': [
    'طلب عرض سعر قطع كربون السيارات عبر واتساب | CCF',
    'اطلب عرض سعر لقطع كربون السيارات من CCF',
    'تواصل مع مصنع CCF عبر واتساب أو البريد لطلب توريد قطع كربون أو تطوير OEM/ODM. أرسل الطراز والسنة ومرجع المنتج والكمية ومدينة التسليم.',
  ],
  '/faqs': [
    'شراء قطع الكربون: الكمية والمطابقة والشحن والضمان | CCF',
    'أسئلة شراء قطع ألياف الكربون بالجملة',
    'إجابات عن شراء قطع الكربون من CCF: الحد الأدنى للطلب والعينة والمطابقة وOEM/ODM والشحن والضمان. راجع الشروط قبل إرسال استفسار التوريد.',
  ],
  '/blog': [
    'أدلة شراء قطع الكربون: المواد والمطابقة والأسعار | CCF',
    'أدلة شراء قطع ألياف الكربون للموزعين',
    'أدلة عملية لمشتري قطع الكربون بالجملة: الفرق بين الكربون الجاف والرطب، التحقق من توافق القطعة ومقارنة عروض الأسعار قبل طلب التوريد.',
  ],
  '/dry-carbon-vs-wet-carbon': [
    'الفرق بين الكربون الجاف والرطب لقطع السيارات | CCF',
    'ما الفرق بين الكربون الجاف والرطب لقطع السيارات؟',
    'تعرّف على الفرق بين Dry Carbon وWet Carbon وما تؤكده عن بنية القطعة وطريقة التصنيع. مثال BMW G80/G82 وقائمة مقارنة لمشتري الجملة قبل الطلب.',
  ],
};

const intros = {
  '/vehicles/bmw':
    'تصفّح قطع كربون فايبر بي إم دبليو BMW M2 وM3 وM4 وM5 وأجيال G وF المختارة. افتح كتالوج الطراز أدناه، ثم حدّد مرجع القطعة وسنة المركبة ونسخة الهيكل لطلب توريد بالجملة من مصنع CCF.',
  '/vehicles/mercedes-amg':
    'قطع كربون فايبر لمرسيدس بنز Mercedes-AMG، تشمل تطبيقات G63 وAMG GT وC63 وA45 وCLA45 المختارة. اختر كتالوج الطراز والجيل أدناه؛ تختلف المطابقة حسب الشاسيه والمصد وتجهيزات المركبة، وتُراجع قبل عرض سعر التوريد.',
  '/vehicles/porsche':
    'تصفّح قطع كربون فايبر بورش Porsche: 911 بأجيال 991 و992، و718 وباناميرا وكايين وتايكان. افتح كتالوج الطراز والجيل أدناه، ثم أرسل مرجع القطعة والكمية والوجهة لمراجعة المطابقة وطلب سعر التوريد.',
  '/grow/dropshipping':
    'للمتاجر الإلكترونية والبائعين: ناقش تنفيذ الطلبات الفردية لقطع كربون BMW ومرسيدس AMG وبورش المختارة قبل الالتزام بمخزون. تأكد أولاً من أهلية المنتج والمطابقة والوجهة وتكلفة الشحن وآلية معالجة المطالبات؛ الخدمة تُراجع لكل طلب.',
  '/grow/channel-partners':
    'للموزعين والتجار الذين يخططون لتوريد متكرر: ناقش شراكة قطع كربون BMW ومرسيدس AMG وبورش حول سوقك وقنوات البيع وخطة المنتجات والشراء. تُراجع المنطقة والشروط والدعم باتفاق مكتوب، ولا تعني الشراكة حصرية تلقائية.',
  '/vehicles':
    'اختر بي إم دبليو BMW أو مرسيدس Mercedes-AMG أو بورش Porsche، ثم افتح كتالوج الطراز والجيل. يعرض هذا الموقع هذه العلامات الثلاث فقط؛ أرسل مرجع القطعة وسنة المركبة والكمية لمراجعة المطابقة والتوفر والسعر.',
  '/catalogs':
    'اختر العلامة والطراز وافتح كتالوج PDF مباشرة. تعرض هذه الصفحة كتالوجات BMW ومرسيدس Mercedes-AMG وبورش Porsche؛ حدّد رقم المرجع والمادة ثم أرسل الكمية وبلد التسليم لطلب عرض سعر عبر واتساب.',
};

for (const [route, [title, h1, description]] of Object.entries(updates)) {
  Object.assign(seo[route], { title, h1, description });
}

// Keep editable page/frontmatter fallbacks and visible headings aligned with the runtime map.
const files = [...new Set(plan.pages.flatMap((p) => p.sourceFile.split(' + ')))];
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`Missing source: ${file}`);
  let source = fs.readFileSync(file, 'utf8');
  for (const [route, old] of Object.entries(before)) {
    const row = plan.pages.find((p) => p.route === route);
    if (!row.sourceFile.split(' + ').includes(file)) continue;
    for (const key of ['title', 'description', 'h1']) {
      if (old[key] !== seo[route][key]) source = source.replaceAll(old[key], seo[route][key]);
    }
    if (intros[route] && source.includes('<HeroText')) {
      const start = source.indexOf('<HeroText');
      const tail = source.slice(start).replace(/subtitle="[^"]*"/, `subtitle="${intros[route]}"`);
      source = source.slice(0, start) + tail;
    }
  }
  fs.writeFileSync(file, source);
}

// Product and blog frontmatter H1 text may differ from the old <title>.
for (const row of plan.pages) {
  const current = seo[row.route];
  const old = before[row.route];
  row.title = current.title;
  row.description = current.description;
  row.h1 = current.h1;
  row.ogTitle = row.twitterTitle = current.title;
  row.ogDescription = row.twitterDescription = current.description;
  row.titleCharacters = [...current.title].length;
  row.descriptionCharacters = [...current.description].length;
  if (row.route.startsWith('/vehicles/')) {
    row.focusKeyword = current.h1;
    row.supportingKeywords = row.route.endsWith('bmw')
      ? ['قطع كربون بي إم دبليو', 'BMW M3 G80 M4 G82', 'كتالوج BMW كربون']
      : row.route.endsWith('porsche')
        ? ['قطع كربون بورش', 'كاربون فايبر بورشه', 'Porsche 911 992']
        : ['قطع كربون مرسيدس', 'كاربون فايبر Mercedes-AMG', 'G63 AMG GT C63'];
  } else if (updates[row.route]) row.focusKeyword = current.h1;
  row.notesCN = row.notesCN.replace(/1500\+/g, '公司历史目录').replace(/1500/g, '公司历史目录');
  row.auditResultCN = updates[row.route]
    ? '已优化：标题/H1与真实产品范围和买家任务对齐；描述交代内容及采购下一步。'
    : '复核保留：现有标题/H1、正文和用户任务匹配，无需为改动而改动。';
  row.metadataChanged = ['title', 'description', 'h1'].some((key) => old[key] !== current[key]);
}
plan.plannedAt = '2026-10-31';
plan.status = '全站逐页搜索意图复核并写入本地项目；待本次构建验证；尚未部署';
write('src/data/seo.json', seo);
write(planPath, plan);
fs.mkdirSync('reports/seo-intent-2026-10-31', { recursive: true });
write('reports/seo-intent-2026-10-31/before.json', before);
console.log(
  `Reviewed ${plan.pages.length}; updated ${plan.pages.filter((p) => p.metadataChanged).length} metadata records.`
);
