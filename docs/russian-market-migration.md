# Russian market migration — amxnx.vip

Status: local Russian implementation and final QA complete. No commit, push or production deployment performed.

Owner decisions (2026-11-18): replace the Arabic site at the existing domain; retain the existing WhatsApp, email and phone. Central Asian Russian-speaking B2B buyers are the target. No new local warehouse, stock, payment, delivery or language-support claims are authorized. Preserve existing MOQ, lead-time and warranty promises.

## Stages

- [x] Remove repeated category/model image disclaimers.
- [x] Russian navigation, footer and shared WhatsApp request fields; retain existing contact destinations.
- [x] LTR document direction, Cyrillic-capable Inter font, VK-inspired blue/gray theme and Russian default locale.
- [x] Russian homepage and shared inquiry entry points.
- [x] Company/contact/service page bodies.
- [x] Vehicle index, BMW filters, Mercedes-AMG/Porsche PDF entry pages and Russian product-card labels.
- [x] Category page bodies and complete product-detail UI.
- [x] Russian output for all 563 product records through a typed editorial localization layer; catalogue generator updated to preserve it. Source records, URLs, photos, vehicle references and commercial promises retained.
- [x] Terms, privacy, return/refund and editorial policies, plus the grouped FAQ.
- [x] Cases, catalogue index, calculator and machine-readable buyer guide.
- [x] Seven procurement guides, all 28 blog cards/metadata, blog UI, taxonomy labels, archive pages and RSS.
- [x] All 21 selection/listicle bodies and ItemList labels translated; all 28 blog posts complete.
- [x] All per-page SEO records/metadata plan, structured-data language, feeds, sitemap and accessibility labels synchronized. Product and taxonomy URLs preserved.
- [x] Production build, full SEO/product/hosting checks, Arabic-residue audit, desktop/mobile visual and inquiry QA; Cloudflare file budget verified.
- [ ] Publish complete migration and verify production before GSC submission.

All 645 public pages pass the Russian language audit and metadata plan verification. All 28 blog bodies and their list labels are Russian. Original PDF source documents remain English/Chinese, as disclosed in catalogue notices. Raw source records and legacy taxonomy identifiers may retain Arabic internally to preserve source facts and stable URLs; these are not emitted as buyer-facing copy. Do not add alternate-language hreflang entries for pages that no longer exist.

## Finder phase (2026-11-18)

Russian homepage, vehicle index and BMW finder implemented. BMW now renders 563 unique cards once, supports all chassis codes, category/search filters, G80 hash links, reset and empty results. Browser QA: G80 122 results; G80 + CSL 11; reset 563; no Arabic visible on homepage/BMW; no overflow at 390px. Product detail bodies and other brand pages remain pending. Russian card labels are derived from existing source part types and style identifiers and do not add material/fitment claims.

The Mercedes-AMG/Porsche entry pages and shared procurement/resource blocks for migrated routes are now Russian. All 13 product categories have Russian display labels. Full code checks pass; production build and final output checks are recorded after cache regeneration.

Finder-phase validation: npm run check and production build passed. All five entry-page outputs have lang=ru, dir=ltr, exactly one H1 and no Arabic body text. Hosting QA passed: 1,379 redirect rules without canonical cycles; 16,862 of 20,000 files. No push or deployment performed.

## Product phase (2026-11-18)

All 563 product pages, 13 category pages and the product index pass Russian copy/schema/accessibility-label checks (577 pages). Images, URLs, chassis, model/year fields and video references were compared with the preserved raw source array. Non-lighting material labels remain unchanged; the two lighting records omit erroneous carbon material/keywords. MOQ 1, 25–30 days, one-year warranty and transport replacement/re-shipment are retained in Russian. All product titles/SEO titles/descriptions remain distinct. Five useful body destinations per detail page are verified.

