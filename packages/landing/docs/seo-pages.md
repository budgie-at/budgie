# SEO Page Architecture

> Read this before authoring or editing any blog article, feature page, pillar hub, legal page, the sitemap, or any metadata/JSON-LD helper.
>
> The Lingui i18n contract (`<Trans>` for JSX children, `t(i18n)` for string props, `i18n._()` in metadata/JSON-LD, `initLingui(lang)` at page start) is detailed in `docs/lingui-rsc.md`.

Eight rules, applied uniformly across blog articles, feature pages, pillar hubs, legal pages, the features hub, the blog index, and the home page.

---

## Rules

### 1. Static pages, one file per route

Every SEO landing lives at its own `src/app/[lang]/<route>/page.tsx`. NEVER collapse N routes into a dynamic `[slug]/page.tsx`. Adding a new page means adding a new file; deleting one means deleting the file.

The legitimate enumeration endpoints are:
- `src/app/[lang]/blog/page.tsx` — iterates `ARTICLE_REGISTRY`
- `src/app/[lang]/features/page.tsx` — delegates to `FeaturesHubGrid` which iterates `FEATURE_REGISTRY`
- `src/app/sitemap.ts` — iterates all three registries to build the sitemap

No other component may iterate the registries. Per-page slug lookups (`getFeatureBySlug(SLUG)`, `ARTICLE_REGISTRY.find(...)`) are permitted inside their own page file.

**Blog articles do NOT use `app/[lang]/blog/[slug]/page.tsx`.** Each article is its own folder under `app/[lang]/blog/<slug>/page.tsx`. The `[slug]` directory in `AGENTS.md` is a stale description — the real codebase uses explicit per-slug folders (see `src/app/[lang]/blog/budgie-offline-financial-data/`, etc.).

### 2. Data lives in the page that uses it

Per-page body copy — section headings, prose paragraphs, comparison table rows, tag badges, FAQ answers — is declared inline in the page using `<Trans>` for JSX children and `t(i18n)` for string props. NEVER put visible body copy in a registry entry or a keyed content map.

Registry entries hold only metadata that the sitemap, listing pages, and `generateMetadata` need: slug, dates, `MessageDescriptor` for title/description, keywords, and cross-reference slugs. They do not hold rendered body content.

### 3. Composition shells, not dispatcher prop-bags

A page shell is allowed when it accepts `locale` + `slug` (or explicit props) and renders structural scaffolding identically across every page in the family. The shell must not branch on a discriminator to select different JSX trees. `PillarHubPageShell` is the canonical example — it reads its entry from `PILLAR_HUB_REGISTRY` by slug and renders hero, feature grid, FAQ, and JSON-LD without any `switch` on slug-specific content.

Feature pages and blog articles do NOT use a shared shell because their body content is unique. Each page composes its own `FeaturePageSection` / `BlogArticleSection` blocks inline. The shared primitives (listed in the primitive reference below) provide the structural atoms.

**Still banned**: shells that accept a body-part-style discriminator and dispatch to per-page JSX; prop bags that carry body copy as strings.

### 4. Composition primitives via JSX children, not string props

Multi-block content is expressed by composing primitive components as children, not by passing string arrays as props. Examples:

- FAQ answers live inside `<FeaturePageFaqItem question={<Trans>…</Trans>} answer={<Trans>…</Trans>} />` — inline in the page, NOT as `i18n._(entry.faqs[n].answer)` rendered from the registry.
- Blog sections are composed from `<BlogArticleSection>`, `<BlogArticleHeading>`, `<BlogArticleProse>`, `<BlogArticleList>` — inline in the page, NOT iterated from a data array.
- `<FeaturePageBenefitGrid>` receives explicit `<FeaturePageBenefitGridItem>` children, not a `benefits={[…]}` prop.
- `<BlogBreadcrumbs>` receives `<BlogBreadcrumbLink>` and `<BlogBreadcrumbCurrent>` children — one explicit instance per crumb, not a `crumbs={[…]}` array.

