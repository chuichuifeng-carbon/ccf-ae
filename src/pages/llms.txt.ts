import type { APIRoute } from 'astro';
import { getCanonical } from '~/utils/permalinks';
import guide from '~/data/site-guide.md?raw';
import catalogs from '~/data/b2b/catalogs.json';
import { productCategories } from '~/data/b2b/product-content';
import { allProducts } from '~/data/b2b/all-products';

export const GET: APIRoute = () => {
  const categories = Object.entries(productCategories).map(
    ([slug, name]) =>
      `- [${name}](${getCanonical('/products/' + slug)}) — ${allProducts.filter((product) => product.categorySlug === slug).length} карточек товаров`
  );
  const documents = catalogs.map(
    ({ brand, entries }) =>
      `- [${brand.toUpperCase()}](${getCanonical('/catalogs#catalogs-' + brand)}) — ${entries.length} записей PDF-каталогов`
  );
  return new Response(
    [
      guide.trim().replace(/https:\/\/amxnx\.vip[^\s)]+/g, (url) => String(getCanonical(url))),
      '## Категории товаров',
      categories.join('\n'),
      '## Каталоги по моделям',
      documents.join('\n'),
    ].join('\n\n') + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
