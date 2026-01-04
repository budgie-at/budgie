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

### Service Layer
- Services are classes (not functions) that orchestrate business logic
- Export singleton instances (e.g., `export const myService = new MyService()`)
- Services compose API and repository layers
- Public methods first, then private methods (follow `@typescript-eslint/member-ordering`)
- **Never create wrapper methods** - Don't create service methods that just delegate to a single repository method. Use repository methods directly instead.
  ```typescript
  // Bad - Unnecessary wrapper method
  class BudgetService {
      async deleteBudget(id: number) {
          return budgetRepository.deleteById(id);
      }
  }
  // Usage: await budgetService.deleteBudget(id);

  // Good - Use repository directly
  // Usage: await budgetRepository.deleteById(id);
  ```
  Service methods should only exist when they:
  - Orchestrate multiple repository/API calls
  - Contain business logic beyond simple CRUD
  - Manage transactions across multiple operations

### Layered Architecture
1. **API Layer:** External service communication (third-party APIs)
2. **Repository Layer:** Database operations (SQLite via Drizzle)
3. **Service Layer:** Business logic orchestration
4. **Task Layer:** Background job registration (Expo TaskManager)

### Background Tasks
- Named with `.task.ts` suffix
- Registration logic is part of the service class
- Import task definitions in app entry point to ensure `TaskManager.defineTask` runs

### Navigation & Routing
- **Framework:** Expo Router (file-based routing)
- **Structure:** Routes defined in `packages/app/src/app/`
- **Tabs:** Main navigation uses tab layout in `app/(tabs)/`

**Routing Architecture:**
- **One component per file** - Each route file should export a single default component
- **Direct routes over dynamic routes** - Prefer explicit route files (`expense.tsx`, `income.tsx`, `transfer.tsx`) over dynamic routes with switch statements (`[type].tsx`)
- **Nested routes for variants** - When a resource has multiple forms/views, use nested folders:
  ```
  transactions/[id].tsx          # Router redirects by type
  transactions/[id]/expense.tsx  # Specific form
  ```
- **Inline all logic** - Route components should contain all their logic directly, not delegate to wrapper components
- **Never create shared screen components** - Don't create components like `EntityFormScreen` that multiple routes share. Each route (`create.tsx`, `[id].tsx`) should contain its own form JSX inline, even if similar. This ensures:
  - Routes are self-contained and easy to understand
  - Changes to one route don't accidentally affect others
  - No unnecessary abstraction layers
  ```tsx
  // Bad - Shared screen component
  // rule-form-screen.tsx
  export const RuleFormScreen = ({ ruleId, defaultValues }: Props) => {
      const { form } = useRuleForm({ ruleId, defaultValues });
      return <Page>...</Page>;
  };
  // create.tsx
  export default function CreateRulePage() {
      return <RuleFormScreen />;
  }
  // [id].tsx
  export default function EditRulePage() {
      return <RuleFormScreen ruleId={id} defaultValues={...} />;
  }

  // Good - Each route contains its own form inline
  // create.tsx
  export default function CreateRulePage() {
      const { form } = useRuleForm();
      return <Page>... form JSX here ...</Page>;
  }
  // [id].tsx
  export default function EditRulePage() {
      const { form } = useRuleForm({ ruleId, defaultValues });
      return <Page>... form JSX here ...</Page>;
  }
  ```
- **Router pattern** - Parent `[id].tsx` determines transaction type and redirects to specific route:
  ```tsx
  // transactions/[id].tsx - Lightweight router
  export default function TransactionDetailsScreen() {
      const { transaction } = useGetTransactionByIdQuery(id);

      if (isExpenseTransaction(transaction)) {
          return <Redirect href={`/transactions/${id}/expense`} />;
      }
      // ... other type checks
  }
  ```

**Example Structure:**
```
app/(main)/
├── create-transaction/
│   ├── expense.tsx       # Create expense (direct route)
│   ├── income.tsx        # Create income (direct route)
│   └── transfer.tsx      # Create transfer (direct route)
└── transactions/
    ├── [id].tsx          # Router: redirects to /[id]/expense|income|transfer
    └── [id]/
        ├── expense.tsx   # Update expense form
        ├── income.tsx    # Update income form
        └── transfer.tsx  # Update transfer form
```

