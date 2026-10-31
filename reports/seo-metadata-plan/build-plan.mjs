import fs from 'node:fs';

// Render only the active implementation manifest. Do not recreate retired routes.
const root = 'reports/seo-metadata-plan';
const plan = JSON.parse(fs.readFileSync(`${root}/metadata-plan.json`, 'utf8'));
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const esc = (value) => String(value ?? '—').replaceAll('|', '\\|');
let text =
  '# CCF 阿拉伯语站：当前全站 SEO Meta 清单\n\n当前车辆品牌范围：BMW、Mercedes-AMG、Porsche。已写入本地项目，尚未发布线上。历史审计不是当前页面范围。\n\n';
text += `现有 ${plan.pages.length} 个前台页面；${plan.pages.filter((p) => p.sitemap).length} 页纳入站点地图，${plan.pages.filter((p) => !p.sitemap).length} 页排除。Meta Keywords 不输出；独立域名 canonical 自引用。\n\n`;
for (const row of plan.pages) {
  const current = seo[row.route];
  if (!current) throw new Error(`No active SEO record: ${row.route}`);
  text += `## ${row.route}\n\n| 字段 | 当前值 |\n| --- | --- |\n| Title | ${esc(current.title)} |\n| Description | ${esc(current.description)} |\n| H1 | ${esc(current.h1)} |\n| Canonical | ${esc(row.canonical)} |\n| Robots | ${esc(row.robots)} |\n| Sitemap | ${current.sitemap ? '纳入' : '排除'} |\n| OG / Twitter | 本页标题、描述与对应分享图；${current.ogType} / ar_AR / summary_large_image |\n| 图片 | ${esc(current.image)} |\n| 源文件 | ${esc(row.sourceFile)} |\n\n`;
}
text +=
  '## 维护与验证\n\n以 src/data/seo.json 为运行时来源。标题只加一次品牌；不输出 meta keywords；不新增未经核实的英文互链、价格、库存或认证声明。修改后运行构建、check、verify-seo-metadata.mjs 及 verify-brand-scope.mjs。\n';
fs.writeFileSync(`${root}/全站SEO-TDK-Meta规划.md`, text);
console.log(`Rendered ${plan.pages.length} active metadata records.`);
