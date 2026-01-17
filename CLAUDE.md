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
yarn format                               # Prettier (run first - may modify files)
yarn ts                                   # TypeScript (~10s)
yarn lint                                 # ESLint (~18s)
yarn deadcode                             # Knip (~5s)
yarn cpd                                  # Code duplication (~2s)
yarn test                                 # Jest (~4s)

# IMPORTANT: After completing any task, ALWAYS run:
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
yarn workspace @budgie-at/app i18n:sync  # ONLY run if you added/changed translatable strings (t`...`, <Trans>)

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
5. **No displayName or forwardRef** - Never use `Component.displayName` or `forwardRef`. React 19 handles ref forwarding natively - just accept `ref` as a regular prop
6. **Concise setState** - `setShouldAutoFocus(index >= 0)` not if/else blocks
7. **Avoid unnecessary variables** - Inline when logic is self-explanatory
8. **Explicit JSX for fixed arrays** - Don't map over hardcoded data
9. **Type guards** - Use `@rnw-community/shared` for checks: `isNotEmptyArray()`, `isNotEmptyString()`, `isPositiveNumber()`. For simple null/undefined checks on functions, prefer optional chaining: `callback?.(value)` instead of `if (isDefined(callback)) callback(value)`
10. **Component Styling with CVA** - Always use `class-variance-authority` (CVA) for components with style variants
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
11. **Single const declarations** - Each variable gets its own `const` declaration
   ```typescript
   // Good - Separate const declarations
   const buttonText = isPositiveNumber(count) ? t`Done (${count})` : t`Done`;
   const description = t`${total} items available`;
   const rightAction = { icon: UserIconNameEnum.Plus, onPress: handleCreate };

   // Bad - Multiple variables in one declaration
   const buttonText = isPositiveNumber(count) ? t`Done (${count})` : t`Done`,
       description = t`${total} items available`,
       rightAction = { icon: UserIconNameEnum.Plus, onPress: handleCreate };
   ```
12. **Never disable ESLint without approval** - NEVER add `eslint-disable` comments or similar suppressions without explicit user approval. Always fix the underlying issue or ask the user first.
13. **Use `emptyFn` for no-op callbacks** - Use `emptyFn` from `@rnw-community/shared` instead of `() => void 0` or `() => {}`
   ```typescript
   // Good
   import { emptyFn } from '@rnw-community/shared';
   const handleEmptySelect = emptyFn;

   // Bad
   const handleEmptySelect = () => void 0;
   const handleEmptySelect = () => {};
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
- **No render helper functions** - Never create `renderSomething()` helper functions. Extract to separate components instead. Each component should be in its own file with proper naming.
- **Prefer handle* methods** - Always extract event handlers into named `handle*` methods instead of inline callbacks. This makes component behavior explicit and improves readability.
  ```typescript
  // Good - Named handler shows intent
  const handleClose = () => void ref.current?.close();
  <Button onPress={handleClose} />

  // Bad - Inline callback hides behavior
  <Button onPress={() => void ref.current?.close()} />
  ```
- **Prefer children for composition** - Use `children` prop for the most natural content slot in wrapper components. Use named props (e.g., `topRight`, `balanceContent`) for specific, non-primary slots.
  ```typescript
  // Good - children for primary/bottom content
  <AccountCardBase topRight={<DeadlineIndicator />} balanceContent={<Balance />}>
      <ProgressBar />
  </AccountCardBase>

  // Bad - named prop for primary content
  <AccountCardBase topRight={<DeadlineIndicator />} balanceContent={<Balance />} bottomContent={<ProgressBar />} />
  ```
- **No render callback props** - Avoid `renderXxx` props that pass refs. Use JSX composition with children instead.
  ```typescript
  // Good - children composition
  const ref = useRef<BottomSheetInterface | null>(null);
  <>
      <SimpleHorizontalCell onPress={() => ref.current?.open()} ... />
      <SelectorBottomSheet ref={ref} ... />
  </>

  // Bad - render callback
  <EntitySelector renderBottomSheet={ref => <SelectorBottomSheet ref={ref} />} />
  ```
- **No object props** - Pass plain props instead of bundled objects. Extract objects to variables if needed for readability.
  ```typescript
  // Good - plain props
  <BottomSheetSearch rightActionIcon={UserIconNameEnum.Plus} rightActionOnPress={handleCreate} />

  // Bad - object prop
  <BottomSheetSearch rightAction={{ icon: UserIconNameEnum.Plus, onPress: handleCreate }} />
  ```
- **Props destructuring** - When a component has many props (5+), destructure in the function body instead of the signature:
  ```typescript
  // Good - Destructure in body for many props
  export const MyComponent = (props: Props) => {
      const { className, header, footer, children, contentClassName, withBlur = false, ...rest } = props;
      // ...
  };

  // Good - Destructure in signature for few props
  export const SimpleComponent = ({ title, onPress }: Props) => { ... };

  // Bad - Long destructuring in signature
  export const MyComponent = ({
      className,
      header,
      footer,
      children,
      contentClassName,
      withBlur = false,
      ...rest
  }: Props) => { ... };
  ```
- **Component logic order** - Organize component internals in this order, separated by blank lines:
  1. Props destructuring (if many props)
  2. Framework hooks (router, i18n: `useRouter`, `useLingui`)
  3. State and refs (`useState`, `useRef`)
  4. External hooks (queries, mutations, custom hooks)
  5. Handlers (`handle*` functions)
  6. Derived values and computed props (after hooks they depend on)
  7. Effects (`useEffect`)
  8. Render-related (JSX variables, conditional rendering helpers)
  ```typescript
  export const MyComponent = (props: Props) => {
      const { variant, onSelect, ...rest } = props;

      const { t } = useLingui();

      const [search, setSearch] = useState('');
      const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

      const { data } = useMyQuery();

      const handleOpen = () => bottomSheetRef.current?.open();

      const cardVariant = status === 'error' ? 'destructive' : 'primary';

      useEffect(() => { ... }, []);

      return <View>...</View>;
  };
  ```

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
5. **NEVER push without explicit user permission** - Always wait for user to approve before running `git push`
6. **Commit format:** `type(scope): description` (conventional commits)
   - **Scopes:** Use monorepo package names WITHOUT prefix: `app`, `contracts`, `landing`, `bank-sync`
   - **Examples:** `feat(app): add dark mode`, `fix(contracts): update schema`, `chore(landing): update deps`
   - **PR titles:** Must follow the same convention as commit messages
6. **Before finishing a PR:** Review all changes to ensure nothing redundant or illogical was added. Check for unused imports, unnecessary code, and verify the fix is minimal and focused.

## PR Review

- **Only address human reviewer feedback** - Never fix comments from Claude, Copilot, or other AI assistants without explicit human confirmation
- **Validate all AI suggestions** - AI-generated review comments may be incorrect or out of context

## Important Notes

- Always use `yarn` (never `npm`)
- After table changes in contracts: `cd packages/app && yarn db:generate`
- Never modify `.jscpd.json` - fix duplication in source
- Known acceptable warnings: empty interfaces, magic numbers in tests