Product gallery next/previous arrows and keyboard navigation now follow LTR; lightbox, zoom, mobile and dark appearance were verified in the browser. Header layout uses a consistent 1280px breakpoint and automatic side columns for Russian navigation.

Checks: npm run check; npm run build; product QA; technical SEO; HTML prelaunch; hosting; npm run check:russian-products. Output: 16,862 / 20,000 files. No push or deployment. Remaining: company/contact/service/policy pages, blog posts/taxonomies, calculator, feeds/llms guides, then whole-site Russian SEO/QA. PDF source files remain original English/Chinese as identified in the Russian catalogue notices.

## Company, service and policy phase (2026-11-18)

Twelve pages migrated: about, contact, five grow pages, FAQs, editorial policy, terms, privacy and return/refund policy. Company proof photos and five document-original links retained; supplier history distinguishes the broader 1,500-position range from this site catalogue. Official office/factory addresses, WhatsApp/email, China business hours and policy periods retained. The source return policy date is 3 October 2026; translation dates are identified separately.

Browser QA covered document anchors, 390px contact/policy layout, native FAQ expansion, contact links and dark service layout. Fixed mixed Latin/Cyrillic button spacing and suppressed duplicate automatic procurement sections on native supplier pages. Russian referral defaults are russian_site / b2b_ru; existing explicit attribution stays intact.

Code check, production build, 645-page HTML prelaunch and technical SEO, hosting and 577-page Russian product regression checks passed. Supplier/policy QA: 12 pages, language/schema/metadata, local links/assets, preserved anchors and 14/7-day, 2/7-business-day policy periods passed. Output: 16,830 / 20,000 files. No push or deployment.

## Cases, catalogues and calculator phase (2026-11-18)

Three case pages, the catalogue index, import-cost calculator and 404 page are now Russian. Original visit/order facts, four case photographs and all original PDF destinations are preserved. The catalogue distinguishes PDF row numbers from factory SKUs and identifies original English/Chinese source PDFs. The calculator retains integer-cent arithmetic and USD assumptions, accepts Russian decimal commas, and keeps entered amounts local to the browser.

Validation: Astro check (zero errors/warnings, one existing unused-parameter hint), ESLint, production build, 645-page HTML prelaunch, technical SEO and hosting checks passed. Supplier regression now covers 15 pages. Calculator tests cover defaults, precision, loss, zero revenue, decimal comma, invalid and oversized inputs. Browser checks cover default 445 USD cost / 154 USD profit / 25.7% margin, decimal input, zero revenue, invalid input and reset. Case images load. Calculator, case and catalogue layouts have no horizontal overflow or Arabic visible copy at 390px. Output: 16,826 / 20,000 files.

Remaining: all 28 blog bodies/frontmatter, blog archive/taxonomy labels, RSS and machine-readable buyer guides, remaining shared editorial blocks, then whole-site Russian metadata and language verification. No commit, push or deployment performed.

## Blog procurement guides and discovery phase (2026-11-18)

Seven complete guides migrated: import cost/profit, vehicle fitment, MOQ, RFQ, quote comparison, dry vs wet carbon, and OEM vs aftermarket. Specific R44/CSL references, source links, dates, product images and taxonomy route identifiers retained. MOQ guide explicitly retains 1-unit ordering and 25–30-day production; transport time is separate. All 28 article titles/excerpts/cover alt labels and metadata are Russian, while 21 listicle bodies and ItemList labels remain pending.

Blog navigation, dates, social-share accessibility labels, breadcrumbs, category/tag display labels, 17 archive pages, RSS summaries and llms.txt buyer information migrated. Cost example SVG/WebP was localized in place because its original pixels contained Arabic; numbers and formulas are unchanged. Source paths stay stable. Browser checks cover Russian article/card copy, 390px tables without overflow, blog pagination to /blog/2/, Russian WhatsApp drafts without sending, and dark reading. Development post loading now refreshes content instead of reusing a stale normalized list; the dev content cache was refreshed.

