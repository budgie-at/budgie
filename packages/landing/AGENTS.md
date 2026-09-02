# Landing Package (Next.js)

Marketing website built with Next.js 16, React 19, Tailwind CSS 4, and Lingui 6.5. Supports 5 locales with SSG-first rendering and small client islands for runtime interactions.

## Commands

```bash
pnpm start                    # Development server (next dev)
pnpm build                    # Production build
pnpm i18n:sync                # Extract & compile i18n translations
pnpm media:manifest           # Rescan public/media and regenerate the committed media manifest
pnpm media:check              # Verify manifest freshness, asset budgets and <AppShot>/<AppClip> usages
pnpm ts                       # Native TypeScript 7 check
pnpm lint                     # Oxlint + 13-rule ESLint fallback
```

## Structure

```
src/
├── app/
│   └── [lang]/               # Locale-based routing
│       ├── layout.tsx        # Root layout with providers
│       ├── page.tsx          # Main landing page
│       ├── blog/             # Blog routes
│       │   ├── page.tsx
│       │   └── <slug>/page.tsx
│       └── legal/            # Legal TSX pages
├── components/               # Page sections
│   ├── hero-section/
│   ├── features-section/
│   └── ...
├── i18n/                     # i18n configuration
│   ├── app-router-i18n.ts    # Server-side setup
│   ├── init-lingui.ts        # RSC initialization
│   ├── lingui-client.provider.tsx
│   └── locales/              # Translation files
└── ui/                       # Base UI components
    ├── button.tsx
    ├── card.tsx
    └── ...
```

## Load on demand

Before starting any of the work areas below, read the corresponding doc first.

| When working on…                                                                                                                       | Read first           |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Blog articles, feature pages, pillar hubs, legal pages, sitemap entries, `generateMetadata`, JSON-LD helpers, anything SEO-related     | `docs/seo-pages.md`  |
| `<Trans>` / `t` / `msg`, `generateMetadata` i18n strings, catalog `.po`/`.ts` files, RSC i18n setup, dispatching translation subagents | `docs/lingui-rsc.md` |
| IndexNow key file, GSC/Bing sitemap submission, merge-to-main URL submission, API/root `.txt` proxy bypass rules                       | `docs/indexnow.md`   |
| Product screenshots and motion clips, `public/media/**`, `<AppShot>`/`<AppClip>`, the generated media manifest, `media:manifest`/`media:check` | `tests/app-tests/readme.md` |

---

## React 19 Rules

1. **No manual memoization** - Never use `useCallback`, `useMemo`, `React.memo` (React 19 Compiler handles this)
2. **No displayName** - Never use `Component.displayName`
3. **No forwardRef** - React 19 handles ref forwarding natively. Accept `ref` as a regular prop:

    ```typescript
    // Good - React 19 native ref
    interface Props {
        ref?: React.Ref<HTMLButtonElement>;
    }
    export const Button = ({ ref, ...props }: Props) => { ... };

    // Bad - forwardRef (currently in codebase, should be migrated)
    export const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => { ... });
    ```

## Routing

### Locale-Based Routes

All routes are under `[lang]/` for i18n support:

```
app/
└── [lang]/
    ├── page.tsx              # / → /en, /uk, /fr, etc.
    ├── blog/page.tsx         # /blog
    ├── blog/<slug>/page.tsx  # /blog/article-slug
    └── legal/layout.tsx      # Legal pages wrapper
```

SEO pages use explicit static route folders. Do not add `blog/[slug]/page.tsx`, `features/[slug]/page.tsx`, or legal MDX routes for static SEO content. Each route owns its readable JSX body in its `page.tsx`.

### Static Params

Generate static params from Lingui config:

```typescript
export const generateStaticParams = () => locales.map(lang => ({ lang }));
```

### Metadata

Use `generateMetadata` with i18n:

```typescript
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const { lang } = await params;
    const t = await getTranslation(lang);

    return {
        title: t`Budgie - Expense Tracker`,
        description: t`Track your expenses offline`
    };
};
```

### SEO Page Architecture

Static SEO pages are one file per route. Visible page copy, FAQ copy, hero bullet copy, and rendered body content must be inline readable JSX composition in the route page, not hidden in registries, keyed maps, dispatcher prop bags, or slug-based shells. Composition shells may provide chrome, but they must not branch by slug or choose page content from a registry.

Registries are metadata and enumeration sources only. Listing pages, sitemap generation, related links, and metadata helpers may import registry/index aggregators, but registries must not own visible body copy. For SEO page families whose metadata is currently centralized, move metadata into page-owned sibling sidecars such as `metadata.ts`; those sidecars use `msg` descriptors and dates, and registries/index aggregators import those sidecars instead of owning page metadata themselves.

