/**
 * 站点图片映射。
 *
 * 原先各页面直接拼接第三方 AI 图片 API 的 URL，该接口不稳定（经常返回
 * 占位图），导致页面大面积破图。这里改为把真实图片放在 `public/images/`
 * 并自托管，由本模块按提示词关键词把调用映射到最贴近的本地图片。
 *
 * `img()` 保持原有的 `(prompt, size?)` 签名，返回 public 目录路径，
 * 因此 `<Image src={img(...)} />` 与原生 `<img src={img(...)} />` 都可用。
 */

import artwork from '~/data/b2b/site-artwork.json';

const IMAGES = {
  hero: '/images/hero-supercar.webp',
  frontLip: artwork['carbon-fiber-front-lips-splitters.webp'],
  rearDiffuser: artwork['carbon-fiber-rear-diffusers.webp'],
  sideSkirts: artwork['carbon-fiber-side-skirts.webp'],
  spoilerWing: artwork['carbon-fiber-rear-spoilers-wings.webp'],
  hood: artwork['carbon-fiber-hoods.webp'],
  trunkLid: artwork['carbon-fiber-trunks.webp'],
  grille: artwork['carbon-fiber-grilles-air-intake-parts.webp'],
  mirrorCaps: artwork['carbon-fiber-mirror-caps.webp'],
  bmw: artwork.bmw,
  mercedes: artwork['mercedes-amg'],
  porsche: artwork.porsche,
  factory: '/images/verified/ccf-carbon-fiber-factory-qingyuan-guangdong.webp',
  workshop: '/images/verified/automotive-carbon-fiber-molding-process-1.webp',
  inspection: '/images/inspection.webp',
  meeting: '/images/verified/usa-customer-carbon-fiber-project-discussion.webp',
  warehouse: '/images/verified/usa-customer-visiting-carbon-fiber-parts-warehouse.webp',
  garage: '/images/brand-bmw.webp',
  helmet: '/images/helmet.webp',
  weave: '/images/carbon-weave-macro.webp',
} as const;

/**
 * 关键词 → 本地图片。顺序即优先级：先匹配的规则生效。
 * 场景与整车图排在部件图之前，避免被产品词抢走。
 */
const RULES: Array<[RegExp, keyof typeof IMAGES]> = [
  // 整车 / 场景
  [/matte black sports car/, 'hero'],
  [/custom supercar|bespoke|carbon fiber body kit|body panels/, 'garage'],
  [/helmet/, 'helmet'],
  [/factory building|factory exterior/, 'factory'],
  [/warehouse|packed|shipping box|shipment|container|fulfillment/, 'warehouse'],
  [/meeting|partner|visitor|showroom|discussing/, 'meeting'],
  [/inspecting|inspection|quality check/, 'inspection'],
  [/layup|laying carbon fiber|molding process|vacuum bagging|prototype and mold/, 'workshop'],

  // 首页车型卡片（按国别 + 颜色区分）
  [/yellow german sports car/, 'porsche'],
  [/white german sports coupe/, 'bmw'],
  [/silver german performance sedan/, 'mercedes'],

  // 部件
  [/hood/, 'hood'],
  [/trunk/, 'trunkLid'],
  [/diffuser/, 'rearDiffuser'],
  [/side skirt/, 'sideSkirts'],
  [/mirror cap/, 'mirrorCaps'],
  [/grille|grill/, 'grille'],
  [/spoiler|wing/, 'spoilerWing'],
  [/front lip|splitter/, 'frontLip'],

  // 品牌整车
  [/bmw/, 'bmw'],
  [/mercedes|amg/, 'mercedes'],
  [/porsche|911|cayman/, 'porsche'],
];

export const img = (prompt = '', _size?: string): string => {
  const text = prompt.toLowerCase();
  for (const [pattern, key] of RULES) {
    if (pattern.test(text)) return IMAGES[key];
  }
  return IMAGES.hero;
};
