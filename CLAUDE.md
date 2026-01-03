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

### React Compiler (React 19)
This project uses React 19 with React Compiler enabled. The compiler automatically memoizes components, values, and callbacks.

**Rules:**
- **Never use `useMemo`** - the compiler handles value memoization automatically
- **Never use `useCallback`** - the compiler handles function memoization automatically
- **Never use `React.memo`** - the compiler handles component memoization automatically
- **Write simple, straightforward code** - the compiler optimizes it for you

**Why:** Manual memoization is redundant with React Compiler and adds unnecessary complexity. The compiler analyzes your code and applies optimal memoization automatically.

```tsx
// Good - Let the compiler handle it
const categoryIds = allocations.map(a => a.categoryId).filter(isDefined);
const handleClick = () => void doSomething();

// Bad - Unnecessary manual memoization
const categoryIds = useMemo(() => allocations.map(a => a.categoryId).filter(isDefined), [allocations]);
const handleClick = useCallback(() => void doSomething(), []);
```

### Internationalization (Lingui) Usage Rules

- **JSX text content**
  Use `Trans` component from `@lingui/react/macro` for text content inside JSX elements.

- **Component props**
  Use `t` function for passing translated strings to component props (e.g., `label`, `title`, `placeholder`).
  **Never pass `<Trans>` as a prop value** - always use `t` for props.

- **`t` function usage**
  The `t` function obtained via `const { t } = useLingui();` **must not** be used directly in JSX text content.
  It **must** be used for:
    - Component props (e.g., `label={t\`Save\`}`, `title={t\`Settings\`}`)
    - Variables outside JSX (e.g., `const title = t\`Accounts\`;`)

- **Utility functions with i18n**
  Import `msg` from `@lingui/core/macro` directly in utility functions. Return `MessageDescriptor` and use `i18n.t()` in the caller.
  ```typescript
  // Good - import msg directly, return MessageDescriptor
  import { MessageDescriptor } from '@lingui/core';
  import { msg } from '@lingui/core/macro';

  const getLabel = (): MessageDescriptor => msg`Label`;

  // In component:
  const { i18n } = useLingui();
  const label = i18n.t(getLabel());

  // Bad - don't pass t/msg as function argument
  const getLabel = (t: TranslateFunction): string => t`Label`;
  ```

- **Rationale**
  This ensures consistent message extraction, predictable rendering behavior, and avoids subtle runtime or tooling issues caused by inline `t()` usage in JSX.

**Correct examples**:
```tsx
// Text content - use Trans
<Trans>Settings</Trans>

// Props - use t function
<Button title={t`Save`} />
<MyComponent label={t`Name`} placeholder={t`Enter name`} />

// Variable - use t function
const title = t`Accounts`;

// Utility function - import msg, return MessageDescriptor
// utils/get-label.util.ts
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const getLabel = (): MessageDescriptor => msg`Label`;

// Component - use i18n.t() to translate
const { i18n } = useLingui();
const label = i18n.t(getLabel());
```
**Incorrect examples**:
```tsx
// Don't use t for text content
<Text>{t`Settings`}</Text>

// Don't use Trans for props
<MyComponent label={<Trans>Name</Trans>} />

// Don't pass translation function as argument
const getLabel = (t: SomeType): string => t`Label`;
```

### Forms
- **Library:** React Hook Form + Zod validation
- **Schemas & Types:** Use input schemas and interfaces from `@budgie/contracts` directly
  - Import `[Entity]CreateInputSchema` for form validation with `zodResolver`
  - Import `[Entity]CreateInputInterface` for form type annotations
  - **Never create custom form types** - use contracts interfaces directly
  - **Never re-export schemas/interfaces** - import directly from `@budgie/contracts`
  ```tsx
  // Good - Import directly from contracts
  import { BudgetCreateInputInterface, BudgetCreateInputSchema } from '@budgie/contracts';

  const form = useForm<BudgetCreateInputInterface>({
      resolver: zodResolver(BudgetCreateInputSchema)
  });

  // Bad - Creating custom type aliases
  export type BudgetFormValues = BudgetCreateInputInterface; // Don't do this

  // Bad - Re-exporting from contracts
  export { BudgetCreateInputSchema }; // Don't do this
  ```
