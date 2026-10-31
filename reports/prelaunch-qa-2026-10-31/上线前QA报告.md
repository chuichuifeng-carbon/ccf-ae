# 上线前 QA 验收报告

日期：2026-10-31。对象：本地阿拉伯语 Astro 静态站，BMW、Mercedes-AMG、Porsche 三品牌。

## 结论

**本地生产版本验收通过，可以进入部署阶段。尚未上线；正式域名的 HTTPS、重定向、CDN 响应头及线上收录需在部署后验证。**

按站主最新要求，删除原来出现在 7 个页面上的本地询盘表单。当前 43 个前台页面中，HTML 和浏览器检查均确认 **0 个表单、0 个输入框、无旧 #inquiry 锚点依赖**。联系页首屏和页尾直接提供 WhatsApp、邮箱按钮，不依赖表单后端。

## 本轮修复

| 问题                                                   | 处理结果                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 本地询盘表单不符合站主的静态站联系方式要求             | 删除 WhatsAppInquiry 组件及全部引用、表单提交代码与测试；删除未使用的 Contact、Newsletter、Form 模板组件 |
| 产品详情的次要按钮仍指向表单锚点                       | 改为本地联系页；联系页直接链接 WhatsApp 和 mailto                                                        |
| 隐私页仍说明本地表单的数据处理                         | 更新正文、日期、Description、OG/Twitter 描述及 SEO 清单，明确本站没有询盘采集表单                        |
| 首页 Hero 覆盖了按钮自定义样式                         | 正确合并按钮 class；浅色、深色下均保留高对比的 WhatsApp 主按钮                                           |
| 手机菜单缺少 Esc 退出                                  | 支持 Esc 关闭，并将键盘焦点还给菜单按钮                                                                  |
| 导航缺少当前页面语义                                   | 初次加载及站内切换后同步 aria-current=page                                                               |
| HTML 的 head/body 边界异常，部分 head 内容落在 head 外 | 恢复正确结构；无 JS 回退使用独立样式；新增真正的 HTML 解析检查，覆盖 JS 启用/禁用两种解析模式            |

## 验证范围与结果

| 项目                                       | 结果                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 生产构建                                   | 43 页构建成功，保持全静态输出                                                                         |
| Astro / ESLint / Prettier                  | 通过                                                                                                  |
| HTML 解析                                  | 43 页两种解析模式通过；无重复 ID；SEO 标签位于 head 内                                                |
| TDK、H1、canonical、OG/Twitter、语言和 RTL | 全部 43 页通过；38 页纳入页面地图，5 页 noindex                                                       |
| 图片                                       | 153 处展示尺寸和响应式文件通过，70 张原图可访问；图片地图覆盖 26 页                                   |
| 本地 HTTP                                  | 53 项通过，包含真实页面、随机/已删除地址和 XML/RSS；失效路径真实返回 404                              |
| 外部主站链接                               | 98 个 URL 检查通过，包括 40 个不同 PDF 文件及实际引用的目录页码链接；带 HTML 锚点的链接也检查目标锚点 |
| 桌面和手机                                 | 43 页 × 1280px/375px，共 86 项：无重复 H1、表单、横向溢出、head 标签错位或已完成加载的可见图片损坏    |
| 额外断点                                   | 首页、联系、目录、奔驰品牌、单品、服务、博客在 320px 与 768px 下另做 14 项检查，通过                  |
| 菜单与导航                                 | 手机展开、Esc 关闭及焦点返回通过；产品/联系之间连续切换 4 次，菜单关闭、页面滚动正常，当前项标记正确  |
| 主题与 CTA                                 | 首页主按钮在浅色、深色下可见；保持 WhatsApp 优先；联系页有两个正文邮箱入口                            |
| 浏览器控制台                               | 最终检查未发现 error 级日志                                                                           |
| 询盘操作                                   | 检查链接号码、预填内容和来源；未向 WhatsApp 发送任何测试消息，未发送测试邮件                          |
| 内容范围                                   | 仅三品牌，3 篇博客保留；现有来源与公司身份完整性验证通过                                              |

98 个 URL 数量按具体链接统计，PDF 不同页码链接可重复指向同一文件；去重后为 40 个 PDF 文件。外部链接检查反映检查时的可访问性，不保证第三方后续永不变更。

## 部署时及部署后的验收项

1. 将本次构建生成的完整 dist 部署到正式域名，避免混用旧 HTML 和新资源。
2. 在实际主机上核对 HTTPS、www/非 www、尾斜杠及 index.html 的跳转，确认与 https://amxnx.vip 的 canonical 一致。
3. 正式域名访问一个随机路径及已删除品牌路径，确认返回 404，而非首页 200。
4. 核对 robots.txt、两个 sitemap、RSS、图片和字体响应；确认实际主机应用了缓存规则和压缩。
5. 在真实手机上打开 WhatsApp、邮箱，验证系统 App 接管。浏览器 QA 未代替实际手机 App 测试，未进行真实消息发送。
6. Search Console 验证、站点地图提交及 GA 询盘统计尚未配置有效 ID；不能把静态检查通过等同于 Google 已收录、产生排名或已有询盘归因。

保留的 /decapcms/ 是模板管理入口，已 robots 排除并 noindex；本次不将其计入 43 个前台页面，也不将其宣称为已配置可用后台。网站的浏览与直接 WhatsApp/邮箱联系不依赖它。

未进行 Safari、Firefox 或实体 iPhone/Android 全设备矩阵，也没有把本地截图检查宣称为真实用户 Core Web Vitals 达标。上述线上和设备项为部署验收范围，不是已在本地发现且未修复的前台阻断问题。

## 证据与复查命令

- [43 页 HTML 结构验证](html-structure.json)
- [86 项逐页浏览器检查与 14 项额外断点检查](browser-qa.json)
- [98 个外部 URL 检查](external-links.json)
- [无表单联系页截图](contact-without-form.png)
- [首页 CTA 浅色截图](home-cta-light.png)

```sh
npm run build
npm run check
npm run check:prelaunch
node scripts/verify-technical-seo.mjs --http=http://127.0.0.1:4322
node scripts/verify-seo-metadata.mjs
node scripts/verify-b2b.mjs
node scripts/verify-eeat.mjs
node scripts/verify-p0-blogs.mjs
node scripts/verify-brand-scope.mjs
# 按需重新检查公开主站链接：
node scripts/check-external-links.mjs --live
```