The one valid use of `.map()` in page JSX is `FeaturesHubGrid` and related listing components that receive variable-length data from a registry at render time.

### 5. `generateMetadata` resolves strings with `i18n._()` using `getI18nInstance`

`generateMetadata` runs outside a React render tree and before `initLingui(lang)` is called. Each metadata function resolves the locale instance directly:

```ts
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}
```

For pages without a registry entry (blog articles, the features hub, the blog index), use `t(i18n)\`…\`` as a tagged template call inside `generateMetadata`.

### 6. Pages call `initLingui(lang)` as their first render statement

Every page default export calls `initLingui(lang)` before returning any JSX. The layout's `initLingui` call does NOT propagate into nested page render trees. See `docs/lingui-rsc.md` for the RSC contract.

```ts
export default async function SomeFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);    // must be first
    // …
}
```

For pillar hub pages, `initLingui` is called inside `PillarHubPageShell` (which is the entire render body), so the route page does not call it separately.

### 7. The registries are the only enumeration endpoints consumed by listing pages and the sitemap

`ARTICLE_REGISTRY`, `FEATURE_REGISTRY`, and `PILLAR_HUB_REGISTRY` are each the single source of truth for their page family. Adding a new page means:

1. Add the entry to the relevant registry (`ARTICLE_REGISTRY` / `FEATURE_REGISTRY` / `PILLAR_HUB_REGISTRY`).
2. Create the `page.tsx` file at the correct path.
3. The sitemap picks it up automatically on next build.

Removing a page means removing the registry entry AND the `page.tsx` file. Orphaned `page.tsx` files (present in the filesystem but missing from the registry) will not appear in the sitemap or listing pages but will still be crawled — always remove both.

### 8. Legal pages are MDX, noindexed, and not in any registry

Legal pages live at `src/app/[lang]/legal/<slug>/page.mdx`. The shared `src/app/[lang]/legal/layout.tsx` sets `robots: 'noindex, nofollow'` for all of them. Legal pages are not added to any registry and are not enumerated in `sitemap.ts`. They inherit the layout's metadata; they do not export their own `generateMetadata`.

---

## Page families and their canonical shapes

### Home page — `src/app/[lang]/page.tsx`

- Renders a sequence of section components; no registry lookups.
- `generateMetadata` uses `{ absolute: i18n._(msg\`…\`) }` to override the layout title template.
- JSON-LD: `SoftwareApplication` + `FAQPage` from `buildLandingJsonLd(i18n)`.
- `buildLandingJsonLd` is in `src/generic/util/build-landing-json-ld.util.ts`.

### Blog articles — `src/app/[lang]/blog/<slug>/page.tsx`

There are currently 11 articles under `src/app/[lang]/blog/`. Each is a self-contained server component of 300–1000 lines.

Canonical shape:

