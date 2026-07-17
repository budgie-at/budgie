# App Package (React Native)

Main mobile application built with Expo 54, React 19 + Compiler, Expo Router 6, Drizzle ORM, NativeWind 5, and Lingui 6.1.

## Commands

```bash
yarn start                    # Expo dev server
APP_VARIANT=development EXPO_PUBLIC_AI_DISABLE=true yarn start --port 8082
                              # Expo dev server with @budgie/logger service logs enabled
yarn ios                      # Run on iOS simulator
yarn android                  # Run on Android emulator
yarn web                      # Run on web

yarn db:generate              # Generate Drizzle migrations (after schema changes in contracts)
yarn i18n:sync                # Extract & compile i18n translations

# IMPORTANT: After modifying any user-facing text:
yarn i18n:sync
```

## Structure

```
src/
├── @generic/                 # Shared infrastructure
│   ├── component/            # 80+ reusable UI components
│   ├── constant/             # Color palettes, spacing, icons
│   ├── drizzle/              # Database setup & repository exports
│   ├── hook/                 # Generic hooks
│   ├── interface/            # Shared interfaces
│   ├── provider/             # Context providers
│   ├── service/              # App service
│   ├── type/                 # Type definitions
│   └── utils/                # Utility functions (cn, date, etc.)
├── app/                      # Expo Router screens (30 routes)
│   ├── _layout.tsx           # Root layout with providers
│   ├── (tabs)/               # Tab navigation (main screens)
│   └── (main)/               # Modal/push screens
└── [modules]/                # Feature modules (15+)
    ├── account/
    ├── category/
    ├── transaction/
    └── ...
```

## Code Quality Rules (from PR reviews)

### Use `useDatabaseLiveQuery` for database-backed UI

Import `useDatabaseLiveQuery` from `src/@generic/hook/use-database-live-query.hook` instead of importing Drizzle's `useLiveQuery` directly. The wrapper wires `databaseRefreshService.notifyChanged()` into every live query, so database imports refresh visible screens without duplicated hook dependencies.

### Use `isDefined` for null checks in context hooks

```typescript
// Good
if (!isDefined(context)) {
    throw new Error('...');
}

// Bad
if (context === null) {
    throw new Error('...');
}
```

### Extract inline types to named interfaces

```typescript
// Good - named interface for state shape
interface SuggestionResultInterface<T> {
    readonly key: string | null;
    readonly status: SuggestionInternalStatus;
    readonly suggestions: T[];
}
const [result, setResult] = useState<SuggestionResultInterface<T>>({...});

// Bad - inline type in useState/variable declarations
const [result, setResult] = useState<{ key: string | null; status: SuggestionInternalStatus; suggestions: T[] }>({...});
```

### One interface per file

Never put multiple interfaces in the same file. Each gets its own file in `/interface`:

```
// Good
interface/pattern-config.interface.ts
interface/pattern-facts.interface.ts

// Bad
interface/pattern.interface.ts  (containing both Config and Facts)
```

### Extract complex conditional logic to pure functions

When a component computes derived state through if/else chains, extract to a standalone function:

```typescript
// Good - extracted to a pure function
const computeStatusLabel = (params: StatusParams): StatusResult => {
    if (params.isRunning) return { label: params.phaseLabel, progress: params.progress };
    // ...
};

// Bad - mutable let variables in component body
let statusLabel: string;
let brainProgress: number;
if (isRunning) {
    statusLabel = phaseLabel;
    brainProgress = progress;
}
```

### Use `Trans` for JSX text children, `t` for string props

```typescript
// Good
<Text><Trans>Prepare AI Data</Trans></Text>

// Bad - t macro returns string, Trans is preferred for JSX children
<Text>{t`Prepare AI Data`}</Text>
```

### Use the shared `testID` util for child selectors

When a component derives a child or state-specific `testID` from a base id, use `testID` from `packages/app/src/@generic/utils/test-id.util.ts` (`src/@generic/utils/test-id.util.ts` inside this package) and spread the returned props in JSX:

