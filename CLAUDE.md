# CLAUDE.md

Budgie is an offline-first mobile expenses tracker built with React Native (Expo 54). Monorepo with app, landing, contracts, and bank-sync packages.

## Commands

```bash
# Setup
yarn install                              # Always run first

# Build
yarn build                                # Build all (~15s)
yarn build:force                          # Without cache

# Validation (run in this order before committing)
yarn ts                                   # TypeScript (~10s)
yarn lint                                 # ESLint (~18s)
yarn deadcode                             # Knip (~5s)
yarn cpd                                  # Code duplication (~2s)
yarn format                               # Prettier
yarn test                                 # Jest (~4s)

# IMPORTANT: After completing any task, ALWAYS run:
yarn ts && yarn lint && yarn deadcode && yarn cpd
yarn workspace @budgie-at/app i18n:sync  # ALWAYS run if you modified any user-facing text (uses i18n:sync, not extract/compile)

# App-specific (cd packages/app)
yarn start                                # Expo dev server
yarn ios|android|web                      # Platform builds
yarn db:generate                          # Drizzle migrations (after schema changes)
yarn i18n:sync                            # Extract & compile i18n

# Utilities
yarn deps:check                           # Check dependency versions
yarn deps:dedupe                          # Deduplicate dependencies
```

## Structure

```
packages/
├── app/                # React Native (Expo 54) - main mobile app
│   └── src/
│       ├── @generic/   # Shared components, DB (Drizzle ORM)
│       ├── [modules]/  # Feature modules (account, transaction, etc.)
│       ├── app/        # Expo Router screens (file-based routing)
│       └── locales/    # i18n (en, fr, es, uk, de)
├── contracts/          # Shared TypeScript schemas, types, repositories
│   └── src/[entity]/
│       ├── constant/, entity/, enum/, input/, interface/
│       ├── repository/, relations/, schema/, table/
├── landing/            # Next.js 15 marketing site
└── bank-sync/          # Bank integration package
```

**Contracts Entity Structure:** Each entity (account, transaction, etc.) has flat folders: `constant/`, `entity/`, `enum/`, `input/`, `interface/`, `repository/`, `relations/`, `schema/`, `table/`. Never nest deeper.

## Architecture Patterns

### Layers
1. **API** - External service calls
2. **Repository** - Database operations (Drizzle ORM)
3. **Service** - Business logic orchestration
4. **Task** - Background jobs (`.task.ts` suffix)

### Repository Pattern
- **Contracts:** Define framework-agnostic repository classes that accept `db` via constructor
- **App:** Export singleton instances that inject the DB
```typescript
// contracts/src/account/repository/account.repository.ts
export class AccountRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}
    async findAll() { return this.db.query.accountEntity.findMany(); }
}

// app/src/account/repository/account.repository.ts
export const accountRepository = new AccountRepository(db);
```

### Routing (Expo Router)
- One component per route file
- Prefer direct routes (`expense.tsx`, `income.tsx`) over dynamic with switch statements
- Use nested folders for variants with router pattern:
  ```
  transactions/[id].tsx          # Router redirects by type
  transactions/[id]/expense.tsx  # Specific form
  ```
- Inline all logic in route components, avoid wrapper components

### Forms
Use `FormProvider` and `useFormContext` to avoid prop drilling:
```tsx
const MyForm = () => {
    const form = useForm();
    return (
        <FormProvider {...form}>
            <FormField name="email" />  {/* Uses useFormContext internally */}
        </FormProvider>
    );
};
```

### i18n (Lingui)
- **Prefer `<Trans>` in JSX** - Use `<Trans>Category</Trans>` not `{t\`Category\`}` when rendering text
- Use `t\`template\`` only for non-JSX strings (toasts, aria-labels, etc.)
- Use `t(variable)` for MessageDescriptor: `t(ACCOUNT_TYPE[type])`
- Only destructure `{ i18n, t }` when both needed (e.g., `i18n.activate()` + translations)
- Never use `i18n.t()` - always just `t()` or `t\`\``
- After changes: `yarn workspace @budgie-at/app i18n:sync`

