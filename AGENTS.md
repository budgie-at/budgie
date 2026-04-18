# CLAUDE.md

Budgie is an offline-first mobile expenses tracker. Monorepo with 5 packages: app (React Native), contracts (shared types), ai (AI/LLM services), landing (Next.js), and bank-sync (bank integrations).

## Commands

```bash
# Setup
yarn install                              # Always run first

# Build
yarn build                                # Build all packages
yarn build:force                          # Build without cache

# Validation (run in this order before committing)
yarn format                               # Prettier (run first - may modify files)
yarn ts                                   # TypeScript check
yarn lint                                 # ESLint (skip during debug sessions)
yarn deadcode                             # Knip dead code detection
yarn cpd                                  # Code duplication check

# IMPORTANT: After completing any task, ALWAYS run:
# During debug sessions (when user says "skip lint"), only run: yarn ts
# Otherwise run full validation:
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd

# Utilities
yarn deps:check                           # Check dependency versions
yarn deps:dedupe                          # Deduplicate dependencies
```

## Pull Requests

### PR Title Format

Use Conventional Commits for PR titles:

```text
type(scope): short description
```

For repo-wide or root-level changes, omit the scope:

```text
type: short description
```

Examples:
- `feat(app): add recurring transaction editor`
- `fix(contracts): correct transaction tag schema`
- `refactor(ai): simplify embedding service flow`
- `chore: migrate Claude docs to AGENTS`

### Allowed Scopes

Use the repo package scopes without the npm namespace prefix:
- `app`
- `contracts`
- `ai`
- `landing`
- `bank-sync`

### Scope Selection Rules

1. Use the package scope when the change is isolated to one package.
2. Omit the scope when the change touches multiple packages, root documentation, workspace tooling, shared agent configuration, or other repo-wide files.
3. Keep the description short, imperative, and specific to the user-visible or developer-visible outcome.
4. Prefer `refactor`, `feat`, `fix`, `chore`, `docs`, `test`, or `build` as the type.

## Structure

```
packages/
├── app/                # React Native (Expo 54) - main mobile app
├── ai/                 # Pure TypeScript AI/LLM services
├── contracts/          # Shared TypeScript schemas, types, repositories
├── landing/            # Next.js 15 marketing site
└── bank-sync/          # Bank integration package
```

## Architecture Layers

1. **API** - External service calls (fetch, ky)
2. **Repository** - Database operations (Drizzle ORM)
3. **Service** - Business logic orchestration
4. **Task** - Background jobs (`.task.ts` suffix)

## Critical Rules

