# CCF 阿拉伯语站（ar.ccfrp.com）页面级 SEO 诊断报告

> 诊断日期：2026-10-30 · 诊断范围：全站 38 个已构建页面（Astro 静态站，基于 `dist/` 产物 + 源码逐页核查）
> 目标：以获取 B2B 询盘为导向的自然搜索优化

---

## 一、总体评价

**技术 SEO 基础扎实（8/10），页面级细节有明显缺陷（6/10），内容与关键词策略是最大短板（4/10）。**

做得好的部分：

- `lang="ar" dir="rtl"` 正确；Tajawal 阿语字体自托管 + 预加载（CWV 友好）
- 每页 canonical 正确、自指；`trailingSlash: false` 一致
- 结构化数据覆盖面好：首页 WebSite + Organization + FAQPage；博客文章 BlogPosting + Person + BreadcrumbList；全站自动 BreadcrumbList + WebPage（ContactPage/AboutPage/CollectionPage 类型区分正确）
- noindex 的 tag 页正确输出 `noindex, follow`；博客分页有 rel=prev/next
- robots.txt 对 AI 爬虫（GPTBot/ClaudeBot/PerplexityBot 等）明确开放——GEO（AI 搜索可见性）意识好，且已提供 `llms.txt`
- 全站 webp 图片、静态构建、WhatsApp 预填询盘文案（转化细节到位）

---

## 二、P0 严重问题（必须修复）

### 1. hreflang 实现错误 —— 全站所有页面声明同一个英文页面

**位置**：`src/layouts/Layout.astro` 第 46-49 行

每个阿语页面都输出：

```html
<link rel="alternate" hreflang="en" href="https://ccfrp.com/" />
<link rel="alternate" hreflang="x-default" href="https://ccfrp.com/" />
```

问题：

- hreflang 必须是**页面级一一对应**。`/products/hoods` 的 en 对应页应是英文站的产品页，而不是英文首页。目前所有 38 个页面都指向英文首页，属于错误注释。
- hreflang 要求**双向互链**（reciprocal）：英文站对应页面必须回链 `hreflang="ar"` 指向本页，否则 Google 忽略整组注释。本次诊断无法从本地确认 ccfrp.com 是否有回链（线上抓取未成功），**请务必在线上核实**。

**修复方案（二选一）**：

- A（推荐，改动小）：删除 `Layout.astro` 中 `en` 和 `x-default` 两行 hreflang，改为在英文主站的页脚/导航加显式语言切换链接（`hreflang="ar"` 的 `<a>` 链接也可传递语言关联信号）。
- B（完整方案）：建立 ar ↔ en 的 URL 映射表，逐页输出对应 hreflang，并在 ccfrp.com 同步回链。同时在 sitemap 中加 `xhtml:link` 声明。

### 2. robots.txt 缺少 Sitemap 声明

**位置**：`public/robots.txt`

没有任何 `Sitemap:` 行。**修复**：文件末尾追加：

```
Sitemap: https://ar.ccfrp.com/sitemap-index.xml
```

### 3. 4 个页面 Title 出现 "CCF — CCF" 双品牌

**位置**：`src/pages/grow/oem-odm.astro`、`grow/wholesale.astro`、`grow/dropshipping.astro`（需确认）、`grow/channel-partners.astro`、`grow/index.astro`、`catalogs.astro`、`about.astro` 及 cases 页

这些页面的 title 自带 `| CCF`，而 config 模板 `%s — CCF` 又追加了一次品牌，实际输出：

```
تصنيع قطع ألياف كربون مخصصة OEM/ODM | CCF — CCF
من نحن — مصنع ألياف كربون للسيارات | CCF — CCF
```

**修复**：这些页面 title 去掉手写的 `| CCF`，或加 `ignoreTitleTemplate: true`。统一规则：页面 title 只写关键词部分，品牌交给模板。

### 4. 404 页面被设为 index, follow 且有 canonical

实测 `dist/404.html` 输出 `<meta name="robots" content="index, follow">` + `canonical → /404`。
**修复**：`src/pages/404.astro` 的 metadata 加 `robots: { index: false, follow: false }`。

### 5. Sitemap 包含 noindex 的 tag 页

`/tag/aljmlh` 等 3 个 tag 页 robots 为 noindex，但仍在 `sitemap-0.xml` 中——自相矛盾信号，浪费抓取预算。
**修复**：`astro.config.ts` 中 sitemap 加过滤：

```ts
sitemap({
  filter: (page) => !page.includes('/tag/'),
});
```

---

## 三、P1 重要问题（显著影响流量与询盘）

### 6. OG 分享图全站共用一张默认图

