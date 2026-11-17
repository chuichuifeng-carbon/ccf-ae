import type { ProductDetail } from './all-products-types';

/** Confirmed editorial correction for the CSL lamp record, applied after catalog imports. */
export function correctCslTailLights(product: ProductDetail): ProductDetail {
  if (product.slug !== 'bmw-g22-g82-csl-style-tail-lights') return product;
  const model = 'BMW 4 Series G22 / M4 G82';
  const fitment =
    'مرجع الاختيار G22 / G82 حسب اسم مجلد المنتج. أرسل سنة الصنع وصور المصباح الأصلي والموصل لتأكيد النسخة قبل الطلب.';
  const material = 'مجموعة إضاءة خلفية؛ تُؤكَّد مواد العدسة والهيكل ومواصفات التوصيل في عرض السعر.';
  return {
    ...product,
    reviewedAt: '2026-11-17',
    title: 'مصابيح خلفية بتصميم CSL لسيارات BMW G22 / G82',
    description:
      'مصابيح خلفية بتصميم CSL لمناقشة توريد ورش التعديل والموزعين. مرجع الاختيار BMW G22 / G82؛ أرسل صور المصباح الأصلي والموصل وسنة الصنع لتأكيد النسخة ومحتويات الطقم.',
    seoTitle: 'مصابيح خلفية CSL لسيارات BMW G22 / G82 بالجملة | CCF',
    seoDescription:
      'مصابيح خلفية بتصميم CSL لمرجع BMW G22 / G82. أرسل سنة الصنع وصور المصباح والموصل والكمية لتأكيد النسخة ومحتويات الطقم وطلب سعر التوريد.',
    model,
    chassisCodes: ['G22', 'G82'],
    material,
    materialEn: '',
    manufacturing: 'تُؤكَّد مواصفات مجموعة الإضاءة وتجميعها للمرجع المطلوب.',
    highlights: [
      'تصميم خلفي مستوحى من CSL',
      'تأكيد نسخة المصباح والموصل قبل الطلب',
      'توريد للموزعين وورش التعديل',
      'راجع الوحدات والملحقات المشمولة في الطقم',
    ],
    keywords: [
      'مصابيح خلفية BMW G22',
      'مصابيح CSL BMW G82',
      'CSL style tail lights BMW G22 G82',
      'مصابيح سيارات بالجملة',
    ],
    checks: [
      fitment,
      'أكّد عدد الوحدات في الطقم والجانب المطلوب والملحقات المشمولة.',
      material,
      'اطلب تأكيد متطلبات التوصيل والترميز أو المحولات قبل التركيب.',
    ],
    specs: [
      ['نوع القطعة', 'مصابيح خلفية'],
      ['مرجع المركبة', model],
      ['التصميم', 'CSL'],
      ['المادة', material],
      ['محتويات التوريد', 'تُحدّد في عرض السعر'],
    ],
    specs16: {
      ...product.specs16!,
      productType: 'Tail Lights — مصابيح خلفية',
      fitment,
      material,
      weave: 'لا ينطبق على مجموعة الإضاءة.',
      finish: 'يُؤكَّد لون العدسة ومظهر الإضاءة للنسخة المطلوبة.',
      process: 'تُؤكَّد مواصفات مجموعة الإضاءة والموصلات للمرجع المطلوب.',
      installation: 'أكّد الموصلات وأي محولات أو ترميز مطلوب بصور المصباح الأصلي قبل الطلب.',
      customization: 'ناقش الشعار والتغليف المخصص ومواصفات الطلب مع المبيعات.',
    },
    faq: [
      { q: 'كيف أتأكد من مطابقة المصابيح لسيارتي؟', a: fitment },
      {
        q: 'ما مواصفات المصابيح ومحتويات الطقم؟',
        a: material + ' اطلب بيان عدد الوحدات والملحقات المشمولة ومتطلبات التوصيل.',
      },
      ...(product.faq ?? []).filter(
        (item) => !/المطابقة|مطابقة|المادة|ما مواصفات المصابيح ومحتويات الطقم/.test(item.q)
      ),
    ],
    intentSegments: ['مصابيح خلفية CSL', model, 'توريد إضاءة سيارات بالجملة'],
  };
}