```tsx
/* eslint-disable max-lines, max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { ARTICLE_REGISTRY } from '../../../../blog/constant/article-registry.constant';
import { buildBlogArticleMetadata } from '../../../../blog/util/build-blog-article-metadata.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
// …blog primitive imports…

const SLUG = 'some-article-slug';
const DATE = '2025-01-01';
// eslint-disable-next-line lingui/no-unlocalized-strings
const AUTHOR = 'Budgie Team';
const IMAGE = '/images/design-mode/ai-budgeting-app-4x.jpg';
const READING_TIME = 10;

export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildBlogArticleMetadata({
        author: AUTHOR,
        date: DATE,
        description: t(i18n)`…`,
        image: IMAGE,
        keywords: t(i18n)`keyword one, keyword two`,
        locale: lang,
        slug: SLUG,
        title: t(i18n)`Article Title`
    });
}

export default async function SomeArticlePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    // optional: look up related features from FEATURE_REGISTRY
    const articleEntry = ARTICLE_REGISTRY.find(item => item.slug === SLUG);
    const relatedFeatures = articleEntry?.relatedFeatureSlugs
        .map(slug => FEATURE_REGISTRY.find(f => f.slug === slug))
        .filter(isDefined) ?? [];

    return (
        <main className="flex-1">
            <BlogPostingJsonLd … />
            <BlogArticleHero image={IMAGE} imageAlt={t(i18n)`…`}>
                <BlogBreadcrumbs>
                    <BlogBreadcrumbLink href={`/${lang}`} position={1}><Trans>Home</Trans></BlogBreadcrumbLink>
                    <BlogBreadcrumbLink href={`/${lang}/blog`} position={2}><Trans>Blog</Trans></BlogBreadcrumbLink>
                    <BlogBreadcrumbCurrent position={3}><Trans>Article Title</Trans></BlogBreadcrumbCurrent>
                </BlogBreadcrumbs>
                <h1 className="…"><Trans>Article Title</Trans></h1>
                <BlogArticleMeta date={DATE} author={AUTHOR} locale={lang} readingTimeMinutes={READING_TIME} tags={<>…</>} />
            </BlogArticleHero>
            <BlogArticleContent>
                <BlogArticleSection>
                    <BlogArticleHeading><Trans>Section heading</Trans></BlogArticleHeading>
                    <BlogArticleProse><Trans>Paragraph text…</Trans></BlogArticleProse>
                </BlogArticleSection>
                {/* … more sections … */}
                <BlogArticleSection>
                    <BlogArticleHeading><Trans>Frequently Asked Questions</Trans></BlogArticleHeading>
                    <BlogFaqSection>
                        <BlogFaqItem question={<Trans>Q?</Trans>}>
                            <Trans>Answer text.</Trans>
                        </BlogFaqItem>
                    </BlogFaqSection>
                </BlogArticleSection>
            </BlogArticleContent>
            <RelatedArticles locale={lang} slugs={RELATED_SLUGS} />
            <FeaturePageRelated features={relatedFeatures} locale={lang} />
            <BlogArticleCta locale={lang} />
        </main>
    );
}
```

Key points:
- `SLUG`, `DATE`, `AUTHOR`, `IMAGE`, `READING_TIME` are module-level constants.
- Title and description strings are duplicated between `generateMetadata` and `BlogPostingJsonLd` — this is intentional; metadata and JSON-LD are separate concerns.
- `/* eslint-disable max-lines, max-lines-per-function */` at the top is expected for content-heavy pages.
- `opengraph-image.tsx` is an optional sibling for custom OG images; not all articles have one.

### Feature pages — `src/app/[lang]/features/<slug>/page.tsx`

There are currently 50+ feature pages under `src/app/[lang]/features/`. Each reads its entry from `FEATURE_REGISTRY` by a module-level `SLUG` constant.

Canonical shape:

```tsx
/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

// feature primitive imports…
import { buildFeaturePageJsonLd } from '../../../../feature/util/build-feature-page-json-ld.util';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

const SLUG = 'some-feature-slug';

export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) { return {}; }

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function SomeFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) { return null; }

    const related = getRelatedFeatures(SLUG);
    const [breadcrumbSchema, webPageSchema, faqSchema] = buildFeaturePageJsonLd({
        locale: lang, slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: i18n._(msg`Features`),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={lang} />}
                heading={<Trans>Feature heading</Trans>}
                tagline={<Trans>Feature tagline</Trans>}
                locale={lang}
            />
            <FeaturePageSection>
                <FeaturePageHeading><Trans>Section heading</Trans></FeaturePageHeading>
                <FeaturePageProse><Trans>Body paragraph…</Trans></FeaturePageProse>
            </FeaturePageSection>
            {/* benefit grid, comparison table, more sections… */}
            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>Question?</Trans>}
                    answer={<Trans>Answer.</Trans>}
                />
            </FeaturePageFaqSection>
            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />
            <FeaturePageCta locale={lang} />
        </main>
    );
}
```

Note: FAQ text in the page JSX must be authored inline with `<Trans>` and match the FAQ text stored in the registry entry (which is used for JSON-LD). They are the same human-readable string appearing in two places because metadata/JSON-LD and visible JSX are separate.

### Pillar hub pages — `src/app/[lang]/<slug>/page.tsx`