所有页面未传 `openGraph.images`，均回退到 `~/assets/images/default.png`（且这是全站唯一在社交分享中出现的图）。在 WhatsApp 是海湾 B2B 沟通主阵地的市场，分享卡片图直接影响点击。
**建议**：至少给 8 个产品分类页、6 个车型页、首页各配专属 OG 图（1200×628）。产品页可直接复用页面主图的横版裁剪。

### 7. 没有任何流量/排名测量手段

- `analytics.googleAnalytics.id: null` —— GA4 未接
- config.yaml 无 `googleSiteVerificationId` —— Search Console 未通过 meta 验证（若已用 DNS 验证可忽略此项，但 GA4 必须接）
  **建议**：接入 GA4（可顺带启用 Partytown `hasExternalScripts = true` 卸载到 Web Worker），注册 Search Console 并提交 sitemap，设置 WhatsApp 点击 / mailto 点击为转化事件——B2B 站的核心转化不在表单而在 WhatsApp。

### 8. 内容体量严重不足（B2B 询盘站最大瓶颈）

- 博客全站仅 **1 篇**文章（dry-carbon-vs-wet-carbon），分类页只有 1 篇内容，tag 页同理
- 阿语 B2B 采购者搜索的问题型关键词（MOQ、شحن 国际物流、عينات 样品、فحص الجودة 验货、أسعار الجملة 批价）完全没有落地页承接

**建议内容集群（按询盘意图优先级）**：

| 集群     | 示例标题方向                                              | 承接意图            |
| -------- | --------------------------------------------------------- | ------------------- |
| 采购指南 | كيف تستورد قطع الكربون من الصين（如何从中国进口碳纤维件） | 信息型 → 引流       |
| MOQ/样品 | الحد الأدنى للطلب والعينات في B2B                         | 商业调查型          |
| 物流关税 | الشحن والجمارك لدول الخليج                                | 商业调查型          |
| 工艺科普 | الكربون الجاف vs الرطب（已有 1 篇，扩写成集群）           | 信息型              |
| 品牌应用 | دليل تخصيص BMW M بالكربون（每品牌一篇）                   | 交易型 → 直连车型页 |

每月 2-4 篇，坚持 3-6 个月。这是该站从"企业名片"变成"询盘来源"的唯一路径。

### 9. 产品/车型页缺少商业型结构化数据

现有 CollectionPage 类型正确，但缺少 `OfferCatalog`/`ItemList`。Google 无法理解"该页是一个 BMW G80 M3 碳纤维件目录"。
**建议**：在 8 个产品页和 6 个车型页的 JSON-LD 中追加：

```json
{
  "@type": "OfferCatalog",
  "name": "أغطية محرك ألياف الكربون BMW",
  "itemListElement": [
    { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "BMW G90 M5 Carbon Fiber Hood (APN)" } }
  ]
}
```

同时为 FAQ 内容加 FAQPage schema（目前仅首页/联系页有 FAQs widget 的 schema）。

### 10. 页面内图片重复复用

- `hoods.astro` 中 6 个产品卡共用同一张 `hood.webp`，仅 alt 文本不同
- 各车型页内多张卡片复用同一品牌图
  **影响**：图片信号弱（Google 图片搜索带不来流量）、页面同质化。
  **建议**：产品级图片逐个实拍/替换；短期至少保证"每个产品卡一个不同文件"。

### 11. 部分图片体积偏大

`warehouse.webp` 397KB、`trunk-lid.webp` 313KB、`hood.webp` 215KB——这些图不在首屏却接近/超过 200KB。
**建议**：压缩到 150KB 以内（宽度 1600px 足够），首页 LCP 图 `hero-supercar.webp` 单独确认加载体积。

---

## 四、P2 优化建议（锦上添花）

### 12. 阿语关键词策略需要"本地化"而不只是"翻译"

- 当前标题多为直译式 MSA（标准阿语）。海湾买家高频搜索词更口语/行业化，例如：
  - **كربون فايبر**（carbon fiber 音译，搜索量常高于 ف ألياف الكربون）
  - **بودي كيت**（body kit 音译）、**سبويلر**、**ديفيوزر**
  - 品牌词组合：`كفرات كربون BMW`、`هود كربون G80`
- **建议**：把"كربون فايبر"放进核心页 title/H1 副词位，如「أغطية محرك كربون فايبر لـ BMW」。用 Google Keyword Planner / Ahrefs 阿语库逐一验证再定稿。
- 地域考虑：若主要市场是海湾，可评估 hreflang 用 `ar`（通用，现状可行）即可，不必拆 `ar-SA`——除非未来做分国别页。

### 13. `_headers` 只缓存了 `/_astro/*`

`/images/*.webp` 与字体没有长缓存头。追加：

```
/images/*
  Cache-Control: public, max-age=31536000, immutable
```

顺带补安全头（HSTS、X-Content-Type-Options）作为信任信号。

