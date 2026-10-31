# 阿拉伯语站技术 SEO 优化报告

日期：2026-10-31。范围：本地 Astro 静态站全部 43 个前台页面，仅 BMW、Mercedes-AMG、Porsche；WhatsApp 仍为主要询盘入口。尚未部署。

## 已完成的修复

| 检查项         | 原状                                                        | 已实施                                                                                            |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 响应式图片     | public 图片直接提供原图，即使传入 widths 也没有实际 srcset  | 构建后统一处理 70 张原图、153 处展示；69 张生成适用尺寸，较小原图保持原尺寸                       |
| 图片尺寸       | 部分图片缺少尺寸；部分尺寸属性与原图不一致                  | 写入真实宽高，保留 CSS 的裁剪/展示方式；补齐 async decoding 和加载策略                            |
| 首屏图片       | 主页背景没有对应视口的尺寸声明                              | 背景 sizes=100vw，优先加载，浏览器可选择匹配尺寸；不扩大原图                                      |
| 图片原始证据   | 产品与文档需要允许查看原图                                  | 保留 public 原图及其链接，派生图放在内容哈希命名的 /_astro/ 下                                    |
| 图片发现       | 没有专门图片站点地图                                        | 新增 sitemap-images.xml，覆盖 26 个含图片的可索引页面，并加入 sitemap-index.xml                   |
| 页面地图       | 未配置的未来路由可能被自动纳入                              | 页面 sitemap 使用现有 SEO 清单白名单；验证脚本要求全部生成页面都有明确记录                        |
| 首屏显示       | 标题、介绍和按钮依赖滚动淡入动画                            | 移除 Hero/HeroText 与文章页首屏淡入等待，保留其他区域动画                                         |
| 无 JavaScript  | opacity-0 可能使正文不可见                                  | 在 noscript 中加入动画可见性回退；生产 HTML 检查通过，未把它宣称为无 JS 浏览器全量测试            |
| 面包屑 JSON-LD | 博客首页和 4 个归档页各出现两份                             | 由实际 Breadcrumbs 组件负责该页面包屑，布局保留 WebPage，消除重复                                 |
| Open Graph     | public 分享图的宽高在适配时被丢弃                           | 保留已有宽高，并逐页与原图核验                                                                    |
| 搜索图片预览   | 未显式开放大图预览                                          | 38 个 index 页面增加 max-image-preview:large；5 个 noindex 页保持原索引限制                       |
| 预取           | 进入视口即预取全部链接                                      | 改为 hover，减少浏览大型目录时的推测性下载                                                        |
| 缓存           | 可更新的 /images/ 文件被标记一年 immutable                  | 普通图片改为一天且可重新验证；哈希 /_astro/ 文件保留一年 immutable；Vercel 同步图片规则           |
| 后台入口       | 已有 robots 排除和页面 noindex                              | 额外加入支持平台的 X-Robots-Tag: noindex,nofollow；不变更登录或访问权限                           |
| URL 一致性     | Workers 默认目录处理可能增加尾斜杠，与本站 canonical 不一致 | wrangler 静态资源配置明确 drop-trailing-slash，继续使用 404-page；Vercel 已是 trailingSlash=false |
| RSS            | 频道标题为英文且介绍使用网站通用描述                        | 频道改用阿语博客标题和介绍，所有页面加入 RSS 自动发现链接                                         |

## 验证结果

- 43 个页面均有明确 SEO 配置；38 页 index、进入页面 sitemap，5 页 noindex、排除页面 sitemap。
- 每页一个 H1；canonical、语言 ar、RTL、TDK、OG/Twitter 和有效站内链接通过原有专项验证。
- JSON-LD 可解析，面包屑不重复，FAQ 与可见内容一致；保留真实公司身份和来源，不补造价格、评分或库存。
- 153 处 public 图片均有真实尺寸、加载策略；srcset 每个文件存在、宽度描述符和实际宽度一致，没有放大原图。
- 本地 HTTP 检查 53 项：43 个实际页面、5 个随机/已删除地址、5 个 robots/sitemap/RSS 文件。失效地址返回真实 404；不会被重定向到首页。
- 直接访问静态文件 /404.html 在预览服务器中返回 200，但页面 noindex、无 canonical；真正的失效路径返回 404。这两者分开验证。
- 浏览器在 375×812 下逐页打开 43 页，未发现重复 H1、页面横向溢出或已完成加载的可见图片损坏。另复查首页桌面、博客、移动菜单及深色产品页。
- 生产构建、Astro 检查、ESLint、Prettier 与技术 SEO 验证命令执行通过。

原图与不超过 640px 的版本比较：69 张可生成响应式版本的原图合计 **6,064,960 字节**，640px 版本（原图不足 640px 时保留原图）合计 **1,879,280 字节**，减少约 **69%**。这是独立图片文件对比，不是页面整体下载量、LCP、INP、CLS 或排名变化测量。

## 维护方法

图片处理位于 vendor/integration/technicalSeo.ts，在页面压缩和 sitemap 生成之后运行。无需手工维护响应式副本；更新源图后重新构建会生成新的内容哈希文件名。原图 URL 保持稳定供资料核验。

