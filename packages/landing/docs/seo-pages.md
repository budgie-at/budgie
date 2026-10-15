# SEO Page Architecture

> Read this before authoring or editing any blog article, feature page, pillar hub, legal page, sitemap entry, metadata helper, or JSON-LD helper.
>
> The Lingui i18n contract (`<Trans>` for JSX children, `t(i18n)` for string props, `i18n._()` in metadata/JSON-LD, `initLingui(lang)` at page start) is detailed in `docs/lingui-rsc.md`.

These rules apply uniformly across blog articles, feature pages, pillar hubs, legal pages, the features hub, the blog index, and the home page.

---

## Rules

### 1. Static pages, one file per route

Every SEO landing lives at its own `src/app/[lang]/<route>/page.tsx`. Do not collapse static SEO pages into a dynamic `[slug]/page.tsx`. Adding a page means adding a new route file; deleting a page means deleting the route file.

Blog articles use explicit per-slug folders such as `src/app/[lang]/blog/cloud-budgeting-privacy-risks/page.tsx`. The codebase does not use `src/app/[lang]/blog/[slug]/page.tsx` for articles.

Feature pages use explicit per-slug folders under `src/app/[lang]/features/<slug>/page.tsx`. Pillar hubs use explicit top-level locale folders such as `src/app/[lang]/privacy/page.tsx`.

Legal pages use plain Next.js TSX pages under `src/app/[lang]/legal/<slug>/page.tsx`, not MDX.

### 2. Body content lives in the page that renders it

Per-page visible copy belongs inline in the page as readable JSX composition. This includes hero headings and bullets, section headings, prose, comparison rows, tags, FAQ questions, FAQ answers, CTA copy, and legal text.

Do not put visible body copy in registries, keyed content objects, static string arrays, slug dispatchers, or prop bags whose purpose is to render page-specific content. A reader should be able to grep for visible text and find the route page that renders it.

Use `<Trans>` for JSX text and `t(i18n)` for string props. Do not build fixed static JSX lists by mapping over arrays of strings just to reduce file length.

Visible copy states user outcomes and never names libraries, runtimes, models, database engines, frameworks, file formats, or vendor SDKs — see `AGENTS.md` → "No implementation details in user-facing copy".

### 3. Registries are enumeration and metadata sources only

Registries may exist for listing pages, sitemap generation, related links, and metadata lookup. They must not carry visible body copy, FAQ body copy, hero bullet copy, long-form prose, or per-page rendered content.

Allowed registry fields are stable metadata and relationships:

- `slug`
- dates such as `publishedAt`, `updatedAt`, or `date`
- author, image, reading time, category, tier, keywords, and relationship slugs
- metadata descriptors such as title and description only when they are imported from the page-owned metadata sidecar

Listing pages and sitemap are legitimate enumeration endpoints. Related-content components may consume relationship slugs from metadata aggregators. Route pages must not look up their own entry by a module-level `SLUG` constant; explicit SEO routes import their sibling `metadata.ts` directly and use that object for metadata, dates, related links, and listing-card information.

### 4. Page-owned metadata sidecars

SEO page families use a sibling `metadata.ts` sidecar owned by the route page when metadata would otherwise be centralized in a registry. The sidecar stores page identity, dates, relationship slugs, and `msg` descriptors for metadata and listing-card labels.

Registries and index aggregators import those page-owned sidecars. They do not own page metadata themselves and they never own body content.

Canonical shape:

```text
src/app/[lang]/features/ai-auto-categorization/
  metadata.ts
  page.tsx
```

Blog articles, feature pages, and pillar hubs all follow this shape. A central `ARTICLE_REGISTRY`, `FEATURE_REGISTRY`, or pillar metadata index may aggregate sidecars for lists and sitemap output, but the route page never calls `.find(...)` against that aggregate to rediscover itself.

```ts
import { msg } from '@lingui/core/macro';

export const meta = {
    slug: 'ai-auto-categorization',
    title: msg`AI Auto-Categorization`,
    metaTitle: msg`AI Auto-Categorization — Budgie`,
    metaDescription: msg`Categorize expenses privately with on-device AI.`,
    publishedAt: '2026-01-01',
    updatedAt: '2026-01-01',
    relatedArticleSlugs: ['on-device-ai-budget-app-explainer']
};
```