- **Best Practice:** Use `FormProvider` and `useFormContext` to avoid prop drilling
  ```tsx
  // Good - Use FormProvider at form root
  import { FormProvider } from 'react-hook-form';

  const MyForm = () => {
      const form = useForm();
      return (
          <FormProvider {...form}>
              <FormField name="email" />
              <FormField name="password" />
          </FormProvider>
      );
  };

  // Good - Use useFormContext in child components
  import { useFormContext } from 'react-hook-form';

  const FormField = ({ name }) => {
      const { control, formState } = useFormContext();
      return <Controller name={name} control={control} />;
  };

  // Bad - Prop drilling control/setValue through components
  const MyForm = () => {
      const { control, setValue } = useForm();
      return (
          <>
              <FormField control={control} setValue={setValue} />
              <AnotherField control={control} setValue={setValue} />
          </>
      );
  };
  ```

### Styling
- **Framework:** NativeWind (Tailwind CSS for React Native)
- **Global Styles:** `packages/app/src/global.css`
- **Components:** Tailwind utility classes with `class-variance-authority` for variants

### Internationalization (i18n)
- **Library:** Lingui with compiled catalogs
- **Supported Languages:** English, French, Spanish, Ukrainian, German
- **Workflow:** Extract with `yarn i18n:extract`, compile with `yarn i18n:compile`, or use `yarn i18n:sync`
- **App Locales:** `packages/app/src/locales/`
- **Landing Locales:** `packages/landing/src/locales/`

## TypeScript & Coding Standards

### Critical Rules

1. **Never use `any` type** - Everything must be properly typed. No exceptions.
2. **Never use type assertions** - Never use `as` type casting (e.g., `foo as SomeType`). If types don't match, fix the actual types.
3. **No type circumvention** - Never use `@ts-ignore`, `@ts-expect-error`, `as any`, or any form of type assertion
4. **Never write comments** - Code should be self-documenting with clear method and variable names
5. **Maximize TypeScript usage** - Leverage the type system fully, let TypeScript infer types when possible
6. **Never use `let`** - Prefer `const` with functional patterns like `reduce`, `map`, or recursion
   ```typescript
   // Good - Functional approach with reduce
   const { periods } = items.reduce<{ periods: Period[]; lastDate: Date }>(
       ({ periods, lastDate }) => ({
           periods: [...periods, createPeriod(lastDate)],
           lastDate: nextDate
       }),
       { periods: [], lastDate: startDate }
   );

   // Bad - Mutable let variables
   let periods = [];
   let lastDate = startDate;
   for (let i = 0; i < count; i++) {
       periods.push(createPeriod(lastDate));
       lastDate = nextDate;
   }
   ```
7. **Use descriptive variable names** - Never use short/abbreviated names like `tx`, `al`, `ai`, `inst`
   ```typescript
   // Good
   await db.transaction(async transaction => {
       const instance = await repository.create(data, transaction);
       const allocation = allocations.find(allocation => allocation.id === id);
   });

   // Bad
   await db.transaction(async tx => {
       const inst = await repository.create(data, tx);
       const al = allocations.find(a => a.id === id);
   });
   ```
8. **Prefer concise setState calls** - Pass boolean expressions directly instead of if/else blocks
   ```typescript
   // Good
   setShouldAutoFocus(sheetIndex >= 0);

   // Bad
   if (sheetIndex >= 0) {
       setShouldAutoFocus(true);
   } else {
       setShouldAutoFocus(false);
   }
   ```

