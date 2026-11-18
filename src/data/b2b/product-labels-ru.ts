import type { ProductDetail } from './all-products-types';

export const categoryNamesRu: Record<string, string> = {
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
};

const partNames: Record<string, string> = {
  'Front Lip Splitter': 'Передний сплиттер',
  'Bumper Corner Trims': 'Угловые накладки бампера',
  'Front Canards': 'Передние канарды',
  'Front Grille': 'Передняя решётка',
  'Side Skirts': 'Боковые пороги',
  'Fender Vents': 'Воздуховоды крыльев',
  'Front Bumper Air Vents': 'Воздуховоды переднего бампера',
  'Air Vent Trim': 'Накладки воздуховодов',
  Hood: 'Капот',
  'Rear Spoiler': 'Задний спойлер',
  'Rear Diffuser': 'Задний диффузор',
  'Rear Bumper Extensions': 'Накладки заднего бампера',
  'Front Bumper': 'Передний бампер',
  'Rear Bumper': 'Задний бампер',
  'Trunk Lid': 'Крышка багажника',
  'Mirror Covers': 'Накладки зеркал',
  'Antenna Cover': 'Накладка антенны',
  'Interior Trim Set': 'Комплект отделки салона',
  'Air Intake Kit': 'Комплект воздухозаборников',
  'Seat Back Covers': 'Накладки спинок сидений',
  Doors: 'Двери',
  'Full Body Kit': 'Комплект обвеса',
  'Battery Cover': 'Крышка аккумулятора',
  'Engine Bay Cover': 'Накладка моторного отсека',
  'Radiator Cover': 'Накладка радиатора',
  'Front Fenders': 'Передние крылья',
  'Wheel Arch Trims': 'Накладки колёсных арок',
  'Oil Cooler Protection Plate': 'Защита масляного радиатора',
  'Underbody Guard': 'Защита днища',
  'Fog Light Trims': 'Накладки противотуманных фар',
  'Rear Lip': 'Задняя накладка бампера',
  'Front Bumper & Fenders': 'Передний бампер и крылья',
  'Roof Spoiler': 'Спойлер крыши',
  'Tail Lights': 'Задние фонари',
  'DRL Lights': 'Дневные ходовые огни',
  'Mesh Debris Guard': 'Защитная сетка',
  'Strut Brace': 'Распорка стоек',
  'Fuel Cap Cover': 'Накладка лючка бензобака',
  'License Plate Frame': 'Рамка номерного знака',
  'Oil Pan Guard': 'Защита поддона',
};

/** Card labels use source part types and folder style identifiers, without adding fitment/material claims. */
export function productCardTitleRu(product: ProductDetail): string {
  if (!/[\u0600-\u06ff]/.test(product.title)) return product.title;
  let label = product.productDirName.replaceAll('-', ' ');
  // Source folders preserve kit size, installation variant and proprietary style names.
  // Material is displayed on the detail page, not inferred from a folder label.
  label = label.replace(/\b(?:Dry Carbon Fiber|Carbon Fiber|Dry Carbon)\b/gi, '');
  const labels: Record<string, string> = {
    ...partNames,
    'Front Lip': 'Передний сплиттер',
    'Bumper Spats': 'Угловые накладки бампера',
    'Daytime Running Lights': 'Дневные ходовые огни',
    'Tail Lights': 'Задние фонари',
    'Mirror Caps': 'Накладки зеркал',
    'Kidney Grille': 'Решётка радиатора',
    'Front Splitter': 'Передний сплиттер',
    'Side Skirt': 'Боковой порог',
    Carbon: 'Карбон',
    Fiber: 'волокно',
    Cover: 'Накладка',
    Covers: 'Накладки',
    Style: 'стиль',
    Piece: 'часть',
    With: 'с',
    For: 'для',
    Kit: 'комплект',
    Set: 'комплект',
    Replacement: 'замена',
    Version: 'версия',
    Front: 'передний',
    Rear: 'задний',
    Upper: 'верхний',
    Lower: 'нижний',
    Gloss: 'глянец',
    Matte: 'матовый',
    Forged: 'Forged',
  };
  for (const [english, russian] of Object.entries(labels).sort((a, b) => b[0].length - a[0].length)) {
    label = label.replace(new RegExp('\\b' + english + '\\b', 'gi'), russian);
  }
  const type = partNames[product.partTypeEn || ''] || categoryNamesRu[product.categorySlug] || 'Деталь';
  label = label.replace(/\bBMW\b/g, '');
  for (const code of product.chassisCodes) label = label.replace(new RegExp('\\b' + code + '\\b', 'g'), '');
  label = label.replace(type, '').replace(/\s+/g, ' ').trim();
  label = label.replace('с Угловые накладки бампера комплект', 'комплект с угловыми накладками бампера');
  return `${type} — ${product.model}${label ? ` · ${label}` : ''}`;
}