Resolve descriptors per locale at the page or metadata-helper call site with `getI18nInstance(lang)` and `i18n._()`. Do not resolve descriptors at module scope.

### 5. Composition shells provide chrome only

A page shell may provide repeated structure: layout, breadcrumbs, JSON-LD placement, sticky header, footer, CTA, related-content slots, and common spacing. It may accept explicit metadata and JSX children.

A shell must not branch by slug, look up body content from a registry, choose a page variant from a map, or receive a prop bag that contains page-specific visible copy. If content differs by route, the route page composes that content inline.

### 6. Composition primitives use JSX children

Multi-block SEO content is expressed by composing primitives as children, not by passing arrays of strings or registry-owned content.

Examples:

- Blog sections are composed from `<BlogArticleSection>`, `<BlogArticleHeading>`, `<BlogArticleProse>`, and `<BlogArticleList>` inline in the page.
- Feature benefits are explicit `<FeaturePageBenefitGridItem>` children, not `benefits={[...]}`.
- Breadcrumbs use explicit child components for each crumb, not a `crumbs` array when the crumbs are static.
- FAQ items are page-local JSX children.

Iteration is allowed for runtime or enumerated listing data, such as a blog index rendering `ARTICLE_REGISTRY`, a features hub rendering `FEATURE_REGISTRY`, or sitemap generation. It is not allowed as a way to hide fixed body copy.

### 7. FAQ and JSON-LD share page-local content where possible

FAQ JSON-LD should be generated from the same JSX children that render the visible FAQ when the primitive can walk children and extract translated text. Do not duplicate FAQ arrays in registries.

Feature page breadcrumb JSON-LD is written as explicit JSX in the route page:

```tsx
<FeaturePageBreadcrumbsJsonLd locale={lang} slug={SLUG}>
    <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
    <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
    <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
</FeaturePageBreadcrumbsJsonLd>
```

The component generates the `BreadcrumbList` script from its child items. Pair it with `<FeaturePageWebPageJsonLd ... />` for the page-level `WebPage` schema. Do not rebuild feature page schema with a `buildFeaturePageJsonLd({ ... })` object helper.

Pillar hub JSON-LD follows the same rule: prefer typed JSX schema components that receive already-resolved strings over `buildPillarHubJsonLd({ ... })`-style object builders hidden inside a shell. A shell may place schema components and repeated chrome, but the route still owns the page metadata and body composition.

If a current JSON-LD helper still requires resolved strings, keep the duplicate data local to the page or its metadata sidecar during migration; do not move FAQ bodies into a registry.

All JSON-LD utilities receive already-resolved strings or parse page-local JSX children. Pages resolve descriptors through `i18n._()` after `initLingui(lang)`.

### 8. Lingui and metadata safety

Every page default export reads `lang` from params and calls `initLingui(lang)` before returning JSX, unless a full-page shell owns the entire render and calls it internally.

`generateMetadata` runs outside the React render tree, so it uses `getI18nInstance(lang)` directly. Resolve page-owned metadata descriptors with `i18n._(meta.metaTitle)` / `i18n._(meta.metaDescription)`, or use `t(i18n)` / `msg` for page-local metadata strings.

Static pages and metadata remain SSG-safe by default. Do not read request headers, cookies, host, or other runtime context from static SEO pages, metadata helpers, registries, or sitemap helpers unless the route explicitly requires runtime behavior and declares the correct Next.js dynamic/caching setting.

### 9. Legal pages

Legal pages are TSX route pages in the same explicit JSX style as other SEO pages. They are not MDX, are not registry entries, and are not enumerated in `sitemap.ts`.

The legal layout currently sets `robots: 'noindex, follow'`; document and preserve that wording unless the code source of truth changes.

### 10. Sitemap and listing pages

`src/app/sitemap.ts` enumerates page metadata through registries or index aggregators. Static pages without a registry entry may use a small hand-written sitemap list for route path and `lastModified`.

Listing pages are the legitimate consumers of family registries:

- `src/app/[lang]/blog/page.tsx` may iterate article metadata.
- `src/app/[lang]/features/page.tsx` may iterate feature metadata.
- Home page sections may consume listing-card metadata when they are showing a real index preview.

Do not rebuild page body content from registries in listing components.

### 11. OG image on every SEO route

