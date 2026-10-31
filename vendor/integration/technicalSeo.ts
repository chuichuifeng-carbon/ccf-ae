import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { AstroIntegration } from 'astro';
import pageSeo from '../../src/data/seo.json';

/** Optimize public image references after static HTML generation, including raw <img> elements.
 * Original files/links remain intact for inspecting product and documentary evidence.
 * Only derived assets are written to the output directory, with content-addressed names.
 */
export default function technicalSeo(): AstroIntegration {
  let origin: string;
  return {
    name: 'ccf-technical-seo',
    hooks: {
      'astro:config:done': ({ config }) => {
        origin = String(config.site).replace(/\/$/, '');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await fs.readdir(root, { recursive: true })).filter(
          (file) => file.endsWith('.html') && !file.startsWith('decapcms')
        );
        const pages = await Promise.all(
          files.map(async (file) => ({ file, html: await fs.readFile(path.join(root, file), 'utf8') }))
        );
        const sources = [
          ...new Set(
            pages.flatMap(({ html }) =>
              [...html.matchAll(/<img\b[^>]*\bsrc="(\/images\/[^"?#]+\.(?:webp|png|jpe?g))"[^>]*>/gi)].map((m) => m[1])
            )
          ),
        ];
        const assets = new Map<string, { width: number; height: number; srcset: string }>();
        await fs.mkdir(path.join(root, '_astro'), { recursive: true });
        // Limit processing concurrency to avoid excessive memory use on CI.
        const queue = [...sources];
        await Promise.all(
          Array.from({ length: 4 }, async () => {
            let src: string | undefined;
            while ((src = queue.shift())) {
              const absolute = path.resolve(root, `.${src}`);
              if (!absolute.startsWith(path.resolve(root, 'images') + path.sep))
                throw new Error(`Invalid image path: ${src}`);
              const buffer = await fs.readFile(absolute);
              const info = await sharp(buffer).metadata();
              if (!info.width || !info.height || (info.pages && info.pages > 1)) continue;
              const widths = [320, 640, 960, 1280, 1600].filter((w) => w < info.width);
              const hash = createHash('sha256').update(buffer).update('webp-q80-v1').digest('hex').slice(0, 16);
              const stem = path.basename(src, path.extname(src));
              const variants: string[] = [];
              for (const width of widths) {
                const name = `${stem}.${hash}-${width}w.webp`;
                await sharp(buffer)
                  .resize({ width, withoutEnlargement: true })
                  .webp({ quality: 80 })
                  .toFile(path.join(root, '_astro', name));
                variants.push(`/_astro/${name} ${width}w`);
              }
              variants.push(`${src} ${info.width}w`);
              assets.set(src, { width: info.width, height: info.height, srcset: variants.join(', ') });
            }
          })
        );
        const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
        const imageEntries: string[] = [];
        let occurrences = 0;
        for (const page of pages) {
          const pageImages = new Set<string>();
          const html = page.html.replace(/<img\b[^>]*>/gi, (tag) => {
            const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
            const asset = src ? assets.get(src) : undefined;
            if (!src || !asset) return tag;
            pageImages.add(src);
            occurrences++;
            const set = (name: string, value: string) => {
              const pattern = new RegExp(`\\s${name}="[^"]*"`, 'i');
              tag = pattern.test(tag)
                ? tag.replace(pattern, ` ${name}="${value}"`)
                : tag.replace(/\s*\/?>(?=$)/, ` ${name}="${value}">`);
            };
            set('width', String(asset.width));
            set('height', String(asset.height));
            set('decoding', 'async');
            if (!/\bloading="/.test(tag)) set('loading', /fetchpriority="high"/.test(tag) ? 'eager' : 'lazy');
            if (asset.width > 320) {
              set('srcset', asset.srcset);
              // Preserve author-provided slot sizes; use a safe full-viewport fallback otherwise.
              if (!/\bsizes="/.test(tag)) set('sizes', '(max-width: 767px) 100vw, (max-width: 1279px) 75vw, 960px');
            }
            return tag;
          });
          await fs.writeFile(path.join(root, page.file), html);
          const route =
            page.file === 'index.html' ? '/' : '/' + page.file.replaceAll('\\', '/').replace(/\/index\.html$/, '');
          const record = (pageSeo as Record<string, { sitemap: boolean }>)[route];
          if (record?.sitemap && pageImages.size) {
            imageEntries.push(
              `<url><loc>${xml(origin + route)}</loc>${[...pageImages].map((src) => `<image:image><image:loc>${xml(origin + src)}</image:loc></image:image>`).join('')}</url>`
            );
          }
        }
        await fs.writeFile(
          path.join(root, 'sitemap-images.xml'),
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${imageEntries.join('')}</urlset>`
        );
        const indexPath = path.join(root, 'sitemap-index.xml');
        const sitemapIndex = await fs.readFile(indexPath, 'utf8');
        await fs.writeFile(
          indexPath,
          sitemapIndex.replace(
            '</sitemapindex>',
            `<sitemap><loc>${origin}/sitemap-images.xml</loc></sitemap></sitemapindex>`
          )
        );
        logger.info(
          `Responsive images: ${assets.size} originals, ${occurrences} image placements; image sitemap: ${imageEntries.length} pages.`
        );
      },
    },
  };
}
