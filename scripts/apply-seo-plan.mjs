import fs from 'node:fs';
import sharp from 'sharp';

const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
const records = {};
for (const row of plan.pages) {
  const image = new URL(row.ogImage).pathname;
  const dimensions = await sharp(`public${image}`).metadata();
  records[row.route] = {
    title: row.title,
    description: row.description,
    h1: row.h1,
    canonicalPath: row.canonical === null ? null : row.route,
    index: row.robots.startsWith('index,'),
    sitemap: row.sitemap,
    ogType: row.ogType,
    image,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
  if (row.sourceFile.endsWith('.astro') && !row.sourceFile.includes('[')) {
    if (!fs.existsSync(row.sourceFile)) row.sourceFile = `src/pages${row.route}/index.astro`;
    let content = fs.readFileSync(row.sourceFile, 'utf8');
    content = content.replace(/const metadata = \{[\s\S]*?\n\};/, (block) =>
      block
        .replace(/title:\s*'[^']*'/, () => `title: '${row.title}'`)
        .replace(/description:\s*'[^']*'/, () => `description: '${row.description}'`)
    );
    content = content.replace(/(<HeroText\b[\s\S]*?\btitle=)"[^"]*"/, (_, start) => `${start}"${row.h1}"`);
    if (row.route === '/')
      content = content.replace(
        /(<Fragment slot="title">)[\s\S]*?(<\/Fragment>)/,
        `$1\n      <span class="text-white font-extrabold">${row.h1}</span>\n    $2`
      );
    fs.writeFileSync(row.sourceFile, content);
  }
  if (row.sourceFile.endsWith('.md')) {
    let content = fs.readFileSync(row.sourceFile, 'utf8');
    content = content
      .replace(/^title: '[^']*'/m, () => `title: '${row.h1}'`)
      .replace(/^description: '[^']*'/m, () => `description: '${row.description}'`)
      .replace(/^excerpt: '[^']*'/m, () => `excerpt: '${row.description}'`)
      .replace(/^ {2}description: '[^']*'/m, () => `  description: '${row.description}'`);
    fs.writeFileSync(row.sourceFile, content);
  }
}
fs.writeFileSync('src/data/seo.json', JSON.stringify(records, null, 2) + '\n');

// Product headings and listing cards share the same real product identity.
let featured = fs.readFileSync('src/data/b2b/featured.ts', 'utf8');
for (const row of plan.pages.filter((page) => page.route.startsWith('/products/bmw-'))) {
  const slug = row.route.split('/').pop();
  const start = featured.indexOf(`slug: '${slug}'`);
  if (start < 0) throw new Error(`Product not found: ${slug}`);
  const end = featured.indexOf('\n  },', start);
  const block = featured.slice(start, end);
  const updated = block
    .replace(/title:\s*'[^']*'/, () => `title: '${row.h1}'`)
    .replace(/description:\s*'[^']*'/, () => `description: '${row.description}'`);
  featured = featured.slice(0, start) + updated + featured.slice(end);
}
fs.writeFileSync('src/data/b2b/featured.ts', featured);
fs.writeFileSync('reports/seo-metadata-plan/metadata-plan.json', JSON.stringify(plan, null, 2) + '\n');
console.log(`Applied ${Object.keys(records).length} page metadata records and matching static/product headings.`);