```tsx
// Good
import { testID } from 'src/@generic/utils/test-id.util';

<Text {...testID(parentTestID, 'Label')} />

// Good when a component prop is also named testID
import { testID as testIDProps } from 'src/@generic/utils/test-id.util';

<Text {...testIDProps(parentTestID, 'Label')} />

// Bad
<Text testID={`${parentTestID}.Label`} />
```

Selector factory files that intentionally define canonical ids are excluded.

### Inline redundant handler wrappers

Don't create named constants that only delegate to another function:

```typescript
// Good - inline in the call site
useLongPressHold({ onPress: () => void start(), onLongPressComplete: () => void startFresh() });

// Bad - redundant intermediaries
const handlePress = () => void start();
const handleLongPressComplete = () => void startFresh();
useLongPressHold({ onPress: handlePress, onLongPressComplete: handleLongPressComplete });
```

### Simplify return-from-transaction patterns

```typescript
// Good - return directly
async updateById(id: number, input: Input): Promise<Entity> {
    return await db.transaction(async tx => { ... });
}

// Bad - unnecessary intermediate variable
async updateById(id: number, input: Input): Promise<Entity> {
    const result = await db.transaction(async tx => { ... });
    return result;
}
```

### Use shared utility functions for common operations

Don't inline `reduce` or similar patterns when a shared util exists:

```typescript
// Good - use shared util
import { sumAmounts } from '../../@generic/util/sum-amounts.util';
const total = sumAmounts(transactions);

// Bad - inline reduce
const total = transactions.reduce((sum, t) => sum + t.amount, 0);
```

### Inline trivial constants used once

Constants like `ICON_SIZE = 20` used only once add indirection without value — inline them. This applies equally to i18n locals (`t\`...\``), derived strings, and other intermediate values:

```typescript
// Good - inline when used once
<Icon size={20} />
const entryLabel = entry.category?.title ?? t`Unknown`;

// Bad - unnecessary constant for single use
const ICON_SIZE = 20;
<Icon size={ICON_SIZE} />

const unknownLabel = t`Unknown`;
const entryLabel = entry.category?.title ?? unknownLabel;
```

## React 19 Rules

1. **No manual memoization** - Never use `useCallback`, `useMemo`, `React.memo` (React 19 Compiler handles this)
2. **No displayName** - Never use `Component.displayName`
3. **No forwardRef** - React 19 handles ref forwarding natively. Accept `ref` as a regular prop:

    ```typescript
    // Good - React 19 native ref
    interface Props {
        ref?: RefObject<ViewRef>;
    }
    export const MyComponent = ({ ref, ...props }: Props) => { ... };

    // Bad - forwardRef
    export const MyComponent = forwardRef<ViewRef, Props>((props, ref) => { ... });
    ```

## Code Organization Rules

### No Complex Logic in JSX Props

Extract ternaries and logical operators to variables before JSX (`@rnw-community/no-complex-jsx-logic`):

```typescript
// Good
const icon = isDefined(account) ? account.icon : UserIconNameEnum.Wallet;
<CircleIcon icon={icon} />

// Bad - Lint error
<CircleIcon icon={isDefined(account) ? account.icon : UserIconNameEnum.Wallet} />
```

### Constants and Utilities

- **Constants** → module's `constant/` folder: `transaction/constant/pressed-scale.constant.ts`
- **Utility functions** → module's `utils/` folder: `transaction/utils/format-operated-at.util.ts`

### Microunits Conversion

Always use utility functions for microunits conversion, never manual `* PRECISION` or `/ PRECISION`:

```typescript
// Good
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
const displayAmount = convertFromMicroUnits(pattern.averageAmount);
const microAmount = convertToMicroUnits(userInputAmount);

// Bad
import { PRECISION } from '@budgie/contracts';
const displayAmount = pattern.averageAmount / PRECISION;
const microAmount = Math.round(userInputAmount * PRECISION);
```

