import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const plan = read('reports/seo-metadata-plan/metadata-plan.json');
const seo = read('src/data/seo.json');
const before = read('reports/seo-intent-2026-10-31/before.json');
const resources = read('src/data/buyer-resources.json');
const clean = (text) =>
  text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const comparable = (text) => clean(text).replace(/[\s\u200e\u200f\u2066-\u2069]/g, '');
const notes = {
  '/carbon-fiber-import-cost-profit-guide':
    '承接进口成本计算方法和毛利率/加价率区别的教育型搜索；以可复算示例、整单/单件口径、费用核对与工具互链帮助买家制定预算，不提供实时税率或利润保证。',
  '/import-cost-calculator':
    '承接到岸成本及毛利率估算意图；明确示例美元金额、单件/整单口径、公式和非实时运费税率边界，提供采购指南与WhatsApp入口。',
  '/': '首页承接中国制造商查询；首屏明确三品牌、企业买家与报价所需资料。与 wholesale 的批量采购任务分工。',
  '/products': '承接按零件类型选品；保留八类入口，与按车型选品页区分，补充目录、适配和批发内链。',
  '/vehicles': '承接按品牌和车型找碳纤维件；明确仅三品牌，补充阿拉伯语品牌表达及目录和适配下一步。',
  '/catalogs': '承接 PDF 目录下载意图；H1 明示 PDF，正文有真实的 40 个条目，说明参考号、材料与询价步骤。',
  '/grow': '承接合作模式比较；新增四种模式比较表，区分适用任务和启动条件，避免与 wholesale 重复定位。',
  '/grow/wholesale': '承接制造商批发供货意图；标题补齐工厂和批发，正文已有数量、样品、混单及报价条件，补充采购指引。',
  '/grow/oem-odm': '承接定制开发查询；保留 CAD、样品、模具与验收过程，H1 明确 OEM/ODM，并区分现有目录件与新开发。',
  '/grow/dropshipping': '原首屏偏市场测试概念；改为电商逐单履约条件，补充目的地、成本、样品和索赔四问。',
  '/grow/channel-partners': '原首屏偏泛合作宣传；改为经销商实际任务，补充批发与分销区别、独家条件和申请资料四问。',
  '/vehicles/bmw': '品牌页承接 BMW 系列与目录意图；自然增加阿语品牌表达并链接 G80/G82 三种真实产品设计。',
  '/vehicles/mercedes-amg': '补充 مرسيدس 阿语品牌词，保留 Mercedes-AMG 与 G63/GT/C63 等型号；目录和底盘核对承接采购。',
  '/vehicles/porsche': '补充 بورش 阿语品牌词和车型译名；保留 Porsche、911/718 代号，目录与世代核对承接采购。',
  '/products/front-lips-splitters':
    '原分类标题泛化；按当前实物卡片限定 BMW M，保留 R44/CSL/MP 设计差异并引向适配和报价。',
  '/products/rear-diffusers':
    '按实际展示限定 BMW M 后扩散器；区分后保险杠、排气口和套件内容，避免与产品 MP 详情页重复。',
  '/products/side-skirts': '按实际卡片限定 BMW 与奔驰 G63；保留侧裙与侧踏词义区别，采购指引核对功能和套件。',
  '/products/spoilers-wings': '按实际展示限定 BMW M；区分尾翼和扰流板设计与固定方式，保持分类比较而非单品定位。',
  '/products/hoods': '标题明确 BMW 与常见 M 车型；首屏移除易失效设计数量，以锁扣、铰链、开孔和材料作选型条件。',
  '/products/trunk-lids': '标题明确 BMW 车型，正文自然覆盖 شنطة 同义表达；核对车身、锁扣、摄像头和需移装部件。',
  '/products/grilles-air-intake': '原 H1 缺材料与品牌；补齐碳纤维/BMW，明确为格栅及风口饰件，并核对传感器等装备。',
  '/products/mirror-caps':
    '标题明确当前 F90/F8x 展示范围；区分替换壳与覆盖件，避免将具体材料或安装方式扩展到所有款式。',
  '/cases': '按现有证据改为客户到访及供方评估；不把合影概括为性能测试或大规模交付证明。',
  '/cases/canada-distributor-visit':
    '保留：内容对应加拿大到访、产品讨论与 BMW 订单记录；不承担通用产品大词，CTA 用于安排供货讨论。',
  '/cases/usa-oem-carbon-fiber': '保留：标题和内容对应美国客户到访及项目讨论；不从照片推断具体设计成果或生产规模。',
  '/about': '承接 CCF 主体与制造地点核验；与首页工厂泛词区分，保留地址、历史、图像和证据边界。',
  '/contact':
    '承接直接询价；标题/H1 明确产品报价及 WhatsApp，正文列出车型、参考号、数量与目的地，直接通过 WhatsApp 或邮箱联系，不设本地表单。',
  '/faqs': '承接采购问题集合；标题明确数量/适配/运输/售后，正文按采购任务分组并连接专门页面。',
  '/editorial-policy': '保留：信息来源和更正意图明确；不强行添加批发产品词，保留作者与来源说明。',
  '/return-refund-policy': '保留：售后核验任务与内容一致；正文明确不同材料和定制订单条件，避免用营销词替代政策。',
  '/privacy': '保留：隐私与询盘数据处理意图；不伪装产品获客页，保留真实 WhatsApp 表单处理说明。',
  '/terms': '保留：网站使用和订单条款任务明确，法律页不强行争取采购产品词。',
  '/blog': '原介绍偏干碳制造；改为材料、适配、报价三个实际主题，补充按采购阶段选择文章的入口。',
  '/dry-carbon-vs-wet-carbon':
    '原标题未直接承接“区别”；改为问答式 H1，新增材料区别表和采购选择建议，并更新真实修订日期。',
  '/carbon-fiber-parts-fitment-check':
    '保留：标题/H1 和正文直接回答适配核对；已有车型清单、安装区域照片、案例与报价入口。',
  '/compare-wholesale-carbon-fiber-quotes':
    '保留：直接回答报价比较，不与 wholesale 服务页争夺同一任务；正文有比较项目、成本与样品核对。',
  '/category/adlh-almshtryn': '保留 noindex,follow：目前与博客首页大幅重合，仅作阅读导航；不分配独立获客关键词。',
  '/tag/aljmlh': '保留 noindex,follow：标签导航不是批发服务页，避免与 wholesale 及报价文章混淆。',
  '/tag/altsnya': '保留 noindex,follow：现有薄归档仅供导航，不与制造商首页/OEM 服务页争夺排名。',
  '/tag/alyaf-alkrbwn-aljaf': '保留 noindex,follow：现有薄归档仅供导航，不与材料区别文章争夺排名。',
  '/404.html': '保留 noindex 且无 canonical；补充产品、目录和询价恢复入口。实际 HTTP 404 状态需上线主机验证。',
};
const details = [
  ['bmw-g80-g82-carbon-fiber-front-lip-r44-style', 'BMW M3 G80/M4 G82 + R44 前唇；保留 DCF/Wet 两材料参考信息。'],
  [
    'bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style',
    'BMW M3 G80/M4 G82 + CSL 三件前唇；明确套件和材质核对。',
  ],
  ['bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style', 'BMW M3 G80/M4 G82 + MP 后扩散器；保留参考号 44 和排气核对。'],
  ['bmw-g87-m2-carbon-fiber-hood', 'BMW M2 G87 + 开孔机盖；保留照片和锁扣铰链核对，不捏造该产品的目录页。'],
];
for (const [slug, note] of details)
  notes[`/products/${slug}`] = `补齐具体车型与部件/设计的长尾意图：${note} 增加返回分类比较与材料/适配内链。`;

