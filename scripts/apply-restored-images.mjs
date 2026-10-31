import fs from 'node:fs';

function componentRange(source, name) {
  const start = source.indexOf(`<${name}`);
  if (start < 0) throw new Error(`Missing widget ${name}`);
  let braces = 0,
    quote = '';
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      continue;
    }
    if (['"', "'", '`'].includes(char)) quote = char;
    else if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '/' && source[i + 1] === '>' && braces === 0) return { start, end: i + 2 };
  }
  throw new Error(`Unclosed widget ${name}`);
}
const categories = {
  'front-lips-splitters': 'صور وتصاميم الشفاه الأمامية والسبليتر',
  'rear-diffusers': 'صور وتصاميم الناشرات الخلفية',
  'side-skirts': 'صور وتصاميم القطع الجانبية',
  'spoilers-wings': 'صور وتصاميم السبويلر والأجنحة',
  hoods: 'صور وتصاميم أغطية المحرك',
  'trunk-lids': 'صور وتصاميم أغطية صندوق الأمتعة',
  'grilles-air-intake': 'صور وتصاميم الشبكات وفتحات الهواء',
  'mirror-caps': 'صور وتصاميم أغطية المرايا',
};
for (const [category, title] of Object.entries(categories)) {
  const file = `src/pages/products/${category}.astro`;
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes('import ProductCollection ')) continue;
  const range = componentRange(source, 'Bento');
  source =
    source.slice(0, range.start) +
    `<ProductCollection category="${category}" title="${title}" />` +
    source.slice(range.end);
  source = source.replace(
    "import Bento from '~/components/widgets/Bento.astro';",
    "import ProductCollection from '~/components/widgets/ProductCollection.astro';"
  );
  if (category === 'grilles-air-intake')
    source = source.replace(
      '</PageLayout>',
      '<ProductCollection category="exterior-trim" title="صور الزخارف الخارجية وقطع زوايا الهيكل" />\n</PageLayout>'
    );
  fs.writeFileSync(file, source);
}
for (const route of ['grow/index', 'grow/wholesale', 'grow/oem-odm', 'grow/dropshipping', 'grow/channel-partners']) {
  const file = `src/pages/${route}.astro`;
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes('import SourceGallery ')) continue;
  source = source
    .replace('---\n', "---\nimport SourceGallery from '~/components/widgets/SourceGallery.astro';\n")
    .replace('---\r\n', "---\r\nimport SourceGallery from '~/components/widgets/SourceGallery.astro';\r\n");
  const range = componentRange(source, 'HeroText');
  source = source.slice(0, range.end) + '\n\n  <SourceGallery />' + source.slice(range.end);
  fs.writeFileSync(file, source);
}
let home = fs.readFileSync('src/pages/index.astro', 'utf8');
if (!home.includes('import SourceGallery ')) {
  home = home.replace(
    "import PageLayout from '~/layouts/PageLayout.astro';",
    "import PageLayout from '~/layouts/PageLayout.astro';\nimport SourceGallery from '~/components/widgets/SourceGallery.astro';"
  );
  const range = componentRange(home, 'Steps');
  home = home.slice(0, range.end) + '\n\n  <SourceGallery />' + home.slice(range.end);
  fs.writeFileSync('src/pages/index.astro', home);
}
const file = 'src/pages/products/[slug].astro';
let source = fs.readFileSync(file, 'utf8');
if (!source.includes('import SourceGallery ')) {
  source = source.replace(
    "import PageLayout from '~/layouts/PageLayout.astro';",
    "import PageLayout from '~/layouts/PageLayout.astro';\nimport SourceGallery from '~/components/widgets/SourceGallery.astro';"
  );
  source = source.replace('</section>', '</section>\n  <SourceGallery productSlug={product.slug} />');
  fs.writeFileSync(file, source);
}
console.log('Restored full product collections and contextual image galleries.');