### Remove Useless Wrappers

Don't create single-line wrapper functions that just forward to another function:

```typescript
// Good - Pass directly
<SingleDatePicker onChange={resolveDatePicker} />

// Bad - Useless wrapper
const handleDateSelect = (date: Date) => resolveDatePicker(date);
<SingleDatePicker onChange={handleDateSelect} />
```

### Use Minimal Interface Properties

When only specific properties are needed, use `Pick<>`:

```typescript
// Good
export const getTagsDisplayValue = (tags: Pick<TagEntityInterface, 'title'>[] | null) => { ... };

// Bad - Requires full interface when only title is used
export const getTagsDisplayValue = (tags: TagEntityInterface[] | null) => { ... };
```

## ESLint Disable Guidelines

For form orchestration components that exceed `max-statements` (15), add disable comment:

```typescript
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const TransactionFieldIcons = (props: Props) => { ... };
```

Valid cases for `max-statements` disable:

- Components with 5+ hooks (useFormContext, useWatch, custom hooks)
- Components orchestrating multiple modals/selectors
- Form components with validation and submission logic

## Component Patterns

> Composition rules (prop budget, compound components, explicit variants, hook chains) live in [docs/component-composition.md](../../docs/component-composition.md). The `budgie/max-component-props` lint rule errors above 8 props; refactor with composition instead of growing the grandfather list.

### File Organization

- **One component per file** - Each in own folder: `component-name/component-name.tsx`
- **No barrel exports** - Direct imports only: `./component-name/component-name` not `./component-name`
- **Components belong in entity folders** - Never create components in `src/app/`. All reusable components must be in `src/[entity]/components/`
- **Flat structure** - No deep nesting

### Component Logic Order

Organize component internals in this order, separated by blank lines:

```typescript
export const MyComponent = (props: Props) => {
    // 1. Props destructuring (first line of the component if many props)
    const { variant, onSelect, ...rest } = props;

    // 2. Framework hooks (router, i18n)
    const { t } = useLingui();
    const router = useRouter();

    // 3. State and refs
    const [search, setSearch] = useState('');
    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    // 4. External hooks (queries, mutations, custom hooks)
    const { data } = useMyQuery();

    // 5. Handlers (handle* functions)
    const handleOpen = () => bottomSheetRef.current?.open();

    // 6. Derived values and computed props
    const cardVariant = status === 'error' ? 'destructive' : 'primary';

    // 7. Effects
    useEffect(() => { ... }, []);

    // 8. Render
    return <View>...</View>;
};
```

### Props Patterns

**Naming** - A component's props type is named exactly `Props` and declared inline in the component file — never `*PropsInterface`. Promote to a named `*PropsInterface` in `/interface` only when 2+ components share the same props shape; a single-consumer `*PropsInterface` is prohibited (inline it as `interface Props`, per rule 51).

```typescript
// Good - inline, named Props
interface Props {
    readonly title: string;
    readonly onPress: () => void;
}
export const MyComponent = ({ title, onPress }: Props) => { ... };

// Bad - *PropsInterface for a single component
import type { MyComponentPropsInterface } from '../../interface/my-component-props.interface';
export const MyComponent = ({ title, onPress }: MyComponentPropsInterface) => { ... };
```

**Destructuring** - For 5+ props, destructure in function body:

```typescript
// Good - Destructure in body for many props
export const MyComponent = (props: Props) => {
    const { className, header, footer, children, contentClassName, collapsable = false, ...rest } = props;
};

// Good - Destructure in signature for few props
export const SimpleComponent = ({ title, onPress }: Props) => { ... };
```

**Prefer children for composition:**

```typescript
// Good - children for primary content
<AccountCardBase topRight={<DeadlineIndicator />}>
    <ProgressBar />
</AccountCardBase>

// Bad - named prop for primary content
<AccountCardBase bottomContent={<ProgressBar />} />
```