Pillar hubs live at top-level locale paths (`/privacy`, `/offline-first`, `/ai-features`, `/security`, `/open-source`). Current slugs: `privacy`, `offline-first`, `ai-features`, `security`, `open-source`. Their entries are in `PILLAR_HUB_REGISTRY`.

Canonical shape (pillar hub pages are thin because `PillarHubPageShell` owns the render):

```tsx
const SLUG = 'privacy';

export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getPillarHubBySlug(SLUG);
    if (!isDefined(entry)) { return {}; }

    return buildPillarHubMetadata({
        locale: lang, slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function PrivacyPillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;
    return <PillarHubPageShell locale={lang} slug={SLUG} />;
}
```

`PillarHubPageShell` resolves the entry, calls `initLingui`, renders the hero, feature card grid, FAQ section, and JSON-LD. All visible text inside the shell comes from the registry entry's `MessageDescriptor` fields resolved via `i18n._()` — this is the only page family where body text lives partly in the registry (because pillar hubs have a fixed, low-variance structure).

The special case: when `slug === 'open-source'`, the shell renders `<OpenSourcePillarHubContent />` in addition to the standard feature grid.

### Listing pages — blog index and features hub

`src/app/[lang]/blog/page.tsx` and `src/app/[lang]/features/page.tsx` are the only non-registry files that iterate `ARTICLE_REGISTRY` and `FEATURE_REGISTRY` respectively. They render listing grids and emit breadcrumb JSON-LD. Neither uses a metadata helper — both build `Metadata` objects directly with `buildAlternates`.

### Legal pages — `src/app/[lang]/legal/<slug>/page.mdx`

Three pages: `privacy-policy`, `terms-of-service`, `license`. Written in MDX, rendered inside `src/app/[lang]/legal/layout.tsx`. The layout sets `robots: 'noindex, nofollow'`. Do not add legal pages to `sitemap.ts`.

---

## Metadata helpers

One helper per page family. Pages collapse `generateMetadata` to a one-liner call.

| Helper | File | Accepts | Sets |
|---|---|---|---|
| `buildBlogArticleMetadata` | `src/blog/util/build-blog-article-metadata.util.ts` | `{ locale, slug, title, description, keywords, image?, date, author }` | title, description, keywords, authors, alternates, openGraph (type=article, publishedTime), twitter |
| `buildFeaturePageMetadata` | `src/feature/util/build-feature-page-metadata.util.ts` | `{ locale, slug, title, description, keywords, image?, publishedAt, updatedAt }` | title, description, keywords, alternates, openGraph (type=website), twitter, other (article:published_time, article:modified_time) |
| `buildPillarHubMetadata` | `src/feature/util/build-pillar-hub-metadata.util.ts` | `{ locale, slug, title, description, keywords, image?, publishedAt, updatedAt }` | same shape as `buildFeaturePageMetadata` |

All three helpers call `buildAlternates(locale, path)` internally. `buildAlternates` is in `src/generic/util/build-alternates.util.ts`.

For the layout, home page, blog index, features hub, and legal layout — `generateMetadata` is written directly without a helper because each has a unique shape.

---

## JSON-LD utilities

| Utility | File | Emits |
|---|---|---|
| `buildLandingJsonLd(i18n)` | `src/generic/util/build-landing-json-ld.util.ts` | `SoftwareApplication` + `FAQPage` (used on home page only) |
| `buildFeaturePageJsonLd(input)` | `src/feature/util/build-feature-page-json-ld.util.ts` | `BreadcrumbList`, `WebPage` (with `SoftwareApplication` mainEntity), optional `FAQPage` |
| `buildPillarHubJsonLd(input)` | `src/feature/util/build-pillar-hub-json-ld.util.ts` | `BreadcrumbList`, `WebPage`, optional `FAQPage` |
| `BlogPostingJsonLd` component | `src/blog/component/blog-posting-json-ld/blog-posting-json-ld.tsx` | `BlogPosting` + `BreadcrumbList` |

JSON-LD is injected via `<JsonLd data={…} />` (in `src/generic/component/json-ld/json-ld.tsx`) placed at the top of the page's `<main>` element. Never inline `<script type="application/ld+json">` by hand.