```sh
npm run build
npm run check
npm run check:technical-seo
# 本地预览运行时，可附加 HTTP 检查：
node scripts/verify-technical-seo.mjs --http=http://127.0.0.1:4322
```

## 部署后仍需验证

本地预览不会执行 Cloudflare/Vercel/Netlify 的所有跳转和响应头规则。正式域名上线后需要核对：HTTP→HTTPS、www/非 www、尾斜杠及 index.html 的跳转链；错误 URL 状态；CDN 缓存和压缩响应头；Googlebot 实际抓取；Search Console 的 canonical、索引和 sitemap 结果；真实用户 Core Web Vitals。

没有新增未经核实的跨域 hreflang 配对，也没有用当前构建时间给全站添加虚假的 lastmod。主站英文逐页对等关系和双向标注确认后，再配置语言关联。

本轮没有运行生产域名 Lighthouse 或接入 Search Console，不能宣称 SEO 得分、实际收录或真实用户性能已经达标。

依据：[Google 图片 SEO](https://developers.google.com/search/docs/appearance/google-images)、[Google robots 指令](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)、[Astro 构建集成 API](https://docs.astro.build/en/reference/integrations-reference/)、[Astro 预取](https://docs.astro.build/en/guides/prefetch/)、[Cloudflare HTML URL 处理](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)。

## 逐页技术验证

| 页面                                                               | 索引    | 图片展示处数 | 面包屑份数 | 结果 |
| ------------------------------------------------------------------ | ------- | ------------ | ---------- | ---- |
| /                                                                  | index   | 24           | 0          | 通过 |
| /products                                                          | index   | 12           | 1          | 通过 |
| /vehicles                                                          | index   | 3            | 1          | 通过 |
| /catalogs                                                          | index   | 0            | 1          | 通过 |
| /grow                                                              | index   | 4            | 1          | 通过 |
| /grow/wholesale                                                    | index   | 0            | 1          | 通过 |
| /grow/oem-odm                                                      | index   | 2            | 1          | 通过 |
| /grow/dropshipping                                                 | index   | 0            | 1          | 通过 |
| /grow/channel-partners                                             | index   | 0            | 1          | 通过 |
| /vehicles/bmw                                                      | index   | 4            | 1          | 通过 |
| /vehicles/mercedes-amg                                             | index   | 0            | 1          | 通过 |
| /vehicles/porsche                                                  | index   | 0            | 1          | 通过 |
| /products/front-lips-splitters                                     | index   | 5            | 1          | 通过 |
| /products/rear-diffusers                                           | index   | 5            | 1          | 通过 |
| /products/side-skirts                                              | index   | 5            | 1          | 通过 |
| /products/spoilers-wings                                           | index   | 5            | 1          | 通过 |
| /products/hoods                                                    | index   | 6            | 1          | 通过 |
| /products/trunk-lids                                               | index   | 6            | 1          | 通过 |
| /products/grilles-air-intake                                       | index   | 5            | 1          | 通过 |
| /products/mirror-caps                                              | index   | 3            | 1          | 通过 |
| /products/bmw-g80-g82-carbon-fiber-front-lip-r44-style             | index   | 5            | 1          | 通过 |
| /products/bmw-g80-g82-carbon-fiber-front-lip-three-piece-csl-style | index   | 5            | 1          | 通过 |
| /products/bmw-g80-g82-carbon-fiber-rear-diffuser-mp-style          | index   | 5            | 1          | 通过 |
| /products/bmw-g87-m2-carbon-fiber-hood                             | index   | 5            | 1          | 通过 |
| /cases                                                             | index   | 2            | 1          | 通过 |
| /cases/canada-distributor-visit                                    | index   | 2            | 1          | 通过 |
| /cases/usa-oem-carbon-fiber                                        | index   | 2            | 1          | 通过 |
| /about                                                             | index   | 16           | 1          | 通过 |
| /contact                                                           | index   | 0            | 1          | 通过 |
| /faqs                                                              | index   | 0            | 1          | 通过 |
| /editorial-policy                                                  | index   | 0            | 1          | 通过 |
| /return-refund-policy                                              | index   | 0            | 1          | 通过 |
| /privacy                                                           | index   | 0            | 1          | 通过 |
| /terms                                                             | index   | 0            | 1          | 通过 |
| /blog                                                              | index   | 3            | 1          | 通过 |
| /dry-carbon-vs-wet-carbon                                          | index   | 3            | 1          | 通过 |
| /category/adlh-almshtryn                                           | noindex | 3            | 1          | 通过 |
| /tag/aljmlh                                                        | noindex | 3            | 1          | 通过 |
| /tag/altsnya                                                       | noindex | 2            | 1          | 通过 |
| /tag/alyaf-alkrbwn-aljaf                                           | noindex | 2            | 1          | 通过 |
| /404.html                                                          | noindex | 0            | 0          | 通过 |
| /carbon-fiber-parts-fitment-check                                  | index   | 3            | 1          | 通过 |
| /compare-wholesale-carbon-fiber-quotes                             | index   | 3            | 1          | 通过 |

截图：[首页桌面](home-desktop.png)、[手机博客](blog-mobile.png)、[移动菜单](mobile-menu.png)、[深色产品页](product-mobile-dark.png)。