1. **No `any` type** - Everything properly typed
2. **No type assertions** - Never use `as Type`, `@ts-ignore`, `@ts-expect-error` (`as const` is allowed — it's a const assertion, not a type assertion)
3. **No comments** - Self-documenting code with clear names
4. **Never disable ESLint without approval** - NEVER add `eslint-disable` comments without explicit user approval
5. **Single const declarations** - Each variable gets its own `const` declaration
6. **Use `emptyFn` for no-op callbacks** - Use `emptyFn` from `@rnw-community/shared` instead of `() => void 0`
7. **No IIFEs** - Use `.catch(handleError)` or `.then(onSuccess, onError)` instead of `void (async () => {})()`
8. **Use `getErrorMessage`** - Use `getErrorMessage(e)` from `@rnw-community/shared` instead of `e instanceof Error ? e.message : String(e)`
9. **One component per folder** - Each component file lives in its own folder
10. **Constants in `/constant` folder** - Constant files go in the module's `constant/` folder, not alongside components. This includes Zod schemas and their inferred types used by forms.
11. **Use `t` macro for string props** - Use `t\`text\`` from `@lingui/react/macro` for string props (like `content={t\`Cancel\`}`), `<Trans>` only for direct JSX text children
12. **No abbreviated variable names** - Use full descriptive names (`category` not `cat`, `transaction` not `tx`, `account` not `acc`)
13. **No complex logic in JSX props** - Extract ternaries/logical operators to variables before JSX
14. **Utility functions in `/utils` folder** - Extract reusable functions to module's `utils/` folder with `.util.ts` suffix
15. **Pick minimal interface properties** - Use `Pick<EntityInterface, 'prop'>` when only specific properties are needed
16. **No redundant wrapper functions** - Don't create functions that only delegate to another function without adding logic. If a lint rule prevents inline callbacks, the wrapper is acceptable
17. **Use microunits utility functions** - Use `convertFromMicroUnits()` and `convertToMicroUnits()` for amount conversion instead of manual `/ PRECISION` or `* PRECISION`
18. **Spread syntax for optional params** - Use `...(isPositiveNumber(x) && { x })` instead of `x: isPositiveNumber(x) ? x : undefined` with eslint-disable
19. **Interfaces in separate files** - Repository-specific interfaces go in `/interface` folder, not inline in repository files
20. **Type guards in separate files** - Type guards go in `/type-guard` folder with `.type-guard.ts` suffix
21. **Group useWatch calls together** - In React components, keep all `useWatch` calls together near other hooks, not scattered throughout the component
22. **Services use classes, not utility functions** - Service files (`.service.ts`) should export a class instance, not standalone functions
23. **One utility per file** - Each utility function should be in its own file with `.util.ts` suffix, don't combine multiple utilities
24. **Re-export from package index** - Don't create intermediate export files (like `erste.ts`), re-export directly from `index.ts`
25. **Class method ordering** - Public methods come before private methods in class definitions
26. **Always brace control-flow bodies** - Every `if`, `else`, `for`, `while`, and `do` body must be wrapped in `{ }`, even for single statements. Enforced by ESLint `curly: ['error', 'all']` and `nonblock-statement-body-position: ['error', 'below']`.
27. **No unit tests** - This project does not use Jest or other unit testing frameworks. Do not add `.spec.ts` / `.test.ts` files, jest config files, or `test` scripts. E2E coverage lives in the `tests/` workspace via Maestro; verification at the code level is done via `yarn ts`, `yarn lint`, `yarn deadcode`, `yarn cpd`, manual testing, and — for SQL — `EXPLAIN QUERY PLAN` plus the bench harness under `packages/app/scripts/`.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interface | `*Interface` suffix | `AccountFilterInterface` |
| Enum | `*Enum` suffix | `AccountTypeEnum` |
| Function | module prefix | `exchangeRatesFetchApi` |
| Class | PascalCase | `AccountRepository` |
| File | kebab-case + type suffix | `account.service.ts` |

### Type Guards and Validation

**Prefer `@rnw-community/shared` type guards over manual checks:**
- `isDefined(x)` instead of `x !== null && x !== undefined` or `x !== null`
- `isNumber(x)` instead of `typeof x === 'number'`
- `isNotEmptyArray(x)` instead of `Array.isArray(x) && x.length > 0`
- `isEmptyArray(x)` instead of `x.length === 0`
- `isNotEmptyString(x)` instead of `typeof x === 'string' && x.length > 0`
- `isPositiveNumber(x)` instead of `typeof x === 'number' && x > 0` or `x > 0`

**Use `isDefined` for ref checks too:**
```typescript
// Good
if (isDefined(timerRef.current)) { clearTimeout(timerRef.current); }

// Bad
if (timerRef.current !== null) { clearTimeout(timerRef.current); }
```

**Prefer `.filter(isDefined)` over manual type guard filters:**
```typescript
// Good
items.map(transform).filter(isDefined)

// Bad
items.map(transform).filter((item): item is ItemType => item !== null)
```

**Only use `.filter(isDefined)` when nulls are possible:**
```typescript
// Good - when transform can return null
items.map(item => item.optionalField).filter(isDefined)

// Bad - unnecessary filter when array type doesn't allow null
const numbers: number[] = [1, 2, 3];
numbers.filter(isDefined)  // Unnecessary, array can't have nulls
```

**Prefer Zod for complex object validation:**
```typescript
// Good - Zod schema
const ItemSchema = z.object({ id: z.number(), name: z.string() });
const result = ItemSchema.safeParse(data);
if (result.success) { /* use result.data */ }

// Bad - manual type guard
const isItem = (x: unknown): x is Item =>
    typeof x === 'object' && x !== null && 'id' in x && typeof x.id === 'number';
```

**Form schemas belong in `/constant` folder:**
```typescript
// Good - schema in constant file
// src/transaction/constant/convert-to-transfer-schema.constant.ts
export const ConvertToTransferSchema = z.object({
    accountId: z.number().positive()
});
export type ConvertToTransferFormValues = z.infer<typeof ConvertToTransferSchema>;

// Then import in component
import { ConvertToTransferFormValues, ConvertToTransferSchema } from '../../constant/convert-to-transfer-schema.constant';

// Bad - schema defined inline in component
const ConvertToTransferSchema = z.object({ accountId: z.number().positive() });
type ConvertToTransferFormValues = z.infer<typeof ConvertToTransferSchema>;
```

For simple null/undefined checks on functions, prefer optional chaining: `callback?.(value)`

**Check object property values, not just object existence:**
```typescript
// Good - check if date range has actual values before using
const hasDateRange = isDefined(filters.date) && (isDefined(filters.date.from) || isDefined(filters.date.to));
if (hasDateRange) {
    conditions.push(this.buildDateCondition(filters.date));
}

// Bad - object exists but may have all null properties
if (isDefined(filters.date)) {
    conditions.push(this.buildDateCondition(filters.date)); // Returns undefined if both from/to are null!
}
```

**Microunits conversion:**
```typescript
// Good - use utility functions
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
const displayAmount = convertFromMicroUnits(pattern.averageAmount);
const microAmount = convertToMicroUnits(userInputAmount);

// Bad - manual arithmetic with PRECISION
import { PRECISION } from '@budgie/contracts';
const displayAmount = pattern.averageAmount / PRECISION;
const microAmount = Math.round(userInputAmount * PRECISION);
```

**Optional params with spread syntax:**
```typescript
// Good - spread syntax (no eslint-disable needed)
const params = {
    type,
    accountId,
    ...(isPositiveNumber(amount) && { amount }),
    ...(isPositiveNumber(categoryId) && { categoryId })
};

// Bad - ternary with undefined requires eslint-disable
const params = {
    type,
    accountId,
    amount: isPositiveNumber(amount) ? amount : undefined, // eslint-disable-line no-undefined
    categoryId: isPositiveNumber(categoryId) ? categoryId : undefined // eslint-disable-line no-undefined
};
```

**Contracts package file organization:**
```
transaction/
├── interface/
│   ├── pattern-row.interface.ts         # Repository-specific interfaces
│   ├── valid-pattern-row.interface.ts
│   └── transaction-pattern-query.interface.ts
├── type-guard/
│   └── is-valid-pattern-row.type-guard.ts  # Type guards in separate folder
└── repository/
    └── transaction-pattern.repository.ts   # Clean repository, imports from above
```

### i18n (Lingui) Usage

**Use `t` macro for string props, `<Trans>` for JSX text children:**

```typescript
// Good - t macro for string props
<Button content={t`Cancel`} />
<PageHeader title={t`Edit Expense`} />
<Toast text1={t`Conversion failed`} />

// Good - Trans for direct JSX text children
<Text><Trans>Select the destination account</Trans></Text>
<FormSheetHeader><Trans>Convert to Transfer</Trans></FormSheetHeader>

// Bad - Trans for string props (renders ReactNode, not string)
<Button content={<Trans>Cancel</Trans>} />  // Wrong!
```

**Conditional i18n text:**
```typescript
// Good - extract to variable first
const accountLabel = isExpense ? t`Select destination account` : t`Select source account`;
<SimpleHorizontalCell title={accountLabel} />

// Good - conditional Trans in JSX children
<Text>
    {isExpense ? (
        <Trans>Select the destination account for this transfer.</Trans>
    ) : (
        <Trans>Select the source account for this transfer.</Trans>
    )}
</Text>
```

**i18n file structure:**
Both `.po` (source) and `.ts` (compiled) files are required and must be committed:
- `.po` files - source translations, editable by translators
- `.ts` files - compiled messages, generated by `yarn i18n:sync`, required at runtime

After modifying user-facing text, run `yarn i18n:sync` and commit both file types.

**Adding missing translations:**
1. Run `yarn i18n:sync` to see which locales have missing translations
2. Open `.po` files for each locale (de, es, fr, uk) and find entries with empty `msgstr ""`
3. Add translations for each missing entry
4. Run `yarn i18n:sync` again to compile the `.ts` files
5. Commit both `.po` and `.ts` files

## Tech Stack

| Package | Stack |
|---------|-------|
| **app** | Expo 54, React 19 + Compiler, Expo Router 6, Drizzle ORM, NativeWind 5, Lingui 5.7 |
| **ai** | Pure TypeScript, Zod |
| **contracts** | Drizzle ORM, Zod, drizzle-zod |
| **landing** | Next.js 15, React 19, Tailwind CSS 4, Lingui 5.7 |
| **bank-sync** | ky HTTP client, date-fns |
| **Build** | Yarn 4.12 (PnP), Node >= 22, Lerna 8, TurboRepo 2, TypeScript 5.9, ESLint 9 |

## Workflow

1. **Fresh clone:** `yarn install`
2. **After contracts changes:** `yarn build`
3. **Before commit:** Husky runs `yarn ts`, `yarn lint-staged`, commitlint
4. **Before PR:** Run all validation commands

## E2E Testing

1. Prefer black-box E2E flows over app-owned test hooks.
2. Use real user-visible import paths for database backups and bank PDFs.
3. A deep link is acceptable only for navigation shortcuts, for example opening Settings at a specific anchor.
4. Seed fixtures through simulator or emulator setup scripts, not through hidden app services.
5. If Maestro needs a stable selector for an existing control, add a `testID` to that control instead of using fragile coordinates where possible.
6. Any new `testID` or other app-code change used by E2E requires rebuilding and reinstalling the app before rerunning the test.

### Maestro Robustness

1. Wait for the destination identity once, not container plus child plus redundant assert.
2. After `scrollUntilVisible` on a tappable card inside a scroll view, let the list settle before tapping.
3. Do not wrap ordinary taps in retry loops. If a tap is flaky, fix the state before the tap.
4. Use retries only for real native edge cases like submit/relaunch, not as a generic band-aid.
5. Keep flows state-driven: positive target checks beat blind waits and negative assertions.
6. Date-sensitive fixtures must be refreshed before the suite so test time and app time stay aligned.

### Commit Format

Conventional commits: `type(scope): description`

**Scopes:** Use package names without prefix: `app`, `ai`, `contracts`, `landing`, `bank-sync`

**Examples:**
- `feat(app): add dark mode toggle`
- `fix(contracts): update account schema`
- `chore(landing): update dependencies`

## PR Review

- **Only address human reviewer feedback** - Never fix comments from AI assistants without human confirmation
- **Validate all AI suggestions** - AI-generated review comments may be incorrect
- **Review all changes before finishing** - Check for unused imports and unnecessary code

## Important Notes

- Always use `yarn` (never `npm`)
- After table changes in contracts: `cd packages/app && yarn db:generate`
- Never modify `.jscpd.json` - fix duplication in source code
- Each package has its own CLAUDE.md with package-specific rules

## Token Usage Efficiency

**CRITICAL: Minimize token usage. Avoid looping on lint fixes.**

- If a lint rule (like `max-lines-per-function`) requires multiple refactoring attempts, add `eslint-disable` comment instead
- If Prettier keeps reformatting your changes back, stop and use `eslint-disable`
- Ask for confirmation before attempting complex refactors - do not go back and forth
- Layout files (`_layout.tsx`) inherently need many lines - disable `max-lines-per-function` there
- **NEVER use `jscpd:ignore-start/end` in code files** - only allowed in JSX route files (e.g., `expense.tsx`, `income.tsx`, `transfer.tsx`). Fix duplication in source code by extracting shared logic instead

## Acceptable ESLint Disable Comments

Add `eslint-disable-next-line` with justification for these specific cases:

| Rule | When to Disable | Justification Pattern |
|------|-----------------|----------------------|
| `max-statements` | Form orchestration components with multiple hooks/handlers | `-- Form orchestration component with multiple hooks and handlers` |
| `max-lines-per-function` | Layout files, complex form components | `-- Layout/form component requires many lines` |

Example:
```typescript
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const MyFormComponent = (props: Props) => { ... };
```

## Local Documentation

The `docs/plans/` folder contains design documents and implementation plans. This folder is gitignored for local-only usage - plans are working documents that don't need version control.
