import fs from 'node:fs';
import yaml from 'js-yaml';
import sharp from 'sharp';

const registry = JSON.parse(fs.readFileSync('reports/blog-p0-2026-10-31/topics.json', 'utf8'));
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync('reports/seo-metadata-plan/metadata-plan.json', 'utf8'));
for (const topic of registry.topics) {
  const source = fs.readFileSync(topic.file, 'utf8');
  const frontmatter = yaml.load(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]);
  const image = frontmatter.image;
  const dimensions = await sharp(`public${image}`).metadata();
  const metadata = frontmatter.metadata;
  seo[topic.route] = {
    title: metadata.title,
    description: metadata.description,
    h1: frontmatter.title,
    canonicalPath: topic.route,
    index: true,
    sitemap: true,
    ogType: 'article',
    image,
    imageWidth: dimensions.width,
    imageHeight: dimensions.height,
  };
  const origin = plan.site;
  const row = {
    id: '',
    route: topic.route,
    group: '内容中心',
    focusKeyword: topic.focusKeyword,
    title: metadata.title,
    description: metadata.description,
    h1: frontmatter.title,
    intentCN: topic.questionCN,
    notesCN: 'P0 教育型采购指南；基于可核实的产品实例，不是实测安装报告或正式报价。',
    supportingKeywords: [],
    url: origin + topic.route,
    sourceFile: topic.file,
    priority: 'P0',
    titleCharacters: [...metadata.title].length,
    descriptionCharacters: [...metadata.description].length,
    metaKeywords: null,
    canonical: origin + topic.route,
    robots: 'index, follow',
    sitemap: true,
    htmlLang: 'ar',
    textDirection: 'rtl',
    ogLocale: 'ar_AR',
    ogType: 'article',
    ogTitle: metadata.title,
    ogDescription: metadata.description,
    ogImage: origin + image,
    ogUrl: origin + topic.route,
    ogSiteName: 'CCF',
    twitterCard: 'summary_large_image',
    twitterTitle: metadata.title,
    twitterDescription: metadata.description,
    twitterImage: origin + image,
    articlePublishedTime: new Date(frontmatter.publishDate).toISOString(),
    articleModifiedTime: new Date(frontmatter.updateDate || frontmatter.publishDate).toISOString(),
    articleAuthorUrl: origin + '/about#publisher',
    file: topic.route.slice(1) + '/index.html',
    implementationStatus: '已加入本地网站构建，未发布线上',
    changes: ['New article'],
  };
  const existing = plan.pages.findIndex((page) => page.route === topic.route);
  if (existing < 0) {
    row.id = String(plan.pages.length + 1).padStart(2, '0');
    plan.pages.push(row);
  } else plan.pages[existing] = { ...row, id: plan.pages[existing].id };
  topic.status = 'implemented_locally_not_deployed';
}
fs.writeFileSync('src/data/seo.json', JSON.stringify(seo, null, 2) + '\n');
fs.writeFileSync('reports/seo-metadata-plan/metadata-plan.json', JSON.stringify(plan, null, 2) + '\n');
fs.writeFileSync('reports/blog-p0-2026-10-31/topics.json', JSON.stringify(registry, null, 2) + '\n');
console.log('Registered two P0 articles in the live SEO map and metadata verification manifest.');