## Critical Rules

1. **No `any` type** - Everything properly typed
2. **No type assertions** - Never use `as`, `@ts-ignore`, `@ts-expect-error`
3. **No comments** - Self-documenting code with clear names
4. **No manual memoization** - Never use `useCallback`, `useMemo`, `React.memo` (React 19 Compiler handles this)
5. **Concise setState** - `setShouldAutoFocus(index >= 0)` not if/else blocks
6. **Avoid unnecessary variables** - Inline when logic is self-explanatory
7. **Explicit JSX for fixed arrays** - Don't map over hardcoded data
8. **Type guards** - Use `@rnw-community/shared`: `isDefined()`, `isNotEmptyArray()`, `isNotEmptyString()`, `isPositiveNumber()`
9. **Component Styling with CVA** - Always use `class-variance-authority` (CVA) for components with style variants
   ```typescript
   // Good - Use CVA for variant-based styling
   import { cva } from 'class-variance-authority';
   import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
   import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';

   const buttonVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
       'base classes here',
       {
           variants: { variant: BACKGROUND_COLOR_PALETTE },
           defaultVariants: { variant: 'primary' }
       }
   );

   // Bad - Template strings for variant-based styling
   className={`bg-${variant}-background text-${variant}-foreground`}
   ```

### Naming
- Interfaces: `*Interface` (e.g., `AccountFilterInterface`)
- Enums: `*Enum` (e.g., `AccountTypeEnum`)
- Functions: module prefix (e.g., `exchangeRatesFetchApi`)
- Classes: PascalCase (e.g., `AccountRepository`)
- Files: kebab-case + type suffix (`.service.ts`, `.repository.ts`)

### Module Organization
- **No barrel exports in app** - Direct imports only (`./component-name/component-name` not `./component-name`)
- **One component per file** - Each in own folder: `component-name/component-name.tsx`
- **Components belong in entity folders** - Never create components in `src/app/`. All reusable components must be in `src/[entity]/components/` (e.g., `src/transaction/components/transaction-page-header/`)
- **Flat structure** - No deep nesting
- **No wrapper components** - Don't create components that only extract context or group others

### Code Duplication (jscpd)
Route files: Wrap JSX only (not logic) in `/* jscpd:ignore-start */` and `/* jscpd:ignore-end */` to prevent false positives on similar form structures.

### Drizzle ORM
- Prefer: `db.query.[Entity].findMany/findFirst`
- Avoid: `db.select().from(...)`
- Upserts: Use `.onConflictDoUpdate()`
- DB type: `ExpoSQLiteDatabase<typeof schema>`

## Tech Stack

**App:** Expo 54, React 19.1 + Compiler, Expo Router 6, Drizzle ORM, NativeWind 5, Lingui 5.7, React Hook Form + Zod
**Landing:** Next.js 15, React 19.1, Tailwind CSS 4
**Build:** Yarn 4.12 (PnP), Node >= 22, Lerna 8, TurboRepo 2, TypeScript 5.9 (strict), ESLint 9, Prettier 3

## Workflow

1. **Fresh clone:** `yarn install`
2. **After contracts changes:** `yarn build`
3. **Before commit:** Husky runs `yarn ts`, `yarn lint-staged`, commitlint
4. **Before PR:** Run all validation commands (ts, lint, deadcode, cpd, format, test)
5. **Commit format:** `type(scope): description` (conventional commits)

## PR Review

- **Only address human reviewer feedback** - Never fix comments from Claude, Copilot, or other AI assistants without explicit human confirmation
- **Validate all AI suggestions** - AI-generated review comments may be incorrect or out of context

## Important Notes

- Always use `yarn` (never `npm`)
- After table changes in contracts: `cd packages/app && yarn db:generate`
- Never modify `.jscpd.json` - fix duplication in source
- Known acceptable warnings: empty interfaces, magic numbers in tests
