import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'الرئيسية',
      href: getPermalink('/'),
    },
    {
      text: 'المنتجات',
      href: getPermalink('/products'),
    },
    {
      text: 'المركبات',
      links: [
        { text: 'BMW', href: getPermalink('/vehicles/bmw') },
        { text: 'Mercedes-AMG', href: getPermalink('/vehicles/mercedes-amg') },
        { text: 'Porsche', href: getPermalink('/vehicles/porsche') },
        { text: 'الكتالوجات', href: getPermalink('/catalogs') },
      ],
    },
    {
      text: 'الخدمات',
      links: [
        { text: 'OEM & ODM', href: getPermalink('/grow/oem-odm') },
        { text: 'البيع بالجملة', href: getPermalink('/grow/wholesale') },
        { text: 'الدروبشيبينغ', href: getPermalink('/grow/dropshipping') },
        { text: 'شركاء القنوات', href: getPermalink('/grow/channel-partners') },
      ],
    },
    {
      text: 'مشاريع العملاء',
      href: getPermalink('/cases'),
    },
    {
      text: 'من نحن',
      href: getPermalink('/about'),
    },
    {
      text: 'اتصل بنا',
      href: getPermalink('/contact'),
    },
  ],
  actions: [
    {
      text: 'واتساب',
      href: 'https://wa.me/8613427690360?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%86%D8%A7%20%D9%85%D9%87%D8%AA%D9%85%20%D8%A8%D9%82%D8%B7%D8%B9%20%D8%A3%D9%84%D9%8A%D8%A7%D9%81%20%D8%A7%D9%84%D9%83%D8%B1%D8%A8%D9%88%D9%86%20%D9%85%D9%86%20CCF%20%D9%88%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AD%D8%B5%D9%88%D9%84%20%D8%B9%D9%84%D9%89%20%D8%B9%D8%B1%D8%B6%20%D8%B3%D8%B9%D8%B1.',
      target: '_blank',
      icon: 'tabler:brand-whatsapp',
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'المنتجات',
      links: [
        { text: 'جميع المنتجات', href: getPermalink('/products') },
        { text: 'القطع حسب المركبة', href: getPermalink('/vehicles') },
        { text: 'عرض الكتالوجات', href: getPermalink('/catalogs') },
        { text: 'المدونة', href: getBlogPermalink() },
      ],
    },
    {
      title: 'الخدمات',
      links: [
        { text: 'OEM & ODM', href: getPermalink('/grow/oem-odm') },
        { text: 'البيع بالجملة', href: getPermalink('/grow/wholesale') },
        { text: 'الدروبشيبينغ', href: getPermalink('/grow/dropshipping') },
        { text: 'شركاء القنوات', href: getPermalink('/grow/channel-partners') },
      ],
    },
    {
      title: 'الشركة',
      links: [
        { text: 'من نحن', href: getPermalink('/about') },
        { text: 'مشاريع العملاء', href: getPermalink('/cases') },
        { text: 'الأسئلة الشائعة', href: getPermalink('/faqs') },
        { text: 'اتصل بنا', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'تواصل معنا',
      links: [
        {
          text: 'واتساب: +86 134 2769 0360',
          href: 'https://wa.me/8613427690360?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%86%D8%A7%20%D9%85%D9%87%D8%AA%D9%85%20%D8%A8%D9%82%D8%B7%D8%B9%20%D8%A3%D9%84%D9%8A%D8%A7%D9%81%20%D8%A7%D9%84%D9%83%D8%B1%D8%A8%D9%88%D9%86%20%D9%85%D9%86%20CCF%20%D9%88%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AD%D8%B5%D9%88%D9%84%20%D8%B9%D9%84%D9%89%20%D8%B9%D8%B1%D8%B6%20%D8%B3%D8%B9%D8%B1.',
        },
        { text: 'info@ccfrp.com', href: 'mailto:info@ccfrp.com' },
        { text: 'قوانغتشو، قوانغدونغ، الصين', href: 'https://ccfrp.com' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'مصادر المحتوى والتصحيحات', href: getPermalink('/editorial-policy') },
    { text: 'الشروط والأحكام', href: getPermalink('/terms') },
    { text: 'سياسة الخصوصية', href: getPermalink('/privacy') },
    { text: 'سياسة الإرجاع والاسترداد', href: getPermalink('/return-refund-policy') },
  ],
  socialLinks: [
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/company/ccfrp' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://facebook.com/ccfrpcom' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/ccfcarbon/' },
    { ariaLabel: 'YouTube', icon: 'tabler:brand-youtube', href: 'https://www.youtube.com/@ccfrp2006' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    amxnx.vip و ccfrp.com موقعان تابعان لأعمال CCF في الصين. · © 2026 Guangzhou Chui Chui Feng Automotive Products Co., Ltd. · CHUICHUIFENG — مصنع قطع غيار السيارات من ألياف الكربون الجاف · قوانغتشو، قوانغدونغ، الصين
  `,
};
