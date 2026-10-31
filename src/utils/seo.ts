import pages from '~/data/seo.json';
import { SITE } from 'astrowind:config';
import type { MetaData } from '~/types';

interface PageSeo {
  title: string;
  description: string;
  h1: string;
  canonicalPath: string | null;
  index: boolean;
  sitemap: boolean;
  ogType: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
}
const pageMap: Record<string, PageSeo> = pages;

export function normalizeSeoPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === '/404' ? '/404.html' : path;
}

export function getPageSeo(pathname: string) {
  return pageMap[normalizeSeoPath(pathname)];
}

/** One shared source for head metadata, visible page headings and sitemap decisions. */
export function withPageSeo(pathname: string, fallback: MetaData = {}): MetaData {
  const page = getPageSeo(pathname);
  if (!page) return fallback;
  const canonical = page.canonicalPath === null ? null : new URL(page.canonicalPath, SITE.site).toString();
  return {
    ...fallback,
    title: page.title,
    description: page.description,
    ignoreTitleTemplate: true,
    canonical,
    robots: { index: page.index, follow: true },
    openGraph: {
      ...fallback.openGraph,
      url: canonical || undefined,
      siteName: SITE.name,
      locale: 'ar_AR',
      type: page.ogType,
      images: [{ url: page.image, width: page.imageWidth, height: page.imageHeight }],
    },
    twitter: { ...fallback.twitter, cardType: 'summary_large_image' },
  };
}