### State Management
- React Context + hooks (no Redux/MobX)
- TanStack Query for server state (mentioned in README)
- Zustand/Jotai for client state (mentioned in README)

### React Compiler (React 19)
This project uses React 19 with React Compiler enabled. The compiler automatically memoizes components, values, and callbacks.

**Rules:**
- **Never use `useMemo`** - the compiler handles value memoization automatically
- **Never use `useCallback`** - the compiler handles function memoization automatically
- **Never use `React.memo`** - the compiler handles component memoization automatically
- **Never use `forwardRef`** - React 19 supports `ref` as a regular prop
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

**Refs in React 19:**
```tsx
// Good - ref as a regular prop (React 19)
interface Props {
    ref: Ref<SomeInterface | null>;
    title: string;
}

export const MyComponent = ({ ref, title }: Props) => (
    <ChildComponent ref={ref} title={title} />
);

// Bad - Using forwardRef (deprecated pattern)
const MyComponent = forwardRef<SomeInterface, Props>(({ title }, ref) => (
    <ChildComponent ref={ref} title={title} />
));
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
- **Schemas & Types:** All input schemas and interfaces must live in `@budgie/contracts`
  - Input schemas go in `entity/schema/[entity]-create-input.schema.ts`
  - Input interfaces go in `entity/input/[entity]-create-input.interface.ts`
  - Create input schemas by extending entity schemas using Zod's `.extend()` or `.omit()` methods
  - Infer interfaces from schemas using `extends infer<typeof Schema>`
  - **Never create schemas or form types in the app package** - always define in contracts
  ```typescript
  // Good - Define input schema in contracts extending entity schema
  // packages/contracts/src/rule/schema/rule-create-input.schema.ts
  import { RuleCreateEntitySchema } from './rule-create-entity.schema';
  import { RuleConditionCreateInputSchema } from '../../rule-condition/schema/rule-condition-create-input.schema';

  export const RuleCreateInputSchema = RuleCreateEntitySchema.extend({
      conditions: array(RuleConditionCreateInputSchema),
      actions: array(RuleActionCreateInputSchema)
  });

  // Good - Define input interface in contracts inferring from schema
  // packages/contracts/src/rule/input/rule-create-input.interface.ts
  import { infer } from 'zod';
  import { RuleCreateInputSchema } from '../schema/rule-create-input.schema';

  export interface RuleCreateInputInterface extends infer<typeof RuleCreateInputSchema> {}

  // Good - Import directly from contracts in app
  import { RuleCreateInputInterface, RuleCreateInputSchema } from '@budgie/contracts';

  const form = useForm<RuleCreateInputInterface>({
      resolver: zodResolver(RuleCreateInputSchema)
  });

  // Bad - Creating schemas in app package
  // packages/app/src/rule/schema/rule-form.schema.ts  // Don't do this!

  // Bad - Creating custom type aliases
  export type RuleFormValues = RuleCreateInputInterface; // Don't do this
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
- **Color classes must match global.css variables** - Use full variable names from global.css
  ```tsx
  // Good - Matches --color-destructive-foreground from global.css
  <Icon className="text-destructive-foreground" />
  <View className="bg-positive-background border-warning-corner" />

  // Bad - Incomplete variable name
  <Icon className="text-destructive" />  // Should be text-destructive-foreground
  <View className="bg-positive" />  // Should be bg-positive-background
  ```

### Toast Messages
- **Only show toasts for errors** - Never show success toasts for positive/expected outcomes
- Users expect actions to succeed; only notify them when something goes wrong
- Error toasts should include helpful context about what failed
```typescript
// Good - Only show toast on error
const handleSubmit = async () => {
    try {
        await service.doAction();
        bottomSheetRef.current?.close();
    } catch {
        Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to complete action` });
    }
};

