import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Главная',
      href: getPermalink('/'),
    },
    {
      text: 'Каталог',
      href: getPermalink('/products'),
      links: [
        { text: 'Сплиттеры и канарды', href: getPermalink('/products/front-lips-splitters') },
        { text: 'Диффузоры и накладки', href: getPermalink('/products/rear-diffusers') },
        { text: 'Спойлеры и антикрылья', href: getPermalink('/products/spoilers-wings') },
        { text: 'Боковые пороги', href: getPermalink('/products/side-skirts') },
        { text: 'Капоты', href: getPermalink('/products/hoods') },
        { text: 'Решётки и воздухозаборники', href: getPermalink('/products/grilles-air-intake') },
        { text: 'Все категории', href: getPermalink('/products') },
      ],
    },
    {
      text: 'По автомобилю',
      links: [
        { text: 'BMW', href: getPermalink('/vehicles/bmw') },
        { text: 'Mercedes-AMG', href: getPermalink('/vehicles/mercedes-amg') },
        { text: 'Porsche', href: getPermalink('/vehicles/porsche') },
        { text: 'PDF-каталоги', href: getPermalink('/catalogs') },
      ],
    },
    {
      text: 'Услуги',
      links: [
        { text: 'OEM & ODM', href: getPermalink('/grow/oem-odm') },
        { text: 'Оптовые поставки', href: getPermalink('/grow/wholesale') },
        { text: 'Калькулятор импорта', href: getPermalink('/import-cost-calculator') },
        { text: 'Дропшиппинг', href: getPermalink('/grow/dropshipping') },
        { text: 'Партнёрам', href: getPermalink('/grow/channel-partners') },
      ],
    },
    {
      text: 'Проекты клиентов',
      href: getPermalink('/cases'),
    },
    {
      text: 'О компании',
      href: getPermalink('/about'),
    },
    {
      text: 'Контакты',
      href: getPermalink('/contact'),
    },
  ],
  actions: [
    {
      text: 'WhatsApp',
      href: 'https://wa.me/8613427690360?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%98%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D1%8E%D1%82%20%D0%BE%D0%BF%D1%82%D0%BE%D0%B2%D1%8B%D0%B5%20%D0%BF%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B8%20%D0%B0%D0%B2%D1%82%D0%BE%D0%BA%D0%BE%D0%BC%D0%BF%D0%BE%D0%BD%D0%B5%D0%BD%D1%82%D0%BE%D0%B2%20CCF.%20%D0%9F%D1%80%D0%BE%D1%88%D1%83%20%D0%BF%D0%BE%D0%B4%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D0%B8%D1%82%D1%8C%20%D0%BF%D1%80%D0%B5%D0%B4%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5.',
      target: '_blank',
      icon: 'tabler:brand-whatsapp',
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Каталог',
      links: [
        { text: 'Все товары', href: getPermalink('/products') },
        { text: 'Сплиттеры и канарды', href: getPermalink('/products/front-lips-splitters') },
        { text: 'Диффузоры и накладки', href: getPermalink('/products/rear-diffusers') },
        { text: 'Спойлеры и антикрылья', href: getPermalink('/products/spoilers-wings') },
        { text: 'Боковые пороги', href: getPermalink('/products/side-skirts') },
        { text: 'Капоты', href: getPermalink('/products/hoods') },
        { text: 'Подбор по автомобилю', href: getPermalink('/vehicles') },
        { text: 'Скачать каталоги', href: getPermalink('/catalogs') },
        { text: 'Блог', href: getBlogPermalink() },
      ],
    },
    {
      title: 'Услуги',
      links: [
        { text: 'OEM & ODM', href: getPermalink('/grow/oem-odm') },
        { text: 'Оптовые поставки', href: getPermalink('/grow/wholesale') },
        { text: 'Калькулятор импорта', href: getPermalink('/import-cost-calculator') },
        { text: 'Дропшиппинг', href: getPermalink('/grow/dropshipping') },
        { text: 'Партнёрам', href: getPermalink('/grow/channel-partners') },
      ],
    },
    {
      title: 'Компания',
      links: [
        { text: 'О компании', href: getPermalink('/about') },
        { text: 'Проекты клиентов', href: getPermalink('/cases') },
        { text: 'Вопросы и ответы', href: getPermalink('/faqs') },
        { text: 'Контакты', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Связаться с нами',
      links: [
        {
          text: 'WhatsApp: +86 134 2769 0360',
          href: 'https://wa.me/8613427690360?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%98%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D1%8E%D1%82%20%D0%BE%D0%BF%D1%82%D0%BE%D0%B2%D1%8B%D0%B5%20%D0%BF%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B8%20%D0%B0%D0%B2%D1%82%D0%BE%D0%BA%D0%BE%D0%BC%D0%BF%D0%BE%D0%BD%D0%B5%D0%BD%D1%82%D0%BE%D0%B2%20CCF.%20%D0%9F%D1%80%D0%BE%D1%88%D1%83%20%D0%BF%D0%BE%D0%B4%D0%B3%D0%BE%D1%82%D0%BE%D0%B2%D0%B8%D1%82%D1%8C%20%D0%BF%D1%80%D0%B5%D0%B4%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5.',
        },
        { text: 'info@ccfrp.com', href: 'mailto:info@ccfrp.com' },
        { text: 'Гуанчжоу, Гуандун, Китай', href: 'https://ccfrp.com' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Источники и исправления', href: getPermalink('/editorial-policy') },
    { text: 'Условия сотрудничества', href: getPermalink('/terms') },
    { text: 'Конфиденциальность', href: getPermalink('/privacy') },
    { text: 'Возврат и возмещение', href: getPermalink('/return-refund-policy') },
  ],
  socialLinks: [
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/company/ccfrp' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://facebook.com/ccfrpcom' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/ccfcarbon/' },
    { ariaLabel: 'YouTube', icon: 'tabler:brand-youtube', href: 'https://www.youtube.com/@ccfrp2006' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    amxnx.vip и ccfrp.com — сайты CCF, Китай. · © 2026 Guangzhou Chui Chui Feng Automotive Products Co., Ltd. · CHUICHUIFENG — производство автомобильных деталей из сухого карбона · Гуанчжоу, Китай
  `,
};