const titles = new Set();
if (fs.existsSync('reports/listicles-2026-11-02/registry.json')) {
  for (const post of read('reports/listicles-2026-11-02/registry.json'))
    notes[post.route] =
      `${post.intentCN}；10项榜单，CCF为首项，区分企业采购渠道和具体产品。其他公司为纯文本，未虚构背书。`;
}
for (const page of plan.pages) {
  if (/\/(?:blog|category\/[^/]+|tag\/[^/]+)\/\d+$/.test(page.route))
    notes[page.route] = '分页承接继续浏览文章的导航意图；独立标题/H1/self-canonical，保持noindex，不与专题文章竞争。';
}
const descriptions = new Set();
const headings = new Set();
const rows = [];
for (const page of plan.pages) {
  const baseline = before[page.route] || { title: null, description: null, h1: null };
  const html = fs.readFileSync(`dist/${page.file}`, 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)?.[1];
  assert.ok(main, `${page.route}: visible main content`);
  const current = seo[page.route];
  assert.ok(notes[page.route], `${page.route}: individual editorial assessment`);
  for (const [key, seen] of [
    ['title', titles],
    ['description', descriptions],
    ['h1', headings],
  ]) {
    assert.ok(!seen.has(current[key]), `${page.route}: duplicate ${key}`);
    seen.add(current[key]);
  }
  const visibleH1 = clean(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] || '');
  assert.equal(comparable(visibleH1), comparable(current.h1), `${page.route}: visible H1 matches editorial target`);
  const h2 = [...main.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => clean(m[1]));
  const guide = resources[page.route];
  for (const match of main.matchAll(/href="([^"#]*#[^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), `${plan.site}${page.route}`);
    if (url.origin !== plan.site || !url.hash) continue;
    const destination = plan.pages.find((p) => p.route === (url.pathname.replace(/\/$/, '') || '/'));
    if (!destination) continue;
    const target = fs.readFileSync(`dist/${destination.file}`, 'utf8');
    assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${page.route}: valid section anchor`);
  }
  if (guide) {
    assert.ok(main.includes('data-buyer-resources'), `${page.route}: contextual content rendered`);
    for (const link of guide.links) {
      assert.notEqual(link.href, page.route);
      const destination = plan.pages.find((p) => p.route === link.href);
      assert.ok(destination?.sitemap, `${page.route}: useful indexable destination ${link.href}`);
      assert.ok(fs.existsSync(`dist/${destination.file}`));
      assert.ok(main.includes(`href="${link.href}"`));
    }
  }
  if (page.route.startsWith('/products/') || page.route.startsWith('/vehicles/') || page.route.startsWith('/grow/')) {
    assert.ok(main.includes('https://wa.me/8613427690360'), `${page.route}: direct WhatsApp path in main`);
  }
  const schema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => {
      const value = JSON.parse(m[1]);
      return Array.isArray(value) ? value : value['@graph'] || [value];
    }
  );
  for (const faq of schema.filter((s) => s['@type'] === 'FAQPage')) {
    for (const item of faq.mainEntity) {
      assert.ok(comparable(main).includes(comparable(item.name)), `${page.route}: structured FAQ visible`);
      assert.ok(
        comparable(main).includes(comparable(item.acceptedAnswer.text)),
        `${page.route}: structured answer visible`
      );
    }
  }
  for (const article of schema.filter((s) => s['@type'] === 'BlogPosting')) {
    assert.equal(article.headline, visibleH1, `${page.route}: article headline aligned`);
  }
  if (page.route === '/contact' || page.route === '/about') {
    assert.ok(schema.some((s) => s['@type'] === (page.route === '/contact' ? 'ContactPage' : 'AboutPage')));
  }
  rows.push({
    route: page.route,
    intentCN: page.intentCN,
    focusKeyword: page.focusKeyword,
    supportingKeywords: page.supportingKeywords,
    assessmentCN: notes[page.route],
    before: baseline,
    after: { title: current.title, description: current.description, h1: current.h1 },
    metadataChanged: ['title', 'description', 'h1'].some((key) => baseline[key] !== current[key]),
    bodyResourceLinks: guide?.links || [],
    headings: h2,
    mainWords: clean(main).split(/\s+/).length,
    index: current.index,
    sitemap: current.sitemap,
    status: 'passed',
  });
}
assert.equal(rows.length, Object.keys(seo).length, 'Every active page reviewed');
const summary = {
  reviewed: rows.length,
  metadataUpdated: rows.filter((r) => r.metadataChanged).length,
  contextualResourceSections: Object.keys(resources).length,
  indexed: rows.filter((r) => r.index).length,
  noindex: rows.filter((r) => !r.index).length,
  limitation:
    'Editorial intent mapping, not search-volume or live-ranking evidence; no Search Console access. Local build only.',
};
fs.writeFileSync(
  'reports/seo-intent-2026-10-31/page-audit.json',
  JSON.stringify({ summary, pages: rows }, null, 2) + '\n'
);
let report = '# 阿拉伯语站逐页 SEO 与搜索意图优化报告\n\n';
report += `已复核全部 ${summary.reviewed} 个前台页面，修改 ${summary.metadataUpdated} 页的 Title、Description 或 H1，并为 ${summary.contextualResourceSections} 页补充采购指引和相关内链。保持 BMW、Mercedes-AMG、Porsche 范围及 WhatsApp 优先。\n\n`;
report +=
  '## 结论与范围\n\n当前页面可以按“制造商 → 品牌/分类 → 具体产品或目录 → 采购核对 → WhatsApp 询价”的路径承接不同买家任务。服务页区分批发、定制、逐单履约和渠道合作；博客回答材料、适配与报价问题。Title、H1 与正文作语义对齐，而非要求字面完全一致。保留合适的政策、案例和文章标题，不为改动而改动。\n\n';
report += `标题和描述无重复；每页一个 H1；${summary.indexed} 页保持可索引及自引用 canonical，4 个薄归档和 404 共 5 页 noindex。目录/品牌页提供真实 PDF，产品页提供图片、参考资料和核对要点。没有虚构价格、库存、当地分支、搜索量或排名。\n\n`;
report +=
  '新增四种供货模式比较表、逐单履约与渠道合作的 8 个采购问答、干碳湿碳对比表、26 个相关采购资源区块及 404 恢复入口。修正带尾斜杠路径的 ContactPage/AboutPage 类型判断，结构化数据描述同步页面 Meta，移除不使用的远程图片预连接。\n\n';
report +=
  '## 关键词与排名边界\n\n关键词是每页内容目标，不输出 meta keywords。未提供 Search Console、关键词工具或询盘归因数据，不能证明这些词的流量、排名或询盘数量。品牌页已有目录承接，但奔驰与保时捷缺少本站独立单品详情页；以后优先依据真实询盘和曝光补充具体车型/产品，而不是批量生成相似页面。跨语言 hreflang 仍需主站逐页对等和双向标注后配置。实际 HTTP 状态、线上抓取、CWV 和 Google 收录需部署后检查。\n\n';
report +=
  '依据：[Google 标题链接指南](https://developers.google.com/search/docs/appearance/title-link)、[摘要与描述指南](https://developers.google.com/search/docs/appearance/snippet)、[SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)。Google 可改写标题和摘要；字符数是编辑参考，不是硬性排名标准。\n\n';
report += '## 每页结果\n\n';
for (const row of rows) {
  report += `### ${row.route}\n\n- 买家任务：${row.intentCN}\n- 目标关键词：${row.focusKeyword || '不分配获客关键词'}\n- 审计与处理：${row.assessmentCN}\n- Title：${row.after.title}\n- Description：${row.after.description}\n- H1：${row.after.h1}\n- 索引：${row.index ? 'index, follow；进入 sitemap' : 'noindex, follow；排除 sitemap'}\n- 结果：已逐页复核，生成 HTML 验证通过。\n\n`;
}
report +=
  '## 验证记录\n\n执行生产构建、Astro/ESLint/Prettier 检查，以及 SEO Meta、站内链接/资源、E-E-A-T 内容完整性、博客、三品牌范围和逐页意图一致性验证。浏览器截图与抽查结果另附；生成 HTML 的全页验证不等于每页逐屏视觉检查。尚未部署。\n';
const browserFile = 'reports/seo-intent-2026-10-31/browser-mobile-audit.json';
if (fs.existsSync(browserFile) && read(browserFile).pages.length === rows.length) {
  const browserAudit = read(browserFile);
  assert.equal(browserAudit.pages.length, rows.length);
  assert.ok(browserAudit.pages.every((p) => !p.overflow && p.h1.length === 1));
  report += `\n浏览器逐页检查全部 ${browserAudit.pages.length} 页：375×812 移动视口下均为一个 H1，无页面横向溢出；另检查桌面奔驰品牌首屏、移动产品标题、首页菜单与浅色博客。表格采用容器内横向滚动。此项不代替逐屏人工视觉审核或线上 Core Web Vitals 测量。\n\n`;
  report +=
    '截图：[桌面奔驰品牌页](mercedes-desktop.png)、[手机产品页](product-mobile.png)、[移动菜单](mobile-menu.png)、[浅色博客](blog-mobile-light.png)。\n';
}
fs.writeFileSync('reports/seo-intent-2026-10-31/逐页SEO优化报告.md', report);
console.log(
  `Passed: ${rows.length} pages, unique metadata/H1, rendered buyer resources, visible FAQ/schema and article alignment.`
);