Every `page.tsx` SEO route (feature page, blog article, hub) must ship a sibling `opengraph-image.tsx`. Build it with the shared OG image builders (`createFeatureOgImage` / `createBlogOgImage`) instead of hand-rolling a new OG renderer; both render the single `OgCard` composition in `src/generic/component/og-card`, which composites a locale-matched dark device plate from `resolveOgPlate(mediaSlug, lang)` and falls back to the text-only card when the slug has no capture. OG images are for social sharing only: on-site blog artwork (card thumbnails and the article hero) is rendered by `BlogCover`, which derives a deterministic accent hue, motif family, and composition from the article slug and tags, and peeks a framed product still resolved from `relatedFeatureSlugs` through `resolveArticleShot`. Never point an on-site `<Image>` at an `opengraph-image` route.

The metadata builders never set `openGraph.images` / `twitter.images` — config-based images override file-based conventions, and the file must own `og:image`. When a route has no file yet, the root layout's static fallback applies.

App icons are generated via `src/app/icon.tsx` + `src/app/apple-icon.tsx`. Never commit binary icon variants next to them.

### 12. Feature-page scroll stories

A feature page carries at most one `FeatureStory`, with **2–5 steps** (steps variant) or **one shot plus 2–4 points** (basic variant). Step titles, value copy, and callout labels are inline `<Trans>` in the route page; `alt` uses `t(i18n)`. Passing steps as `steps={[…]}`, as a registry field, or as any array of copy is prohibited — it is the same violation as §2 and §6.

Prefer staged stills over motion: build a step out of `FeatureStory.Shot` scenes the scroll swaps whenever the manifest carries stills for the scene, and reach for `FeatureStory.Clip` only when the interaction cannot be told in framed screenshots. Stills carry the device frame baked in by `compose-web-media.sh`; clip media is screen-only and the site draws the same frame around it at render time through `.device-frame`, so `compose-web-clips.sh` must never bake a frame into clip media — MP4 has no alpha channel to carry the frame's transparent surround.

Scene ids, `slug`, `locale`, and callout coordinates are page-local literals. They never enter `metadata.ts` or the feature registry; the allowed registry field list is unchanged.

A callout is a numbered dot on the screenshot plus a label rendered **outside** the frame — never a band or pill over app pixels. `y` is the dot's vertical centre as a fraction of the framed screenshot height; the optional `x` is the same fraction horizontally and defaults to the device's right edge, so the dot marks a row without covering content. Keep labels to six words: they sit beside the frame on desktop (alternating sides from 1280px, right-hand side below that, joined by a hairline leader drawn outside the device bounds) and in a numbered caption rail under the frame on mobile. Numbering is a CSS counter, so callout order in the page is the only source of truth. Never use pixel coordinates.

The stage is pinned on every viewport: sticky and top-aligned under the header on mobile with the step copy scrolling in the band beneath it, sticky beside the copy column on desktop. Shots crossfade per active step, parallax and the progress rail run on `animation-timeline` where supported and on one passive scroll listener writing `--story-progress` where it is not, and `prefers-reduced-motion` keeps the crossfade only.

The story renders a server compound root; only its inner observer island is `"use client"`, it renders `{children}`, and it holds no translatable text, so every step string stays server-rendered in the SSG'd HTML for all five locales. `FeaturePageMedia` is retained only for a supplementary single shot; a page with a story does not also open with a `FeaturePageMedia` hero shot, and it drops its "How it works" prose section.

Reference implementation: `src/app/[lang]/features/net-worth-tracker/page.tsx`.

i18n authoring contract, callout anchor measurement across locales, and the locale QA checklist to run before merging a story page: `docs/feature-story-i18n-qa.md`.

### 13. Metadata char budgets

Titles must fit 60 characters including the ` | Budgie` template suffix; descriptions must fit 160 characters. The `fitText` util (`src/generic/utils/fit-text.util.ts`) is applied inside the metadata builders, so page copy in `metadata.ts` sidecars may be longer — the builder clamps it. Do not add per-page clamping logic.

### 14. Alternatives and switch-from pages

Two explicit page families target people leaving another app. Both are allowed; both obey rules 1-8 and 13.

Routes, one folder per page, never `[slug]`:

```text
src/app/[lang]/alternatives/<competitor>/{page.tsx,metadata.ts,opengraph-image.tsx}
src/app/[lang]/switch-from/<app>/{page.tsx,metadata.ts,opengraph-image.tsx}
```

- `alternatives/<competitor>` answers "alternative to X": a fair comparison for someone still choosing.
- `switch-from/<app>` answers "move from X to Budgie": a migration guide for someone who has decided. It exists only for apps whose export Budgie can import.
- The folder name is the lowercase kebab-case product name and is the page's `slug`. An app may have both pages; they link to each other.
- `alternatives/page.tsx` and `switch-from/page.tsx` are listing hubs. They may iterate the family registry, never render body copy from it.

Metadata, registry, sitemap:

- Each page owns a sibling `metadata.ts` with `slug`, `title`, `metaTitle`, `metaDescription`, `publishedAt`, `updatedAt`, `relatedFeatureSlugs`, `relatedArticleSlugs` and `verifiedAt` (ISO date of the last competitor-claim check). No claim text lives in the sidecar.
- Two metadata-only aggregators, `ALTERNATIVE_REGISTRY` and `SWITCH_FROM_REGISTRY`, import the sidecars. A route never looks itself up in them.
- `src/app/sitemap.ts` includes both families and both hubs in every locale with `lastModified: meta.updatedAt`, and `buildAlternates(lang, path)` supplies the hreflang set. A page that is not yet publishable (see the publication gate) has no route file, no sidecar import and no sitemap entry: gate by not merging the page, never by `noindex` or a runtime flag.
- Metadata is built with `buildFeaturePageMetadata`-style website Open Graph and alternates; do not add a new helper unless the existing one cannot express the page.

JSON-LD: `WebPage` and `BreadcrumbList` (Home, the family hub, the page) as typed JSX schema components. `FAQPage` only when the page renders a visible FAQ written from real user questions, generated from the same JSX children (rule 7). Never emit `Review`, `AggregateRating`, `Product` ratings or any rating markup about a competitor or about Budgie.

Required sections, as inline JSX in the route page (rule 2):

1. Who this page is for: who should stay with the competitor and who should consider Budgie.
2. Honest comparison table: rows are user-visible capabilities, with at least one row where the competitor wins or ties. Cells state facts, not adjectives. Build the table from explicit row children, not an array of strings.
3. Switching steps (`switch-from` always; `alternatives` only when an import preset for that app exists): numbered steps that match the shipped import flow, verified in `packages/app` (cite `file:line` in the PR).
4. Data and privacy: where the user's data lives in each product, stated as an outcome.
5. Bottom CTA via the shared page CTA primitive.

Competitor-claim rule:

- Every statement about a competitor (features, pricing, limits, platforms, bank coverage, privacy, shutdowns) needs a public source. The PR description lists, per claim, the source URL and the access date. Sources are the competitor's own pages, store listings, help centre or changelog; third-party reviews are acceptable only as a second source.
- No pricing claim without a source cited in the PR. Prefer "free tier available" to a number; if a price is shown, the page says when it was checked via `meta.verifiedAt`.
- Every claim about Budgie is verified in code per the landing standard (PR cites `packages/app` `file:line`).
- Tone is fair, factual and non-disparaging. No superlatives about the competitor, no speculation about their intent, no claim that cannot be checked by a reader. Name a competitor only to identify it; use its name in plain text, never its logo, never styling that implies affiliation or endorsement, and add the short disclaimer that the product is not affiliated with Budgie.
- Re-verify every claim at least every 6 months. `meta.verifiedAt` is the clock: when it is older than 6 months the page is stale; refresh it or remove the unverifiable claims, and bump `updatedAt` in the same PR. A claim that cannot be re-verified is deleted, not softened.
- Do not claim Revolut, Wise or Coinbase sync, and describe only integrations that exist (see rule 2 and `AGENTS.md`).

Publication gate:

- `alternatives/*` pages and their hub are merged only once the App Store badge (#1149) is live, because the page's call to action must lead to an install.
- `switch-from/*` pages may be published earlier: they serve people who already chose Budgie and need the import steps. Their CTA uses whichever store badges are live.
- Angle for both families: privacy, on-device data, and bank sync for Ukraine and the EU. Do not invent other angles.

---

## Canonical page shapes

### Blog articles

Path: `src/app/[lang]/blog/<slug>/page.tsx`

Blog articles are self-contained server components. They import their sibling `metadata.ts`, call `initLingui(lang)`, render the full article body inline, and use shared primitives only for structure.

```tsx
/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { meta } from './metadata';
import { buildBlogArticleMetadata } from '../../../../blog/utils/build-blog-article-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: meta.author,
        date: meta.date,
        description: i18n._(meta.metaDescription),
        image: meta.image,
        keywords: meta.seoKeywords.join(', '),
        locale: lang,
        slug: meta.slug,
        title: i18n._(meta.metaTitle)
    });
}

export default async function SomeArticlePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    return (
        <main className="flex-1">
            <BlogPostingJsonLd
                author={meta.author}
                date={meta.date}
                description={i18n._(meta.metaDescription)}
                image={meta.image}
                locale={lang}
                slug={meta.slug}
                title={i18n._(meta.title)}
            />
            <BlogArticleHero article={ARTICLE_METADATA} locale={lang}>
                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}>
                        <Trans>Home</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}>
                        <Trans>Blog</Trans>
                    </BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}>
                        <Trans>Article Title</Trans>
                    </BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>
                <h1>
                    <Trans>Article Title</Trans>
                </h1>
            </BlogArticleHero>
            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading>
                        <Trans>Section heading</Trans>
                    </BlogArticleHeading>
                    <BlogArticleProse>
                        <Trans>Paragraph text.</Trans>
                    </BlogArticleProse>
                </BlogArticleSection>
            </BlogArticleContent>
        </main>
    );
}
```

Key points:

- The page imports `meta` from `./metadata`.
- The body is readable JSX in the route file.
- Related links may use registry relationship slugs from `meta`.
- `opengraph-image.tsx` is an optional sibling for custom OG images.

### Feature pages

Path: `src/app/[lang]/features/<slug>/page.tsx`

Feature pages follow the same sidecar pattern. Metadata, listing-card labels, dates, and relationship slugs live in `metadata.ts`; visible feature copy and FAQ bodies stay inline in `page.tsx`.

The route passes related feature slugs from its sidecar metadata into the related-links component:

```tsx
<FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
```

It must not render feature body copy from `FEATURE_REGISTRY`.

### Pillar hub pages

Path: `src/app/[lang]/<slug>/page.tsx`

Pillar hubs are explicit route pages. If a shell is used, the route page still owns the unique visible body copy as JSX children or imports a page-specific body component from the same route family. Do not put hero bullets, FAQ bodies, or rendered sections in `PILLAR_HUB_REGISTRY`.

Registry/index aggregation remains useful for:

- sitemap enumeration
- member feature slugs
- related links
- metadata imported from the page-owned sidecar

### Legal pages

Path: `src/app/[lang]/legal/<slug>/page.tsx`

Legal pages are plain TSX server pages. They call `initLingui(lang)`, render legal copy with `<Trans>`, and inherit legal layout metadata unless a page-specific metadata helper is needed. They stay out of registries and out of the sitemap.

---

## Metadata helpers

One helper per page family may build the final `Metadata` object. Helpers should accept route-local metadata and resolved locale values, not reach into body-content registries.

| Helper                     | File                                                    | Accepts                                                    | Notes                                  |
| -------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `buildBlogArticleMetadata` | `src/blog/utils/build-blog-article-metadata.util.ts`    | page-owned meta values, resolved title/description, locale | sets article Open Graph and alternates |
| `buildFeaturePageMetadata` | `src/feature/utils/build-feature-page-metadata.util.ts` | page-owned meta values, resolved title/description, locale | sets website Open Graph and alternates |
| `buildPillarHubMetadata`   | `src/feature/utils/build-pillar-hub-metadata.util.ts`   | page-owned meta values, resolved title/description, locale | same metadata shape as feature pages   |

For layout, home page, blog index, features hub, and legal layout, `generateMetadata` may remain direct when each has a unique shape. Direct metadata still uses `getI18nInstance(lang)` and `i18n._()` / `t(i18n)`.

All metadata helpers call `buildAlternates(locale, path)` internally when practical. For pages that build metadata directly, call `buildAlternates(lang, '/path')` directly.

---

## JSON-LD utilities

| Utility or primitive                     | Emits                                                     |
| ---------------------------------------- | --------------------------------------------------------- |
| `buildLandingJsonLd(i18n)`               | `SoftwareApplication` + `FAQPage` for the home page       |
| Feature page JSON-LD helper or component | `BreadcrumbList`, `WebPage`, optional `FAQPage`           |
| Pillar hub JSON-LD helper or component   | `BreadcrumbList`, `WebPage`, optional `FAQPage`           |
| `BlogPostingJsonLd`                      | `BlogPosting` + `BreadcrumbList`                          |
| FAQ compound primitive                   | visible FAQ + `FAQPage` from JSX children where supported |

JSON-LD is injected via `<JsonLd data={...} />` from `src/generic/component/json-ld/json-ld.tsx`. Never inline `<script type="application/ld+json">` by hand.

Prefer component primitives that parse JSX children for FAQ and other repeated visible schema data. If a helper still accepts arrays, keep the arrays page-local until the helper can be migrated.

---

## Registry entry shapes

Registry interfaces should shrink toward metadata-only entries imported from page sidecars.

### Article metadata entry

Allowed fields:

- `slug`
- `date`
- `author`
- `image`
- `readingTimeMinutes`
- `title`
- `description`
- `metaTitle`
- `metaDescription`
- `tags`
- `seoKeywords`
- `relatedFeatureSlugs`

### Feature metadata entry

Allowed fields:

- `slug`
- `tier`
- `category`
- `title`
- `tagline`
- `metaTitle`
- `metaDescription`
- `primaryKeyword`
- `seoKeywords`
- `relatedFeatureSlugs`
- `relatedArticleSlugs`
- `publishedAt`
- `updatedAt`
- `ogTags`

Not allowed in the registry:

- FAQ question or answer bodies
- comparison rows rendered on a specific page
- benefit cards
- hero bullets
- section prose
- CTA body copy

### Pillar hub metadata entry

Allowed fields:

- `slug`
- `title`
- `tagline`
- `metaTitle`
- `metaDescription`
- `primaryKeyword`
- `seoKeywords`
- `memberFeatureSlugs`
- `publishedAt`
- `updatedAt`

Not allowed in the registry:

- hero bullets
- FAQ question or answer bodies
- rendered section content

---

## Sitemap

`src/app/sitemap.ts` is the single sitemap for the landing package. It may iterate metadata-only registries plus a hand-written static-page list.

| Entry type                                | Source                                                     | `lastModified`           |
| ----------------------------------------- | ---------------------------------------------------------- | ------------------------ |
| Static pages (`''`, `/blog`, `/features`) | static sitemap constant or hand-written list               | page-owned date constant |
| Blog articles                             | article metadata sidecars via registry/index aggregator    | `meta.date`              |
| Feature pages                             | feature metadata sidecars via registry/index aggregator    | `meta.updatedAt`         |
| Pillar hub pages                          | pillar hub metadata sidecars via registry/index aggregator | `meta.updatedAt`         |
| Alternatives pages and hub                | alternative metadata sidecars via `ALTERNATIVE_REGISTRY`   | `meta.updatedAt`         |
| Switch-from pages and hub                 | switch-from sidecars via `SWITCH_FROM_REGISTRY`            | `meta.updatedAt`         |

When you add a new SEO page:

1. Create the route page.
2. Create the sibling `metadata.ts` sidecar when the family uses registry/index enumeration.
3. Import the sidecar into the relevant registry/index aggregator.
4. Keep body copy in the route page.
5. Run `pnpm i18n:sync` after changing visible or metadata strings.

`SITEMAP_STATIC_LAST_MODIFIED` (`src/generic/constant/sitemap-last-modified.constant.ts`) must be updated manually when the corresponding static page is meaningfully changed.

---

## SEO primitive reference

Check this list before authoring a new SEO component.

### Blog article primitives

| Concern                              | Primitive                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Article hero block                   | `BlogArticleHero article locale` + children                                                        |
| Breadcrumb trail                     | `BlogBreadcrumbs` + `BlogBreadcrumbLink href position` + `BlogBreadcrumbCurrent position` children |
| Article metadata                     | `BlogArticleMeta date author locale readingTimeMinutes tags`                                       |
| Content wrapper                      | `BlogArticleContent`                                                                               |
| Thematic section                     | `BlogArticleSection`                                                                               |
| H2 section heading                   | `BlogArticleHeading`                                                                               |
| H3 subheading                        | `BlogArticleSubheading`                                                                            |
| Body paragraph                       | `BlogArticleProse`                                                                                 |
| Ordered or unordered list            | `BlogArticleList ordered?` + `BlogArticleListItem` children                                        |
| FAQ section                          | `BlogFaqSection` + `BlogFaqItem question` children                                                 |
| Related articles row                 | `RelatedArticles locale slugs`                                                                     |
| Related feature cards                | `FeaturePageRelated features locale`                                                               |
| Bottom CTA                           | `BlogArticleCta locale`                                                                            |
| BlogPosting + BreadcrumbList JSON-LD | `BlogPostingJsonLd`                                                                                |

### Feature page primitives

| Concern                     | Primitive                                                               |
| --------------------------- | ----------------------------------------------------------------------- |
| Feature hero                | `FeaturePageHero breadcrumbs heading tagline locale`                    |
| Breadcrumb trail            | `FeatureBreadcrumbs current locale`                                     |
| Content section             | `FeaturePageSection`                                                    |
| H2 section heading          | `FeaturePageHeading`                                                    |
| Body paragraph              | `FeaturePageProse`                                                      |
| Benefit grid                | `FeaturePageBenefitGrid` + `FeaturePageBenefitGridItem index` children  |
| Competitor comparison table | `FeaturePageComparisonTable rivalLabel rows`                            |
| Comparison category section | `FeaturePageCategoryComparison` + `FeaturePageComparisonShell`          |
| FAQ section                 | `FeaturePageFaqSection` + `FeaturePageFaqItem question answer` children |
| Related feature cards       | `FeaturePageRelated features locale`                                    |
| Related blog articles       | `FeaturePageRelatedArticles locale slugs`                               |
| Bottom CTA                  | `FeaturePageCta locale`                                                 |
| Scroll story wrapper        | `FeatureStory` (compound root; the observer island carries no strings)  |
| Story heading + lede        | `FeatureStory.Intro heading` + children                                 |
| Narration step              | `FeatureStory.Step index title` + children                              |
| Sticky screenshot           | `FeatureStory.Shot index slug scene locale alt priority` + callouts     |
| Sticky motion clip          | `FeatureStory.Clip index slug scene locale alt` + callouts              |
| Screenshot highlight        | `FeatureStory.Callout y x index` + children                             |
| Basic-variant bullet        | `FeatureStory.Point index` + children                                   |

### Generic primitives

| Concern                | Primitive                            |
| ---------------------- | ------------------------------------ |
| JSON-LD script tag     | `JsonLd data`                        |
| Site-wide OG image     | `src/app/[lang]/opengraph-image.tsx` |
| Alternates + canonical | `buildAlternates(lang, path)` util   |

---

## When extending

- Adding a new blog article: create `src/app/[lang]/blog/<slug>/page.tsx`, create sibling `metadata.ts`, import the sidecar into the article registry/index aggregator, and optionally add `opengraph-image.tsx`.
- Adding a new feature page: create `src/app/[lang]/features/<slug>/page.tsx`, create sibling `metadata.ts`, import the sidecar into the feature registry/index aggregator, compose a `FeatureStory` with 2–5 steps referencing only scene ids present in the generated media manifest, and optionally add `opengraph-image.tsx`.
- Adding a new pillar hub: create `src/app/[lang]/<slug>/page.tsx`, create sibling metadata if the family is enumerated, and keep visible hub copy in the page or a page-owned explicit JSX component.
- Adding an alternatives or switch-from page: follow rule 14. Create the explicit folder with `page.tsx`, `metadata.ts` (including `verifiedAt`) and `opengraph-image.tsx`, import the sidecar into the family registry, list per-claim sources and access dates in the PR, and respect the publication gate.
- Adding a new legal page: create `src/app/[lang]/legal/<slug>/page.tsx`; do not add it to a registry or sitemap.
- Adding a new SEO concern: build a primitive component and have pages compose it as children. Do not bolt body-copy prop bags onto existing wrappers.
- Interactive widgets such as accordion, scroll sentinel, and search belong in client islands rendered inside server primitives. Keep `"use client"` off the page and off structural primitives.
- After any visible text or metadata descriptor change: run `pnpm i18n:sync` and commit both `.po` and compiled `.ts` locale files.