**No object props** - Pass plain props:

```typescript
// Good
<BottomSheetSearch rightActionIcon={UserIconNameEnum.Plus} rightActionOnPress={handleCreate} />

// Bad
<BottomSheetSearch rightAction={{ icon: UserIconNameEnum.Plus, onPress: handleCreate }} />
```

### Event Handlers

Always extract handlers into named `handle*` methods:

```typescript
// Good
const handleClose = () => void ref.current?.close();
<Button onPress={handleClose} />

// Bad
<Button onPress={() => void ref.current?.close()} />
```

## Styling (NativeWind + CVA)

### CVA for Variants

Always use `class-variance-authority` for components with style variants:

```typescript
import { cva } from 'class-variance-authority';
import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';

const buttonVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'flex-row items-center gap-x-xl justify-center border',
    {
        variants: { variant: BACKGROUND_COLOR_PALETTE },
        defaultVariants: { variant: 'primary' }
    }
);

// Bad - Template strings
className={`bg-${variant}-background text-${variant}-foreground`}
```

### Color Palette Variants

Use centralized palettes from `@generic/constant/`:

- `BACKGROUND_COLOR_PALETTE` - Background + border colors
- `FOREGROUND_COLOR_PALETTE` - Text + icon colors

Available variants: `default`, `destructive`, `warning`, `dark-warning`, `positive`, `ghost`, `pink`, `secondary`, `primary`

### Utility Function

Use `cn()` from `@generic/utils/` for combining classes:

```typescript
import { cn } from '../../utils/cn/cn';
className={cn('base-classes', classNameFromProps)}
```

## Routing (Expo Router)

### Route Organization

- **One component per route file**
- **Prefer direct routes** over dynamic with switch statements:
    ```
    transactions/[id]/expense.tsx   # Good - Specific route
    transactions/[id].tsx           # Bad - Switch on type
    ```
- **Inline all logic** in route components

### Route Groups

| Group    | Purpose            | Tab Bar |
| -------- | ------------------ | ------- |
| `(tabs)` | Main screens       | Visible |
| `(main)` | Modal/push screens | Hidden  |

### Code Duplication in Routes

Wrap JSX only (not logic) in jscpd markers for similar form structures:

```tsx
{/* jscpd:ignore-start */}
<Page header={...}>
    <FormProvider {...form}>
        ...
    </FormProvider>
</Page>
{/* jscpd:ignore-end */}
```

## Forms (React Hook Form + Zod)

### Form Pattern

```typescript
const { form, handleSubmit } = useCreateTransactionForm({
    onSubmit: data => transactionService.createInternal(data),
    schema: ExpenseTransactionCreateInputSchema,
    ...
});

return (
    <FormProvider {...form}>
        <FormField name="amount" />
        <FormField name="category" />
    </FormProvider>
);
```

### Form Field Components

Use `useFormContext` internally - no prop drilling:

```typescript
const FormField = ({ name }: { name: string }) => {
    const { control } = useFormContext();
    return <Controller control={control} name={name} ... />;
};
```

## i18n (Lingui)

### Usage Rules

- **Prefer `<Trans>` in JSX**: `<Trans>Category</Trans>` not `{t\`Category\`}`
- **Use `t\`template\`` for non-JSX**: toasts, aria-labels, placeholder text
- **Use `t(variable)` for MessageDescriptor**: `t(ACCOUNT_TYPE[type])`
- **Never use `i18n.t()`** - always `t()` or `t\`\``

### After Changes

```bash
yarn i18n:sync
```

## Data Layer

### Repository Singletons

Import from `@generic/drizzle/db/db.ts`:

```typescript
import { accountRepository, transactionRepository } from '../@generic/drizzle/db/db';
```

### Live Queries

Use `useLiveQuery` for reactive data:

```typescript
const { data, error, updatedAt } = useLiveQuery(accountRepository.findById(id), [id]);
```