// Bad - Unnecessary success toast
const handleSubmit = async () => {
    try {
        await service.doAction();
        Toast.show({ type: 'success', text1: t`Success`, text2: t`Action completed` }); // Don't do this
    } catch {
        Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to complete action` });
    }
};
```

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
7. **Use descriptive variable names** - Never use short/abbreviated names like `tx`, `al`, `ai`, `inst`, `opt`, `val`, `el`, `cb`, `fn`
   ```typescript
   // Good
   await db.transaction(async transaction => {
       const instance = await repository.create(data, transaction);
       const allocation = allocations.find(allocation => allocation.id === id);
   });
   const translatedOptions = options.map(option => ({ value: option.value, label: option.label }));

   // Bad
   await db.transaction(async tx => {
       const inst = await repository.create(data, tx);
       const al = allocations.find(a => a.id === id);
   });
   const translatedOptions = options.map(opt => ({ value: opt.value, label: opt.label }));
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
9. **Use library types over inline definitions** - When typing callback parameters or return values from third-party libraries, use the types exported by that library instead of defining inline types
   ```typescript
   // Good - Use library's exported type
   import { UseControllerReturn } from 'react-hook-form';

   const renderField = ({ field }: UseControllerReturn<FormValues, 'email'>) => (
       <Input value={field.value} onChange={field.onChange} />
   );

   // Bad - Inline type definition duplicating library types
   const renderField = ({ field }: { field: { value: string; onChange: (v: string) => void } }) => (
       <Input value={field.value} onChange={field.onChange} />
   );
   ```

10. **Prefer explicit JSX over array mapping for fixed-size arrays** - When rendering a known, fixed number of elements, write explicit JSX instead of creating arrays and mapping
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

11. **Prefer readability over shortness** - Write clear, readable code instead of clever one-liners. Use explicit if statements instead of short-circuit evaluation for side effects.
   ```typescript
   // Good - Clear and readable
   const removeItem = (index: number) => {
       if (items.length > 1) {
           remove(index);
       }
   };

   // Bad - Confusing short-circuit pattern
   const removeItem = (index: number) => void (items.length > 1 && remove(index));
   ```

12. **Never create type aliases inside functions or components** - Use types directly instead of creating wrapper aliases. This keeps code simple and avoids unnecessary indirection.
   ```typescript
   // Good - Use types directly
   const getLabel = (value: FieldValueType<T>) => options.find(o => o.value === value)?.label;
   const render = ({ field }: UseControllerReturn<FormInterface, `items.${number}.${T}`>) => <Input />;

   // Bad - Unnecessary type aliases inside function
   const Component = <T,>() => {
       type ValueType = FieldValueType<T>;  // Don't do this
       type FieldName = `items.${number}.${T}`;  // Don't do this
       const getLabel = (value: ValueType) => ...;
   };
   ```

### Naming Conventions
- **Interfaces:** Must end with `Interface` (e.g., `AccountFilterInterface`)
- **Enums:** Must end with `Enum` (e.g., `AccountTypeEnum`)
- **Functions:** Use module name as prefix (e.g., `exchangeRatesFetchApi`)
- **Classes:** PascalCase (e.g., `AccountRepository`)
- **Files:** kebab-case matching exported entity + type suffix (`.service.ts`, `.repository.ts`, `.constant.ts`)
- **Types & Interfaces:** Always extract to separate files - never define inline in component files
  - Type aliases go in `.type.ts` files with contextual names
  - Interfaces go in `.interface.ts` files (except `Props` interface which stays in component file)
  - Only the `Props` interface for a component should remain in the component file
  ```typescript
  // Bad - Inline types in component file
  type ConditionFieldType = 'field' | 'operator';
  interface OptionInterface { value: string; label: string; }
  export const Component = () => { ... };

  // Good - Separate files for each type/interface
  // condition-field.type.ts
  export type ConditionFieldType = 'field' | 'operator';

  // option.interface.ts
  export interface OptionInterface { value: string; label: string; }

  // component.tsx
  import { ConditionFieldType } from './condition-field.type';
  import { OptionInterface } from './option.interface';

  interface Props {  // Props interface stays in component file
      readonly options: OptionInterface[];
  }
  export const Component = ({ options }: Props) => { ... };
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

- **Conditional rendering belongs in parent components** - Never use early `return null` inside a component based on props. The parent should decide whether to render a child.
  ```tsx
  // Bad - Hidden conditional rendering inside component
  export const MatchTypeSelector = ({ itemCount }: Props) => {
      if (itemCount < 2) {
          return null;
      }
      return <Controller ... />;
  };
  // Usage: <MatchTypeSelector itemCount={items.length} />

  // Good - Parent controls rendering
  export const MatchTypeSelector = () => {
      return <Controller ... />;
  };
  // Usage: {items.length >= 2 && <MatchTypeSelector />}
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
5. **Commit format:** `type(scope): description` (conventional commits)
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
