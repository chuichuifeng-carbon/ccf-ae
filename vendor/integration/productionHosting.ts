import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import pageSeo from '../../src/data/seo.json';

/** Static hosting rules and public contact links, applied after HTML compression. */
export default function productionHosting(): AstroIntegration {
  return {
    name: 'ccf-production-hosting',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const rules = [
          '# Generated from the same page records as canonical metadata.',
          '# Do not redirect unknown URLs: preserve real 404 responses.',
          '/index.html / 301',
        ];
        for (const route of Object.keys(pageSeo).sort()) {
          if (route === '/' || /\.[a-z0-9]+$/i.test(route)) continue;
          rules.push(`${route}/ ${route} 301`, `${route}/index.html ${route} 301`, `${route}.html ${route} 301`);
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
          const html = await fs.readFile(target, 'utf8');
          // CCF deliberately publishes its business email. Keep mailto links usable without
          // Cloudflare's decoder, including after Astro ClientRouter page swaps and without JS.
          const updated = html.replace(/<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
            links++;
            return `<!--email_off-->${anchor}<!--/email_off-->`;
          });
          if (updated !== html) await fs.writeFile(target, updated);
        }
        logger.info(`Hosting rules generated; ${links} mailto links protected from email obfuscation.`);
      },
    },
  };
}
