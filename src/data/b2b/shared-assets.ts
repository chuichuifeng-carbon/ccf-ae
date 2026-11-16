// Shared B2B assets used by every product page (packaging + custom logo).

export interface SharedAsset {
  url: string;
  width: number;
  height: number;
  name: string;
  captionAr: string;
}

export const packagingGallery: SharedAsset[] = [
  {
    url: '/images/shared/packaging/ccf-carbon-fiber-panels-pallet-packing-03.webp',
    width: 1200,
    height: 1600,
    name: 'ccf-carbon-fiber-panels-pallet-packing-03.webp',
    captionAr: 'ترتيب الألواح على منصة نقالة',
  },
  {
    url: '/images/shared/packaging/ccf-carbon-part-air-column-bag-carton-02.webp',
    width: 810,
    height: 1080,
    name: 'ccf-carbon-part-air-column-bag-carton-02.webp',
    captionAr: 'كيس هوائي وتثبيت داخل الكرتون',
  },
  {
    url: '/images/shared/packaging/ccf-carbon-parts-packaging-overview-01.webp',
    width: 1200,
    height: 899,
    name: 'ccf-carbon-parts-packaging-overview-01.webp',
    captionAr: 'نظرة عامة على تغليف قطع الكربون',
  },
  {
    url: '/images/shared/packaging/ccf-carton-packaging-showroom-05.webp',
    width: 1200,
    height: 1600,
    name: 'ccf-carton-packaging-showroom-05.webp',
    captionAr: 'كرتون تصدير جاهز للشحن',
  },
  {
    url: '/images/shared/packaging/ccf-export-cartons-fragile-corner-protection-04.webp',
    width: 1200,
    height: 900,
    name: 'ccf-export-cartons-fragile-corner-protection-04.webp',
    captionAr: 'زوايا حماية للكراتين القابلة للكسر',
  },
  {
    url: '/images/shared/packaging/ccf-plywood-export-crate-packing-06.webp',
    width: 1200,
    height: 900,
    name: 'ccf-plywood-export-crate-packing-06.webp',
    captionAr: 'صندوق خشبي للشحن البحري',
  },
];

export const customizationGallery: SharedAsset[] = [
  {
    url: '/images/shared/customization/ccf-custom-logo-badge-on-carbon-fiber-02.webp',
    width: 1200,
    height: 900,
    name: 'ccf-custom-logo-badge-on-carbon-fiber-02.webp',
    captionAr: 'شارة شعار مخصصة مثبتة على قطعة الكربون',
  },
  {
    url: '/images/shared/customization/ccf-custom-logo-color-options-carbon-01.webp',
    width: 1200,
    height: 900,
    name: 'ccf-custom-logo-color-options-carbon-01.webp',
    captionAr: 'نماذج الشعار والألوان على قطع الكربون',
  },
  {
    url: '/images/shared/customization/ccf-custom-logo-dust-bag-diffuser-03.webp',
    width: 1077,
    height: 569,
    name: 'ccf-custom-logo-dust-bag-diffuser-03.webp',
    captionAr: 'شعار مخصص مطبوع على كيس الغبار والتغليف',
  },
  {
    url: '/images/shared/customization/ccf-custom-open-label-sticker-04.webp',
    width: 1200,
    height: 900,
    name: 'ccf-custom-open-label-sticker-04.webp',
    captionAr: 'ملصق شعار مخصص على التغليف',
  },
  {
    url: '/images/shared/customization/ccf-export-cartons-fragile-corner-protection-05.webp',
    width: 1200,
    height: 900,
    name: 'ccf-export-cartons-fragile-corner-protection-05.webp',
    captionAr: 'كرتون تصدير بعلامة تجارية خاصة',
  },
];
