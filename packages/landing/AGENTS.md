# Landing Package (Next.js)

Marketing website built with Next.js 15, React 19, Tailwind CSS 4, and Lingui 5.7. Supports 5 locales with server-side rendering.

## Commands

```bash
yarn start                    # Development server (next dev)
yarn build                    # Production build
yarn i18n:sync                # Extract & compile i18n translations
yarn ts                       # TypeScript check
yarn lint                     # ESLint check
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
│       │   └── [slug]/page.tsx
│       └── legal/            # Legal pages
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
    ├── blog/[slug]/page.tsx  # /blog/article-slug
    └── legal/layout.tsx      # Legal pages wrapper
```

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

## i18n (Lingui)

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
yarn i18n:sync
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

## SOTA Bar — Next.js 15+ / React 19+

**Server components are async functions.** A page is `export default async function Page(props)`. No HOF page builders, no service classes wrapping single helpers.

**Composition over configuration.** Prefer compound components, `children`/slots, and explicit JSX composition over giant prop bags.

**Plain functions over class wrappers.** Default to `export function` for pure helpers. Classes only when grouping genuinely stateful operations.

**No `.map()` for rendering fixed JSX arrays.** Extract a component and write explicit instances. `.map()` only for: (1) reusable template components receiving variable-length data via props, (2) data transformations (not JSX), (3) truly dynamic data filtered/computed at runtime.

## Blog Article Pattern

Blog articles are static routes under `app/[lang]/blog/<slug>/page.tsx`. Each article is a server component composing generic blog components.

**No MDX.** Articles are pure TSX with `<Trans>` tags for all visible text. Lingui extracts strings to `.po` catalogs for translation.

**No dynamic routes.** Each article has its own `page.tsx` — no `[slug]` pattern. All routes are fully SSG at build time.

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

**Article registry:** `src/blog/constant/article-registry.constant.ts` is the single source of truth for listing pages, sitemap, and blog section. Each entry stores slug, date, author, image, and Lingui `msg` descriptors for title/description.

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