**`useLiveQuery` deps must be primitive-stable.** Passing an object literal (e.g. a `filters` prop reconstructed each render) makes the dep change every render, which re-runs the query and returns a new `data` array reference each render. Downstream consumers like `LegendList` see a new `sections` reference every render and their internal reconciliation (`state.props.data`, `totalSize`, `isEndReached`) silently breaks — pages "load" but the scroll boundary doesn't grow.

```typescript
// Bad — filters is a fresh object each render → query re-runs every render
useLiveQuery(repo.find(filters, limit), [limit, filters]);

// Good — derive a stable key (string or primitive) from filters
const filterKey = JSON.stringify(filters); // or a dedicated buildXxxFilterKey util
useLiveQuery(repo.find(filters, limit), [limit, filterKey]);
```

If a filter shape exists in `@budgie/contracts` and is paginated, prefer adding a `buildXxxFilterKey` util alongside it (mirrors `buildTransactionFilterKey`) so callers can't forget.

### Drizzle ORM

- **Prefer**: `db.query.[Entity].findMany/findFirst`
- **Avoid**: `db.select().from(...)`
- **Upserts**: Use `.onConflictDoUpdate()`

## Error Handling

Use Toast for user-facing errors:

```typescript
import Toast from 'react-native-toast-message';

Toast.show({
    type: 'error',
    text1: t`Something went wrong.`,
    text2: t`Could not save. Please try again.`
});
```

## Provider Architecture

Root layout has 15 nested providers in this order:

1. SafeAreaProvider
2. SQLiteProvider
3. SettingsProvider
4. I18nProvider
5. KeyboardProvider
6. ThemeProvider
7. ScreenChromeThemeProvider
8. GestureHandlerRootView
9. AuthProvider
10. AuthGuard
11. CreateActionProvider
12. AiProviderWrapper
13. AiEmbeddingProgressProvider
14. AiStatusProvider
15. ModalProvider (wraps all 20 modal providers internally)

## AI/LLM Module Patterns

### Prompt Constants

Extract LLM prompts to dedicated constant files in `ai/constant/`:

```typescript
// Good - prompt in constant file
// ai/constant/translation-prompt.constant.ts
export const TRANSLATION_SYSTEM_PROMPT = `...`;
export const TRANSLATION_TEMPERATURE = 0.7;

// Bad - prompt inline in service
class TranslationLlmService {
    private readonly PROMPT = `...`; // Move to constant file
}
```

### Shared Hook Types

Use generic interfaces for hooks with similar return shapes:

```typescript
// Good - shared generic interface in ai/interface/
export interface UseSuggestionReturnInterface<T> {
    status: SuggestionStatus;
    suggestions: T[];
}

// Bad - duplicate interfaces per hook
interface UseCategorySuggestionReturn { status: ...; suggestedCategories: ... }
interface UseTagSuggestionReturn { status: ...; suggestedTags: ... }
```

### Extract Complex JSX to Components

When a function returns ReactNode (like `getHeaderRight`), extract it into a proper React component in its own folder. This enables hooks and follows the one-component-per-folder rule:

```typescript
// Good - separate component with hooks
export const AiTranslationFieldsHeaderRight = (props: Props) => {
    const { t } = useLingui();
    const style = useAnimatedStyle(() => ...);
    ...
};

// Bad - plain function returning ReactNode
const getHeaderRight = (params: Params): ReactNode => { ... };
```

### Async Functions in useEffect

Keep async functions defined inside `useEffect` (not extracted outside) to avoid `react-hooks/set-state-in-effect` lint errors:

```typescript
// Good - suggest defined inside useEffect
useEffect(() => {
    if (!isReady) return;
    const suggest = async (): Promise<void> => {
        setStatus('loading');
        // ...
    };
    void suggest();
}, [isReady]);

// Bad - suggest defined outside useEffect
const suggest = async () => { setStatus('loading'); ... };
useEffect(() => { void suggest(); }, [isReady]);
```