6. **Prefer explicit JSX over array mapping for fixed-size arrays** - When rendering a known, fixed number of elements, write explicit JSX instead of creating arrays and mapping
   ```tsx
   // Good - Explicit and clear
   return (
       <>
           <TabButton label="Expense" variant="expense" />
           <TabButton label="Income" variant="income" />
           <TabButton label="Transfer" variant="neutral" />
       </>
   );

   // Bad - Unnecessary abstraction for fixed data
   const tabs = [
       { label: 'Expense', variant: 'expense' },
       { label: 'Income', variant: 'income' },
       { label: 'Transfer', variant: 'neutral' },
   ];
   return <>{tabs.map(tab => <TabButton key={tab.label} {...tab} />)}</>;
   ```
   Note: Use `.map()` only for dynamic data (from API, database, props, etc.)

### Naming Conventions
- **Interfaces:** Must end with `Interface` (e.g., `AccountFilterInterface`)
- **Enums:** Must end with `Enum` (e.g., `AccountTypeEnum`)
- **Functions:** Use module name as prefix (e.g., `exchangeRatesFetchApi`)
- **Classes:** PascalCase (e.g., `AccountRepository`)
- **Files:** kebab-case matching exported entity + type suffix (`.service.ts`, `.repository.ts`, `.constant.ts`)
- **Types:** Store type aliases in separate `.type.ts` files with contextual names
  ```typescript
  // Bad - Inline type in component file
  type StatusType = 'positive' | 'negative';
  export const Component = () => { ... };

  // Bad - Generic name without context
  // status.type.ts
  export type StatusType = 'positive' | 'negative';

  // Good - Contextual name reflecting usage
  // budget-amount-status.type.ts
  export type BudgetAmountStatusType = 'positive' | 'negative';

  // budget-amount-display.tsx
  import { BudgetAmountStatusType } from './budget-amount-status.type';
  ```

### Module Organization

**General Structure:**
- Follow modular architecture with clear separation: `api/`, `repository/`, `service/`, `constant/`, `interface/`, `enum/`
- Single Responsibility Principle - one file, one entity, one purpose
- **No barrel exports in app package** - Import directly from specific files (no `index.ts` re-exports within app)
  - ✅ Allowed: Root-level barrel exports in library packages (contracts, shared libraries)
  - ❌ Forbidden: Any `index.ts` files within `packages/app/src/` directory structure
  - Always use direct imports: `from './component-name/component-name'` not `from './component-name'`
- **Flat structure** - Avoid deep nesting; entity/[file-type]/[file].ts not entity/[file-type]/[nested]/[file].ts

**Component Organization:**
- **One component per file** - Each `.tsx` file (route or component) should export exactly one default component
- Each component must be in its own folder: `component-name/component-name.tsx`
- Related files (types, utils, hooks) live in the same folder
- Folder name and main file name must match exactly (kebab-case)
- **Never group multiple components under a parent folder** - each component gets its own top-level folder
- **Avoid wrapper components that only pass props or group components** - Don't create components that just:
  - Extract values from context and pass them as props to existing components
  - Simply group other components without adding logic

  Inline them instead in the consuming component.

  ```tsx
  // Bad - Unnecessary context wrapper
  export const FormComment = () => {
      const { control } = useFormContext();
      return <FormCommentBase control={control} />;
  };

  // Bad - Unnecessary grouping wrapper
  export const FormMetadataFields = ({ control, variant }) => (
      <FormLayoutGroup variant="horizontal">
          <FormDateField control={control} variant={variant} />
          <FormTagsField control={control} variant={variant} />
      </FormLayoutGroup>
  );

  // Good - Inline directly in parent component
  return (
      <FormLayoutGroup variant="horizontal">
          <FormDateField control={control} variant={variant} />
          <FormTagsField control={control} variant={variant} />
      </FormLayoutGroup>
  );
  ```

