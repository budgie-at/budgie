# Landing Package

Marketing website built with Next.js 15, React 19, Tailwind CSS 4, and Lingui 5.7.

## Commands

```bash
yarn start        # Development server
yarn build        # Production build
yarn i18n:sync    # After modifying user-facing text
```

## Structure

```
src/
├── app/[lang]/           # Locale-based routing (en, uk, fr, de, es)
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Main landing page
│   ├── blog/             # Blog routes
│   └── legal/            # Legal pages
├── components/           # Page sections (hero-section, features-section, etc.)
├── i18n/                 # i18n configuration
└── ui/                   # Base UI components (button, card, etc.)
```

## Routing

All routes under `[lang]/` for i18n:

```typescript
// Generate static params
export const generateStaticParams = () => locales.map(lang => ({ lang }));

// Metadata with i18n
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const { lang } = await params;
    const t = await getTranslation(lang);
    return { title: t`Budgie - Expense Tracker` };
};
```

## i18n

### Server Components

```typescript
import { getI18nInstance } from '../i18n/app-router-i18n';
import { setI18n } from '@lingui/react/server';

const i18n = getI18nInstance(lang);
setI18n(i18n);
```

### Client Components

Wrapped with `LinguiClientProvider` in layout.

## Styling

### Design Tokens

Semantic CSS variables: `--primary`, `--secondary`, `--destructive`, `--accent`, `--muted`, `--background`, `--foreground`

### Section Pattern

```typescript
export const HeroSection = () => (
    <section className="py-20 lg:py-32">
        <div className="container">{/* content */}</div>
    </section>
);
```

## UI Components

Base components in `/ui/` use Radix UI primitives with CVA variants.

## Theme

Uses `next-themes`:

```typescript
const { theme, setTheme } = useTheme();
```