Regression checks: npm run check; production build; 7-guide/17-archive/28-card Russian QA; source date/image/taxonomy preservation; at least 5 body links and 5 recommendations per guide; 28-item Russian RSS and machine-readable guide; cost-content checks for 23 destinations, native inline links and contextual panels; 577 Russian catalogue pages; 15 supplier pages; calculator; 645-page HTML prelaunch, hosting and SEO metadata plan. SEO metadata verification: 645 pages, 628 sitemap entries, 17 excluded. Output: 16,826 / 20,000 files. Restored omitted contextual calculator access on relevant service pages and an inline calculator link on the homepage. No commit, push or deployment.

## Final migration completion (2026-11-18)

Translated the remaining 21 listicles, preserving original item count/order, vehicle/year distinctions, ACC variants, kit sections and every original Markdown source destination. All 28 posts have at least five distinct useful body destinations and at least five recommendations. Article dates, cover paths, authors and taxonomy identifiers are compared with Git source. Each Russian ItemList matches its numbered body headings. Added missing useful body links and restored parent-to-listicle discovery links on categories, brand pages and relevant supplier services. Localized 80 remaining catalogue-image ALT placements across four routes without adding the removed image disclaimers.

Final checks passed: npm run check (zero errors/warnings; existing unused-parameter hint), npm run build, check:products, check:russian-products, check:russian-supplier, check:russian-blog, check:russian-site, check:listicles, check:cost-content, check:prelaunch, check:hosting, check:technical-seo, verify-seo-metadata, check:analytics and check:calculator. Whole-site language audit: 645 public pages, 1,339 JSON-LD blocks and 5,561 WhatsApp link placements; zero Arabic in rendered text, accessibility labels, metadata, schemas, inquiry drafts, RSS or llms.txt. Product QA: 563 unique products; catalogue language QA: 577 pages; supplier/policy QA: 15 pages. Metadata plan: 645 pages, 628 sitemap entries and 17 exclusions. Image sitemap: 617 pages. Hosting: 1,379 redirects and 16,826 / 20,000 files.

Production-preview browser checks: homepage and blog, C63 article, 390px grille/OEM/Porsche listicles without overflow, expected section counts, correctly loaded hero and five lazy recommendation images, natural Russian WhatsApp draft without sending, mobile menu open/close and dark blog appearance. Source commercial promises and non-target materials remain unchanged. Internal source data and CMS admin are outside the public language audit; original PDF documents remain unchanged.

Local work is complete. GitHub push, deployment, live verification and GSC submission remain separate actions; none performed by this migration.

## Russian buyer audit fixes (2026-11-18)

Resolved the eight buyer-audit findings: protective-assembly material errors, engine-cover terminology, е/ё search, filter/back navigation, clearer product facts with unique website reference codes, multi-item RFQ, owner-confirmed procurement information, and functional Russian title modifiers. Real weights, packing measurements, factory SKUs and exact fitment remain quote fields pending source information. Owner-confirmed company/USCC/contact, USD, T/T, Alipay, PayPal, WeChat Pay, air/sea and Russian communication are reflected in visible supplier content and applicable machine-readable information. Commercial promises remain intact.

Passed build and complete npm check; product/buyer fixes; Russian products, supplier, blog and whole-site checks; prelaunch, hosting, technical SEO, metadata, analytics, calculator, cost-content and listicles. Scope: 563 products, 645 public pages, 1,339 JSON-LD blocks, 628 sitemap entries, 617 image-sitemap URLs, 1,379 redirects and 16,827 / 20,000 files. Production-preview browser checks cover 375px mobile, desktop, homepage/blog, mobile menu, dark mode, RFQ quantity validation/persistence/clear/preview, and filter restoration. Fixed overlapping mobile RFQ/WhatsApp controls and kept the dialog close control visible while scrolling. No messages sent, no commit, push or deployment. Local development server refreshed at port 4323.