### 14. 内链与锚文本

- 首页 → 产品分类页的内链良好（两套入口：分类 + 车型），面包屑齐全 ✅
- 博客文章尾部建议加"相关产品"模块，把内容流量导向产品页（目前文章与产品页几乎无互链）
- 产品页底部"完整目录在英文主站"的外链设计合理（satellite 站定位），但注意这些外链均无 `rel` 属性——保留 dofollow 没问题，属正常集团内链。

### 15. GEO/AEO 已有基础，可再进一步

`llms.txt` 质量不错（中英双语 + 站点地图）。建议后续在 FAQ 内容里保持"问题式小标题 + 直接答案在前 50 词"的格式，提高被 AI 搜索（Google AI Overviews / Perplexity）引用的概率。

### 16. 转化细节（影响 SEO 变现而非排名）

- 每个产品分类页的 WhatsApp 链接是同一段预填文案；建议按页面定制（如 hoods 页预填"أريد عرض سعر لغطاء محرك..."），询盘质量更高、也便于 GA4 区分转化来源。
- 表单跳转到英文主站 `ccfrp.com/contact/`——对阿语用户有语言断层，建议后续在本站内嵌轻量询盘表单（静态站可用云服务/Forms 寄存）。

---

## 五、逐页核查摘要

| 页面                    | Title                    | Description      | Schema                         | 主要问题                                              |
| ----------------------- | ------------------------ | ---------------- | ------------------------------ | ----------------------------------------------------- |
| / 首页                  | ✅ 优                    | ✅               | WebSite+Org+FAQPage+WebPage ✅ | OG 用默认图                                           |
| /products + 8 分类页    | ✅ 唯一                  | ✅ 含品牌/车型词 | CollectionPage ✅              | 缺 OfferCatalog；图重复；OG 默认图                    |
| /vehicles + 6 车型页    | ✅                       | ✅               | CollectionPage ✅              | 缺 OfferCatalog/FAQ schema                            |
| /grow 5 页              | ❌ 双品牌 CCF — CCF      | ✅               | WebPage                        | title 修复                                            |
| /about /catalogs /cases | ❌ about/catalogs 双品牌 | ✅               | WebPage                        | title 修复                                            |
| /contact                | ✅                       | ✅               | ContactPage ✅                 | 建议加地址 schema（本站有完整地址内容却未输出 Place） |
| /blog + 文章            | ✅（文章 title 偏长）    | ✅               | BlogPosting+Person ✅          | 内容量 1 篇；rel=prev/next ✅                         |
| /tag/*                  | noindex ✅               | —                | —                              | 从 sitemap 移除                                       |
| /404                    | ❌ index,follow          | —                | —                              | 改 noindex                                            |
| /terms /privacy         | ✅                       | —                | WebPage                        | 可保持                                                |

---

## 六、修复优先级清单（可直接执行）

| #   | 动作                                                    | 文件                                               | 工作量   |
| --- | ------------------------------------------------------- | -------------------------------------------------- | -------- |
| 1   | robots.txt 加 `Sitemap:` 行                             | `public/robots.txt`                                | 1 分钟   |
| 2   | 404 页 noindex                                          | `src/pages/404.astro`                              | 1 分钟   |
| 3   | 去除 4+ 页面 title 双品牌                               | `grow/*.astro`, `about.astro`, `catalogs.astro` 等 | 10 分钟  |
| 4   | sitemap 过滤 /tag/                                      | `astro.config.ts`                                  | 2 分钟   |
| 5   | 删除/修正全站错误 hreflang                              | `src/layouts/Layout.astro`                         | 5 分钟   |
| 6   | 接入 GA4 + Search Console                               | `src/config.yaml`                                  | 15 分钟  |
| 7   | 产品/车型页加 OfferCatalog JSON-LD                      | 各页面                                             | 1-2 小时 |
| 8   | 核心页配专属 OG 图                                      | 各页面 + `src/assets/images/`                      | 2-3 小时 |
| 9   | `_headers` 加图片缓存                                   | `public/_headers`                                  | 2 分钟   |
| 10  | 压缩 3 张 >200KB webp                                   | `public/images/`                                   | 10 分钟  |
| 11  | 制定 3-6 个月阿语内容计划（P0：进口指南/MOQ/物流 3 篇） | `src/data/post/`                                   | 持续     |
| 12  | 线上核实 ccfrp.com ↔ ar.ccfrp.com 的 hreflang 互链      | 线上                                               | 10 分钟  |

---

_报告基于源码与 `dist/` 构建产物静态分析。线上抓取（ccfrp.com / ar.ccfrp.com）本次未成功，Core Web Vitals 实测数据、Search Console 收录数据、hreflang 互链现状需在线上工具（PageSpeed Insights / Search Console / Rich Results Test）中复核。_