## Background Tasks

Register tasks in `_layout.tsx` after migrations:

- Exchange rate sync (hourly)
- Balance updates (weekly)
- Monobank sync

Task files use `.task.ts` suffix and are defined in `[module]/task/` folders.

### Long-running work must yield to the UI

Any loop or multi-step process that can run long (valuing thousands of rows, bulk imports, batch consolidations) must yield to the JS event loop so the UI thread can paint — otherwise progress bars freeze at 0% and the app feels hung even when the work is succeeding. Process in batches, commit each batch in its own short transaction (never hold a write transaction open across a yield), publish progress, then `await microPause()` from `@generic/utils/micro-pause.util` before the next batch. Mirror the rule-engine batch pattern (`RULE_BATCH_SIZE` + per-batch transaction + yield).

### `emptySnapshot()` returns fresh objects

Return a spread (`{ ...EMPTY_SNAPSHOT }`), not the module-level constant. The constant is a template; callers must not share a reference.

```ts
// Good
protected emptySnapshot(): AiSystemSnapshotInterface {
    return { ...EMPTY_SNAPSHOT };
}

// Bad
protected emptySnapshot(): AiSystemSnapshotInterface {
    return EMPTY_SNAPSHOT;
}
```

## Logging

The library auto-derives `logContext = ClassName::methodName` for decorated methods, so there is no namespace argument. The transport prefixes every line as `[logContext]`.

### Class methods — `@Log` decorator

Every public service/repository method that warrants observability is decorated with the full lifecycle: `pre` (entry), `post` (success), `error` (catch). No inline `logger.log(...)` inside decorated method bodies.

```ts
import { Log } from '@budgie/logger';
import { getErrorMessage } from '@rnw-community/shared';

class SomeService {
    @Log(
        input => `enter input=${input}`,
        (result, input) => `done input=${input} result=${result}`,
        (error, input) => `throw input=${input} error=${getErrorMessage(error)}`
    )
    async doThing(input: string): Promise<number> {
        // pure business logic
    }
}
```

Output:

```
[SomeService::doThing] enter input=hello
[SomeService::doThing] done input=hello result=42
```

If a method has multiple log points today, extract each phase into a private method and decorate each. The outer method's `@Log` covers the outer lifecycle.

### Free-function / hook / component — `getLogger`

```ts
import { getLogger } from '@budgie/logger';

const logger = getLogger('useSomething');

export const useSomething = () => {
    logger.log('fired', { foo, bar });
    logger.error('failed', { errorMessage });
};
```

Free-form `context: string`. Convention: hook/file/component name. No enum.

### Build-time gate

`EXPO_PUBLIC_LOGGING_DISABLE=true` suppresses release-bundle app log output. App logging stays enabled for Metro dev bundles (`__DEV__`) and for native configs where `APP_VARIANT=development` or profiling is enabled unless disabled explicitly. **Build-time config changes still require a rebuild for non-dev bundles.**

When starting Metro to watch service logs, always include `APP_VARIANT=development`, for example:

```bash
APP_VARIANT=development EXPO_PUBLIC_AI_DISABLE=true yarn start --port 8082
```

Also verify the foreground bundle is the dev app (`com.vitalyiegorov.budgie.dev` on iOS), not the E2E app. The E2E build (`com.vitalyiegorov.budgie.e2e`) has `EXPO_PUBLIC_LOGGING_DISABLE=true` baked in, so Metro cannot re-enable service logs for that installed binary. If the wrong app is foreground, launch/reinstall the dev build or rebuild the target variant with logging enabled before debugging logs.

### `packages/bank-sync` exception

`packages/bank-sync` imports `Log` and `getLogger` through `@budgie/logger`. Its `syncLogger` helper in `packages/bank-sync/src/core/util/sync-logger.util.ts` only binds the `SYNC` context.
