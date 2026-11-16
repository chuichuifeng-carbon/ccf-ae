/** Shared product types for the CCF catalogue (generated data in all-products.ts). */

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

export interface ProductImage {
  lg: ImageVariant;
  md: ImageVariant;
  sm: ImageVariant;
}

/** 16-field B2B specification block rendered on every product page. */
export interface ProductSpecs16 {
  productType: string;
  fitment: string;
  material: string;
  weave: string;
  finish: string;
  process: string;
  weight: string;
  thickness: string;
  installation: string;
  moq: string;
  sampleLeadTime: string;
  bulkLeadTime: string;
  customization: string;
  packaging: string;
  warranty: string;
  damage: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface ProductDetail {
  reviewedAt?: string;
  slug: string;
  productDirName: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  categorySlug: string;
  categoryAr: string;
  categoryArShort: string;
  partType: string;
  partTypeEn?: string;
  partTypeAr?: string;
  chassisCodes: string[];
  model: string;
  yearStart: number;
  yearEnd: number;
  material: string;
  /** Material as written in the sheet, for JSON-LD and English labels. */
  materialEn: string;
  /** Arabic selling points rendered next to the H1 (material, fitment, sheet selling points). */
  highlights: string[];
  manufacturing: string;
  images: ProductImage[];
  imageCount: number;
  featuredImage: string;
  featuredSm: string;
  checks: string[];
  specs: Array<[string, string]>;
  specs16?: ProductSpecs16;
  faq?: ProductFaq[];
  youtube?: string;
  intentSegments: string[];
}
