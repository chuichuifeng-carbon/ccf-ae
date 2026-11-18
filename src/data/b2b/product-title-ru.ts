/** Translate functional modifiers while keeping style names and version numbers distinct. */
export function readableProductTitleRu(value: string): string {
  const terms: Record<string, string> = {
    'Without ACC': 'без ACC',
    'With ACC': 'с ACC',
    'Without Mesh': 'без сетки',
    'With Mesh': 'с сеткой',
    'Replacement Caps': 'сменные корпуса',
    '3-Piece': '3 части',
    '2-Piece': '2 части',
    '1-Piece': '1 часть',
    'Front Lip with Bumper Spats': 'комплект с угловыми накладками бампера',
    'Front Canards': 'передние канарды',
    'Rear Spoiler': 'задний спойлер',
    'Rear Diffuser': 'задний диффузор',
    'Upper Rear Wing': 'верхнее антикрыло',
    'Oil Cooler Protection': 'защита масляного радиатора',
    'Mesh Debris': 'защитная сетка',
    'Oil Pan': 'поддон',
    'Aluminum Underbody': 'защита днища Aluminum',
    Undertray: 'защита днища',
    'Trunk Lid': 'крышка багажника',
    'Trunk Style': 'вариант',
    Version: 'версия',
    Style: '',
  };
  let title = value.replace(' — Настоящий сухой карбон', '');
  for (const [from, to] of Object.entries(terms)) title = title.replaceAll(from, to);
  return title
    .replace(/\s+/g, ' ')
    .replace(/\s+([,·])/g, '$1')
    .trim();
}

/** Only the protective parts identified in the buyer audit are changed here. */
export const protectivePartSlugs = new Set([
  'bmw-g87-vk-style-oil-cooler-protection-plate',
  'bmw-f90-m5-engine-undertray',
  'bmw-f97-f98-engine-undertray',
  'bmw-g30-engine-undertray',
  'bmw-g80-g82-g87-mesh-debris-guard',
  'bmw-f80-f82-m3-m4-oil-pan-guard',
  'bmw-f87-m2-competition-oil-pan-guard',
  'bmw-f90-m5-oil-pan-guard',
  'bmw-f97-f98-x3m-x4m-oil-pan-guard',
  'bmw-universal-g-series-aluminum-underbody-guard',
]);