All JSON-LD utilities take already-resolved strings (not `MessageDescriptor`). The page resolves descriptors with `i18n._()` before passing them in.

---

## Alternates and hreflang

`buildAlternates(lang, path)` in `src/generic/util/build-alternates.util.ts` builds the `alternates` metadata field for any route:

```ts
{
    canonical: `https://budgie.at/${lang}${path}`,
    languages: {
        en: 'https://budgie.at/en${path}',
        uk: 'https://budgie.at/uk${path}',
        fr: 'https://budgie.at/fr${path}',
        de: 'https://budgie.at/de${path}',
        es: 'https://budgie.at/es${path}',
        'x-default': 'https://budgie.at/en${path}'
    }
}
```

Every page family's metadata helper calls `buildAlternates` internally. For pages that build their own metadata (home layout, blog index, features hub), call `buildAlternates(lang, '/path')` directly.

---

## Sitemap

`src/app/sitemap.ts` is the single sitemap for the entire landing. It iterates all three registries plus a hand-written `staticPages` array:

| Entry type | Source | `lastModified` | `priority` |
|---|---|---|---|
| Static pages (`''`, `/blog`, `/features`) | `SITEMAP_STATIC_LAST_MODIFIED` constant | from `src/generic/constant/sitemap-last-modified.constant.ts` | 1.0 / 0.9 / 0.8 |
| Blog articles | `ARTICLE_REGISTRY` | `entry.date` | 0.7 |
| Feature pages | `FEATURE_REGISTRY` | `entry.updatedAt` | 0.9/0.8/0.7/0.7 by `FeatureTierEnum` |
| Pillar hub pages | `PILLAR_HUB_REGISTRY` | `entry.updatedAt` | 0.85 |

When you add a new page, add its registry entry and the sitemap will pick it up automatically. Pillar hub pages live at `/${locale}/${slug}` (not under `/features/`); `buildPillarHubMetadata` and `buildPillarHubJsonLd` both use `/${slug}` as the path.

`SITEMAP_STATIC_LAST_MODIFIED` (`src/generic/constant/sitemap-last-modified.constant.ts`) must be updated manually when the corresponding page is meaningfully changed.

---

## SEO primitive reference

Check this list before authoring a new SEO component — most concerns already have a primitive.

### Blog article primitives

| Concern | Primitive |
|---|---|
| Article hero block (image, breadcrumbs, h1, meta) | `BlogArticleHero image imageAlt` + children |
| Breadcrumb trail | `BlogBreadcrumbs` + `BlogBreadcrumbLink href position` + `BlogBreadcrumbCurrent position` children |
| Article metadata (date, author, reading time, tags) | `BlogArticleMeta date author locale readingTimeMinutes tags` |
| Content wrapper | `BlogArticleContent` |
| Thematic section | `BlogArticleSection` |
| H2 section heading | `BlogArticleHeading` |
| H3 subheading | `BlogArticleSubheading` |
| Body paragraph | `BlogArticleProse` |
| Ordered or unordered list | `BlogArticleList ordered?` + `BlogArticleListItem` children |
| FAQ section (visible only) | `BlogFaqSection` + `BlogFaqItem question` children |
| Related articles row | `RelatedArticles locale slugs` |
| Related feature cards | `FeaturePageRelated features locale` |
| Bottom CTA | `BlogArticleCta locale` |
| BlogPosting + BreadcrumbList JSON-LD | `BlogPostingJsonLd …` |
| Custom OG image | sibling `opengraph-image.tsx` + `BlogOgImage` component |

### Feature page primitives

| Concern | Primitive |
|---|---|
| Feature hero (breadcrumbs, h1, tagline, CTA) | `FeaturePageHero breadcrumbs heading tagline locale` |
| Breadcrumb trail | `FeatureBreadcrumbs current locale` |
| Content section | `FeaturePageSection` |
| H2 section heading | `FeaturePageHeading` |
| Body paragraph | `FeaturePageProse` |
| Benefit grid | `FeaturePageBenefitGrid` + `FeaturePageBenefitGridItem index` children |
| Competitor comparison table | `FeaturePageComparisonTable rivalLabel rows` |
| Comparison category section | `FeaturePageCategoryComparison` + `FeaturePageComparisonShell` |
| FAQ section (visible only) | `FeaturePageFaqSection` + `FeaturePageFaqItem question answer` children |
| Related feature cards | `FeaturePageRelated features locale` |
| Related blog articles | `FeaturePageRelatedArticles locale slugs` |
| Bottom CTA | `FeaturePageCta locale` |
| BreadcrumbList + WebPage + optional FAQPage JSON-LD | `buildFeaturePageJsonLd(input)` util, inject via `<JsonLd>` |
| Custom OG image | sibling `opengraph-image.tsx` + `FeatureOgImage` component |

### Pillar hub primitives

| Concern | Primitive |
|---|---|
| Full page shell (hero, feature grid, FAQ, JSON-LD) | `PillarHubPageShell locale slug` |
| Hero (breadcrumbs, h1, tagline, bullets) | `PillarHubHero breadcrumbs bullets heading tagline locale` |
| Breadcrumb trail | `PillarHubBreadcrumbs current locale` |
| Feature card grid (from member slugs) | `PillarHubFeatureGrid locale slugs` |
| Content section | `PillarHubSection` |
| Open-source-specific body content | `OpenSourcePillarHubContent` |
| BreadcrumbList + WebPage + optional FAQPage JSON-LD | `buildPillarHubJsonLd(input)` util |

### Generic primitives

| Concern | Primitive |
|---|---|
| JSON-LD script tag | `JsonLd data` |
| Site-wide OG image | `src/app/[lang]/opengraph-image.tsx` |
| Alternates + canonical | `buildAlternates(lang, path)` util |

---

## Registry entry shapes

### `ArticleRegistryEntryInterface` — `src/blog/interface/article-registry-entry.interface.ts`

| Field | Type | Used by |
|---|---|---|
| `slug` | `string` | sitemap, listing page, page file path |
| `date` | `string` (YYYY-MM-DD) | sitemap `lastModified`, `BlogArticleMeta`, `BlogPostingJsonLd` |
| `author` | `string` | `BlogArticleMeta`, `BlogPostingJsonLd`, `buildBlogArticleMetadata` |
| `image` | `string` | `BlogArticleHero`, `BlogPostingJsonLd`, `buildBlogArticleMetadata` |
| `readingTimeMinutes` | `number` | `BlogArticleMeta` |
| `title` | `MessageDescriptor` | listing page, `BlogSection` home component |
| `description` | `MessageDescriptor` | listing page |
| `seoDescription` | `MessageDescriptor` | available for `buildBlogArticleMetadata` description override |
| `tags` | `readonly string[]` | listing page filter |
| `seoKeywords` | `readonly string[]` | `buildBlogArticleMetadata` keywords |
| `relatedFeatureSlugs` | `readonly string[]` | page-level FEATURE_REGISTRY lookup for `FeaturePageRelated` |

### `FeatureRegistryEntryInterface` — `src/feature/interface/feature-registry-entry.interface.ts`

| Field | Type | Used by |
|---|---|---|
| `slug` | `string` | sitemap, features hub grid, page file path |
| `tier` | `FeatureTierEnum` | sitemap priority |
| `category` | `FeatureCategoryEnum?` | features hub grouping |
| `title` | `MessageDescriptor` | `FeaturePageHero heading`, `FeatureBreadcrumbs`, features hub card |
| `tagline` | `MessageDescriptor` | `FeaturePageHero tagline`, features hub card |
| `metaTitle` | `MessageDescriptor` | `generateMetadata title`, `buildFeaturePageJsonLd title` |
| `metaDescription` | `MessageDescriptor` | `generateMetadata description`, JSON-LD |
| `primaryKeyword` | `string` | for reference only |
| `seoKeywords` | `readonly string[]` | `buildFeaturePageMetadata keywords` |
| `faqs` | `readonly FeatureFaqInterface[]` | `buildFeaturePageJsonLd faqs`, page FAQ section |
| `comparisonRows` | `readonly FeatureComparisonRowInterface[]?` | `FeaturePageComparisonTable` |
| `relatedFeatureSlugs` | `readonly string[]` | `FeaturePageRelated` |
| `relatedArticleSlugs` | `readonly string[]` | `FeaturePageRelatedArticles` |
| `publishedAt` / `updatedAt` | `string` | sitemap, `buildFeaturePageMetadata`, JSON-LD |
| `ogTags` | `readonly string[]` | available for OG image generation |

### `PillarHubEntryInterface` — `src/feature/interface/pillar-hub-entry.interface.ts`

| Field | Type | Used by |
|---|---|---|
| `slug` | `string` | sitemap, page file path, `PillarHubPageShell` |
| `title` | `MessageDescriptor` | `PillarHubHero heading`, `PillarHubBreadcrumbs` |
| `tagline` | `MessageDescriptor` | `PillarHubHero tagline` |
| `metaTitle` | `MessageDescriptor` | `generateMetadata title`, JSON-LD |
| `metaDescription` | `MessageDescriptor` | `generateMetadata description`, JSON-LD |
| `primaryKeyword` | `string` | for reference only |
| `seoKeywords` | `readonly string[]` | `buildPillarHubMetadata keywords` |
| `memberFeatureSlugs` | `readonly string[]` | `PillarHubFeatureGrid` |
| `heroBullets` | `readonly MessageDescriptor[]` | `PillarHubHero bullets` |
| `faqs` | `readonly FeatureFaqInterface[]` | `buildPillarHubJsonLd faqs`, `FeaturePageFaqSection` |
| `publishedAt` / `updatedAt` | `string` | sitemap, `buildPillarHubMetadata`, JSON-LD |

---

## Generic SEO constants

| Constant | File | Value / Purpose |
|---|---|---|
| `BASE_URL` | `src/generic/constant/seo.constant.ts` | `'https://budgie.at'` — used in all URL construction |
| `DEFAULT_SOCIAL_IMAGE_PATH` | `src/generic/constant/seo.constant.ts` | `/images/design-mode/ai-budgeting-app-4x.jpg` — fallback OG image |
| `OG_LOCALE_MAP` | `src/generic/constant/seo.constant.ts` | maps locale code to OG locale string (e.g. `en` → `en_US`) |
| `LOCALES` | `src/generic/constant/seo.constant.ts` | re-export of `SUPPORTED_LOCALES` from i18n config |
| `SITEMAP_STATIC_LAST_MODIFIED` | `src/generic/constant/sitemap-last-modified.constant.ts` | hand-maintained `lastModified` dates for static pages |

---

## When extending

- **Adding a new blog article**: add an entry to `ARTICLE_REGISTRY`, create `src/app/[lang]/blog/<slug>/page.tsx`, optionally add `opengraph-image.tsx`. Run `yarn i18n:sync` after adding `<Trans>` strings.
- **Adding a new feature page**: add an entry to `FEATURE_REGISTRY` with full `faqs`, `relatedFeatureSlugs`, `relatedArticleSlugs`, `publishedAt`, `updatedAt`. Create `src/app/[lang]/features/<slug>/page.tsx`. Optionally add `opengraph-image.tsx`.
- **Adding a new pillar hub**: add an entry to `PILLAR_HUB_REGISTRY` with `heroBullets`, `memberFeatureSlugs`, `faqs`. Create `src/app/[lang]/<slug>/page.tsx` (top-level, not under `/features/`).
- **Adding a new SEO concern?** Build a new primitive component and have pages compose it as a child. Do not bolt new props onto `FeaturePageHero` or `PillarHubHero`.
- **Interactive widgets** (accordion, scroll sentinel, search) belong in client islands rendered inside server primitives. Keep `"use client"` off the page and off the structural primitives.
- **After any visible text change**: run `yarn i18n:sync` and commit both `.po` and compiled `.ts` locale files.