Examples:
```
✓ Good
packages/app/src/@generic/component/
├── bottom-sheet/
│   └── bottom-sheet.tsx
├── amount-input/
│   └── amount-input.tsx
├── transaction-card/
│   ├── transaction-card.tsx
│   └── transaction-card.util.ts
├── transaction-form-root/
│   └── transaction-form-root.tsx
└── transaction-form-amount/
    └── transaction-form-amount.tsx

✗ Bad
packages/app/src/@generic/component/
├── bottom-sheet.tsx                    # Missing folder
├── forms/
│   └── amount-input/                   # Too nested
│       └── amount-input.tsx
├── transaction/
│   └── card/                           # Should be transaction-card/
│       └── card.tsx
└── transaction-form/                   # Never group multiple components
    ├── root.tsx                        # Each should have own folder
    ├── amount.tsx
    └── category.tsx
```

**Entity Structure (Contracts Package):**
Each entity follows flat organization:
```
entity-name/
├── constant/[file].constant.ts         # NOT constant/validators/[file].ts
├── entity/[file].entity.ts             # NOT entity/types/[file].ts
├── enum/[file].enum.ts
├── input/[file].input.ts
├── interface/[file].interface.ts
├── repository/[name].repository.ts
├── relations/[name].relations.ts
├── schema/[name].schema.ts
└── table/[name].table.ts
```
Never nest beyond this level - all files within a type folder should be direct children.

### Type Guards (Use @rnw-community/shared)
Always use these type guards instead of manual checks:
- `isDefined()` - for nullish checks (never use `!== null`, `!== undefined`, or `??`)
- `isNotEmptyArray()` - for array validation
- `isNotEmptyString()` - for string validation
- `isPositiveNumber()` - for numeric validation

### Code Duplication (jscpd)

**Route Files in `src/app/`:**
- Use `/* jscpd:ignore-start */` and `/* jscpd:ignore-end */` to wrap **JSX only**
- Place ignore comments around the JSX return statement to prevent false positives on similar form structures
- Never ignore business logic or hooks - only the presentational JSX

**Example:**
```tsx
export default function CreateExpenseTransactionPage() {
    const { form, handleSubmit } = useCreateTransactionForm({ ... }); // Not ignored
    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' }); // Not ignored

    const handleGoBack = () => void goBackOrReplace('/'); // Not ignored

    /* jscpd:ignore-start */
    return (
        <FormProvider {...form}>
            <Page header={...} footer={...}>
                <TransactionFormAmount ... />
                <TransactionFormCategory ... />
            </Page>
        </FormProvider>
    );
    /* jscpd:ignore-end */
}
```

**Why:** Route files often share similar JSX structure (forms, layouts) but have different business logic. Ignoring only JSX prevents jscpd from flagging legitimate structural similarities while still detecting duplicated logic.

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
8. **Type guards** - Use `@rnw-community/shared` for checks: `isNotEmptyArray()`, `isNotEmptyString()`, `isPositiveNumber()`. For simple null/undefined checks on functions, prefer optional chaining: `callback?.(value)` instead of `if (isDefined(callback)) callback(value)`
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
10. **Single const declarations** - Each variable gets its own `const` declaration
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
11. **Never disable ESLint without approval** - NEVER add `eslint-disable` comments or similar suppressions without explicit user approval. Always fix the underlying issue or ask the user first.

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
   - **Scopes:** Use monorepo package names WITHOUT prefix: `app`, `contracts`, `landing`, `bank-sync`
   - **Examples:** `feat(app): add dark mode`, `fix(contracts): update schema`, `chore(landing): update deps`
   - **PR titles:** Must follow the same convention as commit messages

## PR Review

- **Only address human reviewer feedback** - Never fix comments from Claude, Copilot, or other AI assistants without explicit human confirmation
- **Validate all AI suggestions** - AI-generated review comments may be incorrect or out of context

## Important Notes

- Always use `yarn` (never `npm`)
- After table changes in contracts: `cd packages/app && yarn db:generate`
- Never modify `.jscpd.json` - fix duplication in source
- Known acceptable warnings: empty interfaces, magic numbers in tests