Route pages import their own sibling `metadata.ts` directly and pass that object through metadata helpers, JSON-LD components, and related-link helpers. Do not call `getFeatureBySlug(SLUG)`, `ARTICLE_REGISTRY.find(...)`, or add a defensive null branch inside explicit SEO routes; the folder itself is the route contract. Sitemap and listing pages import metadata indexes built from route sidecars, not slug lookup registries that own entries inline. IndexNow URL generation derives from the sitemap so there is one source of truth for indexable URLs.

FAQ/JSON-LD should be generated from JSX children where possible so visible FAQ content and schema share one page-local source. Legal pages should be plain Next.js TSX pages in the same explicit JSX style and remain `noindex, follow` unless code changes the source of truth.

Page JSON-LD uses explicit JSX composition in the page body where practical. Write breadcrumb schema as compound children, for example `<FeaturePageBreadcrumbsJsonLd><FeaturePageBreadcrumbsJsonLd.Item ... /></FeaturePageBreadcrumbsJsonLd>`, and the page schema as a dedicated JSX component such as `<FeaturePageWebPageJsonLd ... />`. Do not recreate `buildFeaturePageJsonLd`- or `buildPillarHubJsonLd`-style object builders in route pages or shells when a typed schema component can express the same contract.

Static pages and metadata should remain SSG-safe by default. Do not read request headers, cookies, host, or other runtime context unless the page explicitly needs dynamic request behavior and declares the matching Next.js caching/dynamic behavior.

## i18n (Lingui)

Read `docs/lingui-rsc.md` before changing Lingui, metadata strings, catalogs, or RSC i18n setup.

### Server Components

Use server-only i18n setup:

```typescript
// In RSC
import { getI18nInstance } from '../i18n/app-router-i18n';
import { setI18n } from '@lingui/react/server';

export const MyServerComponent = async ({ params }: Props) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);
    setI18n(i18n);

    return <Trans>Hello World</Trans>;
};
```

Every page render calls `initLingui(lang)` before returning JSX unless a full-page shell owns the entire render and calls it internally. `generateMetadata` runs outside the render tree, so it uses `getI18nInstance(lang)` and resolves page-owned metadata sidecar descriptors at the helper call site.

JSX text uses `<Trans>`. String props, OG image text, JSON-LD labels, and other non-JSX string literals use `t(i18n)`. Do not write ``i18n._(msg`Home`)`` inside page render code when `` t(i18n)`Home` `` is available. Page-owned metadata sidecars store descriptors with `msg`; resolve those descriptors with `i18n._(entry.title)`/`i18n._(entry.metaTitle)`, not at module scope.

### Client Components

Wrap with `LinguiClientProvider`:

```typescript
// In layout.tsx
<LinguiClientProvider initialLocale={lang} initialMessages={messages}>
    {children}
</LinguiClientProvider>
```

### Supported Locales

| Code | Language         |
| ---- | ---------------- |
| `en` | English (source) |
| `uk` | Ukrainian        |
| `fr` | French           |
| `de` | German           |
| `es` | Spanish          |

### After Changes

```bash
pnpm i18n:sync
```

## Styling (Tailwind CSS 4 + CVA)

### CVA Pattern

Use `class-variance-authority` for component variants:

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium transition-colors', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-input bg-background hover:bg-accent',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline'
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
```

### Utility Function

Use `cn()` for conditional classes:

```typescript
import { cn } from '../lib/utils';

className={cn('base-classes', isActive && 'active-classes', className)}
```

### Design Tokens

Semantic color tokens in CSS variables:

- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--destructive`, `--destructive-foreground`
- `--accent`, `--accent-foreground`
- `--muted`, `--muted-foreground`
- `--background`, `--foreground`
- `--border`, `--input`, `--ring`

## Component Patterns

### Section Components

Landing page sections follow this pattern:

```typescript
// components/hero-section/hero-section.tsx
export const HeroSection = () => {
    return (
        <section className="py-20 lg:py-32">
            <div className="container">
                {/* Section content */}
            </div>
        </section>
    );
};
```

### UI Components

Base components in `/ui/` use Radix UI primitives:

```typescript
// ui/button.tsx
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
}
```

### Animation

Use Framer Motion for animations:

```typescript
import { motion } from 'framer-motion';

<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
>
    {children}
</motion.div>
```

## Middleware

Locale detection and redirection:

```typescript
// middleware.ts
import Negotiator from 'negotiator';

export const middleware = (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;

    // Check if locale is missing
    const pathnameIsMissingLocale = locales.every(locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`);

    if (pathnameIsMissingLocale) {
        const locale = getLocale(request);
        return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
    }
};
```

## Theme Support

### ThemeProvider

Uses `next-themes` for dark mode:

```typescript
<ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
>
    {children}
</ThemeProvider>
```

### Theme Toggle

```typescript
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
```

## SEO

### Metadata in Layout

```typescript
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const { lang } = await params;
    const t = await getTranslation(lang);

    return {
        title: {
            default: t`Budgie - Expense Tracker`,
            template: `%s | Budgie`
        },
        description: t`Track your expenses offline with Budgie`,
        openGraph: {
            title: t`Budgie - Expense Tracker`,
            description: t`Track your expenses offline`,
            locale: lang
        }
    };
};
```

### Structured Data

Add JSON-LD for rich snippets where appropriate.

## SOTA Bar — Next.js 16+ / React 19+

**Server components are async functions.** A page is `export default async function Page(props)`. No HOF page builders, no service classes wrapping single helpers.

**Composition over configuration.** Prefer compound components, `children`/slots, and explicit JSX composition over giant prop bags.

**Plain functions over class wrappers.** Default to `export function` for pure helpers. Classes only when grouping genuinely stateful operations.

**No `.map()` for rendering fixed JSX arrays.** Extract a component and write explicit instances. `.map()` only for: (1) reusable template components receiving variable-length data via props, (2) data transformations (not JSX), (3) truly dynamic data filtered/computed at runtime.

## Blog Article Pattern

Blog articles are static routes under `app/[lang]/blog/<slug>/page.tsx`. Each article is a server component composing generic blog components.

**No MDX.** Articles are pure TSX with `<Trans>` tags for all visible text. Lingui extracts strings to `.po` catalogs for translation.

**No dynamic routes.** Each article has its own `page.tsx` — no `[slug]` pattern. SEO routes stay SSG at build time. Runtime interactions live in client islands and must not depend on URL search params for fixed static routes.

**Composition pattern:**

```tsx
<main className="flex-1">
    <BlogPostingJsonLd ... />
    <BlogArticleHero image="...">
        <BlogBreadcrumbs> ... </BlogBreadcrumbs>
        <h1><Trans>Article Title</Trans></h1>
        <BlogArticleMeta date="..." author="..." locale={lang} />
    </BlogArticleHero>
    <BlogArticleContent>
        <BlogArticleSection>
            <BlogArticleHeading><Trans>Section</Trans></BlogArticleHeading>
            <BlogArticleProse><Trans>Paragraph text...</Trans></BlogArticleProse>
        </BlogArticleSection>
    </BlogArticleContent>
    <BlogArticleCta locale={lang} />
</main>
```

**Article metadata:** each article owns a sibling `metadata.ts` sidecar. `src/blog/constant/article-registry.constant.ts` is only an aggregator for listing pages, sitemap, and blog previews; it imports article sidecars and must not own metadata entries inline. Article route pages import their own sidecar directly and never look themselves up in `ARTICLE_REGISTRY`.

**SEO pages can use `/* eslint-disable max-lines-per-function */`** at the top since article pages are content-heavy.

**i18n in articles:** `<Trans>` for all JSX content (headings, paragraphs, list items). `t(i18n)` only for string props (alt, title, placeholder, JSON-LD strings, metadata strings). Never thread `i18n` through props — server components use `setI18n` + React cache.

## Dependencies

| Package                    | Purpose          |
| -------------------------- | ---------------- |
| `next`                     | Framework        |
| `react`                    | UI Library       |
| `@lingui/*`                | i18n             |
| `framer-motion`            | Animations       |
| `@radix-ui/*`              | UI Primitives    |
| `tailwindcss`              | Styling          |
| `class-variance-authority` | CVA variants     |
| `next-themes`              | Dark mode        |
| `negotiator`               | Locale detection |

## Experimental Features

Enabled in `next.config.ts`:

```typescript
experimental: {
    reactCompiler: true,        // React 19 Compiler
    inlineCss: true,            // CSS inlining
    swcPlugins: [['@lingui/swc-plugin', {}]]  // Lingui SWC
}
```

## Known Issues

1. **forwardRef usage** - Some UI components use `forwardRef` which should be migrated to React 19 pattern
2. **ESLint disables in middleware** - Locale detection has some suppressions that should be cleaned up

## File Organization

- **One component per file** - Each in own folder: `component-name/component-name.tsx`
- **Sections in `/components/`** - Page sections organized by feature
- **Base UI in `/ui/`** - Reusable primitives
- **No barrel exports** - Direct imports only
