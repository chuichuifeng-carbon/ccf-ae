import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import pageSeo from '../../src/data/seo.json';
import legacyRedirects from '../../src/data/legacy-redirects.json';

/** Static hosting rules and public contact links, applied after HTML compression. */
export default function productionHosting(): AstroIntegration {
  let origin: string;
  const canonicalHref = (href: string) => {
    const url = new URL(href, origin);
    if (url.origin !== origin) return href;
    const route = url.pathname.replace(/\/+$/, '') || '/';
    if (!Object.hasOwn(pageSeo, route) || /\.[a-z0-9]+$/i.test(route)) return href;
    url.pathname = route === '/' ? '/' : route + '/';
    return href.startsWith('/') ? url.pathname + url.search + url.hash : url.href;
  };
  return {
    name: 'ccf-production-hosting',
    hooks: {
      'astro:config:done': ({ config }) => {
        origin = String(config.site).replace(/\/$/, '');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const rules = [
          '# Generated from the same page records as canonical metadata.',
          '# Do not redirect unknown URLs: preserve real 404 responses.',
          '/index.html / 301',
        ];
        for (const route of Object.keys(pageSeo).sort()) {
          if (route === '/' || /\.[a-z0-9]+$/i.test(route)) continue;
          // Pages normalizes folder/index.html assets from /route to /route/.
          // Reversing that implicit redirect here creates an infinite 308 <-> 301 loop.
          // Leave slash handling to the active host (Pages or Workers html_handling).
          rules.push(`${route}/index.html ${route}/ 301`, `${route}.html ${route}/ 301`);
        }
        // Retired product URLs (old `-carbon-fiber-` slug convention) permanently point at their successor.
        for (const [from, to] of Object.entries(legacyRedirects)) {
          if (from === to) continue;
          rules.push(`${from} ${canonicalHref(to)} 301`, `${from}/ ${canonicalHref(to)} 301`);
        }
        // These rules become reachable only after www is bound to this deployment with DNS/TLS.
        rules.push(
          'https://www.amxnx.vip/* https://amxnx.vip/:splat 301',
          'http://www.amxnx.vip/* https://amxnx.vip/:splat 301'
        );
        await fs.writeFile(path.join(root, '_redirects'), rules.join('\n') + '\n');
        const files = (await fs.readdir(root, { recursive: true })).filter((file) => file.endsWith('.html'));
        let links = 0;
        for (const file of files) {
          const target = path.join(root, file);
          const original = await fs.readFile(target, 'utf8');
          const html = original
            .replace(/\bhref="([^"]+)"/g, (tag, href) =>
              href.startsWith('/') || href.startsWith(origin) ? 'href="' + canonicalHref(href) + '"' : tag
            )
            .replace(
              /(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,
              (_, open, json, close) =>
                open +
                JSON.stringify(JSON.parse(json), (_key, value) =>
                  typeof value === 'string' && value.startsWith(origin) ? canonicalHref(value) : value
                ) +
                close
            );
          // CCF deliberately publishes its business email. Keep mailto links usable without
          // Cloudflare's decoder, including after Astro ClientRouter page swaps and without JS.
          const updated = html.replace(/<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
            links++;
            return `<!--email_off-->${anchor}<!--/email_off-->`;
          });
          if (updated !== original) await fs.writeFile(target, updated);
        }
        logger.info(`Hosting rules generated; ${links} mailto links protected from email obfuscation.`);
      },
    },
  };
}
