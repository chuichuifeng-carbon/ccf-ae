import type { APIRoute } from 'astro';
import { SITE } from 'astrowind:config';
import guide from '~/data/site-guide.md?raw';
import catalogs from '~/data/b2b/catalogs.json';
import { productCategories } from '~/data/b2b/product-content';
import { allProducts } from '~/data/b2b/all-products';

export const GET: APIRoute = () => {
  const categories = Object.entries(productCategories).map(
    ([slug, name]) =>
      `- [${name}](${SITE.site}/products/${slug}) — ${allProducts.filter((product) => product.categorySlug === slug).length} product records`
  );
  const documents = catalogs.map(
    ({ brand, entries }) =>
      `- [${brand.toUpperCase()}](${SITE.site}/catalogs#catalogs-${brand}) — ${entries.length} PDF catalog entries`
  );
  return new Response(
    [guide.trim(), '## Product categories', categories.join('\n'), '## Model catalogs', documents.join('\n')].join(
      '\n\n'
    ) + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
