# App Package (React Native)

Main mobile application built with Expo 58, React 19 + Compiler, Expo Router 58, Drizzle ORM, Uniwind, and Lingui 6.5.

## Commands

```bash
pnpm start                    # Expo dev server
APP_VARIANT=development EXPO_PUBLIC_AI_DISABLE=true pnpm start --port 8082
                              # Expo dev server with @budgie/logger service logs enabled
pnpm ios                      # Run on iOS simulator
pnpm android                  # Run on Android emulator
pnpm web                      # Run on web

pnpm db:generate              # Generate Drizzle migrations (after schema changes in contracts)
pnpm i18n:sync                # Extract & compile i18n translations

# IMPORTANT: After modifying any user-facing text:
pnpm i18n:sync
```

Before `pnpm ios` against a simulator you booted yourself, slim it: `. ../../tests/app-tests/scripts/mobile-ci-slim-simulator.sh && slim_simulator <udid>`. Every simulator this repo touches runs slim — see root `AGENTS.md`, "Simulator Dev Testing".

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
│   └── utils/                # Utility functions (date, etc.)
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

### Live database reads are atoms

Database-backed UI reads use `databaseQueryAtom([Tables...], Effect.flatMap(Repo, repo => repo.x(args)))` (`src/@generic/utils/database-query-atom.util.ts`), or `databaseQueryFamily([Tables...], Repo, (repo, key) => repo.x(key))` (`database-query-family.util.ts`) when parametrised, and read with `useLiveAtomValue`. List every table the SQL reads; builder writes invalidate them through the Drizzle adapter, raw writes through `Db.mutation`.

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
// Good - return the transaction effect directly
readonly updateById = Effect.fn('X.updateById')(function* (id: number, input: Input) {
    return yield* Db.transaction(Effect.gen(function* () { ... }));
});

// Bad - unnecessary intermediate variable
const result = yield* Db.transaction(Effect.gen(function* () { ... }));
return result;
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

> Composition rules (prop budget, compound components, explicit variants, hook chains) live in [docs/component-composition.md](../../docs/component-composition.md). Oxlint loads the `budgie/max-component-props` rule through its JavaScript-plugin bridge and errors above 8 props; refactor with composition instead of growing the `.oxlintrc.json` grandfather list.

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

## Styling (Uniwind + CVA)

### Uniwind

- `src/global.css` is the Uniwind entry (`metro.config.js` sets `polyfills.rem: 14`, so `1rem` is 14px). Size tokens live in `@theme`; theme colours live in `@layer theme { :root { @variant light {} @variant dark {} } }` and every colour must exist in both variants.
- `ThemeProvider` drives the active theme with `Uniwind.setTheme('light' | 'dark' | 'system')`; Uniwind updates `Appearance` itself.
- Only React Native core components (and libraries built on them, such as Reanimated) accept `className`. Wrap any other component once at module level with `withUniwind` from `uniwind`.
- Colour props take `*ColorClassName` with an `accent-*` class, for example `placeholderTextColorClassName="accent-primary/50"`.
- On native, conflicting classes resolve by className order (last wins), and edge-specific styles beat shorthands (`pt-*` over `py-*` over `p-*`, `gap-x-*` over `gap-*`) whatever their order. Merge every className override through `cn()` so only one class per property survives.
- `cn()` is `src/@generic/utils/cn.util.ts`, a `createCn` from `cn/config` that registers the `@theme` scales of `global.css` (spacing/radius `xxs`..`8xl`, the text scale, `scale-xs`/`scale-s`). Adding a token to `global.css` means adding it to that scale list. Import `cn` from the util, never from the `cn` package (`ClassValue` still comes from `cn`).
- The Tailwind default text scale is reset with `--text-*: initial`; `global.css` declares each size and, where it has one, its `--text-*--line-height` (Tailwind's default ratios). `xxxs`, `xxs`, `md` and `4_5xl` deliberately have none and render at the font's natural line height. A single-line `TextInput` must not get a line height (React Native draws its text off-centre), so use a size without one or the bare length (`text-(length:--text-lg)`).
- Theme colours have one source: `global.css`. Never mirror them in JS. Native colour props use `*ColorClassName` with `accent-*`; react-native-svg colours use the shared `StyledCircle`/`AnimatedStyledCircle`/`StyledLine`/`StyledSvgText` (or a file-local `withUniwind(Primitive, SVG_COLOR_CLASS_NAME_MAPPING)`) with `strokeClassName`/`fillClassName`; a raw value for a non-Uniwind API comes from `useResolveClassNames`.
- Safe-area padding is `pt-safe`/`pb-safe`/`pb-safe-or-[16px]`/`bottom-safe-offset-[4px]`; the root `SafeAreaListener` feeds `Uniwind.updateInsets`. Keep `useSafeAreaInsets` only for arithmetic that a class cannot express.
- `ThemeContext.isDarkColorSchema` mirrors `useUniwind().theme`; `ScopedTheme theme="light"` pins the AI record button and hold ring to the light palette they always used.
- `uniwind-types.d.ts` is generated by Metro (`uniwind generate-artifacts` regenerates it); keep it committed and unformatted.

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

Use the theme-aware `cn()` util for combining classes:

```typescript
import { cn } from '../../utils/cn.util';
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

## Forms (React Hook Form + Effect Schema)

Forms validate with an Effect Schema through the Standard Schema resolver. Form value types are `Mutable<typeof Schema.Type>` (or `Encoded` when the form holds encoded values).

```typescript
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Schema from 'effect/Schema';

const form = useForm({ resolver: standardSchemaResolver(Schema.toStandardSchemaV1(TagCreateEntitySchema)), defaultValues });
```

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
pnpm i18n:sync
```

## Data Layer

### Services and repositories

Every repository and stateful or dependent service is a `Context.Service` with a `static readonly layer` (see `src/tag/**`). Dependencies are resolved once in `make` with `yield* X`; every layer is listed in `src/@generic/runtime/app-services.layer.ts`. Edges call them through the runtime:

```typescript
await appRuntime.runPromise(Effect.flatMap(TagService, tagService => tagService.mergeInto(id, targetTagId)));
```

### Live Queries

```typescript
const accountAtom = databaseQueryFamily([AccountEntityTable], AccountRepository, (accountRepository, id: number) =>
    accountRepository.findById(id)
);
const result = useLiveAtomValue(accountAtom(id));
```

Family keys are structural, so pass filter objects directly.

### Effects and transactions

- Service IO methods are `Effect.fn('Owner.method')` fields in the object returned by `make`. Repository methods are Effects over `Db.query(db => builder)`; atomic work uses `Db.transaction(effect)`; nested transactions reuse the outer one, so there are no `tx` parameters.
- Drizzle builder writes are tracked by the Drizzle adapter. Every raw (non-builder) write (`db.run(sql...)`, `$client.unsafe`) is wrapped in `Db.mutation({ type, tables: [...tables] }, effect)`.
- Long-lived fibers owned by a service are forked in `make` (`Effect.forkScoped`, `FiberSet`), never with `appRuntime.runFork` inside a service.
- Resources that must close on failure (temp SQLite handles, attached databases) use `Effect.acquireUseRelease` / `Effect.ensuring`.
- `appRuntime` (`@generic/runtime/app.runtime.ts`) provides `Db`, `HttpClient`, the logger layer, `Reactivity` and every service layer. HTTP calls use `HttpClient` with `retryTransient` + `Schedule`, a per-attempt `Effect.timeout` and `HttpClientResponse.schemaBodyJson`.

### Drizzle ORM

- **Prefer**: `db.query.[Entity].findMany/findFirst`
- **Avoid**: `db.select().from(...)`
- **Upserts**: Use `.onConflictDoUpdate()`

## Error Handling

- Services never `throw`/`try`. Expected failures are `Schema.TaggedError` classes in the module `/error` folder, only when a caller branches on them. Foreign Promise APIs (SecureStore, expo-file-system, expo-sqlite, native modules) are wrapped with `Effect.promise` (a failure is a defect that keeps the original message) or `Effect.tryPromise` when a caller needs the typed error.
- Edges (hooks, components, routes, tasks, boot) run effects with `appRuntime.runPromise(effect)`; the rejection is the original error, so `getErrorMessage(error)` toasts keep working.

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

Root layout has 14 nested providers in this order (settings are not a provider: `useSettingsContext` reads `settingsContextAtom`, so screens frozen by `react-native-screens` still see setting changes on reveal). The outermost element is `RegistryContext.Provider` with `appAtomRegistry` (`@generic/constant/app-atom-registry.constant.ts`): the whole tree and the services that write atoms share one registry. Never provide a second registry for a subtree, because every atom read inside it gets its own node and starts from `Initial` again:

1. SafeAreaProvider
2. SQLiteProvider
3. I18nProvider
4. KeyboardProvider
5. ThemeProvider
6. ScreenChromeThemeProvider
7. GestureHandlerRootView
8. AuthProvider
9. AuthGuard
10. CreateActionProvider
11. AiProviderWrapper
12. AiEmbeddingProgressProvider
13. AiStatusProvider
14. ModalProvider (wraps all 20 modal providers internally)

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

### Effects in useEffect

Run effects at the edge with `appRuntime.runPromise` / `appRuntime.runFork`, defined inside `useEffect`, and log failures with `Effect.tapCause(Effect.logError)`:

```typescript
// Good
useEffect(() => {
    if (!isReady) return;
    setStatus('loading');
    const fiber = appRuntime.runFork(
        Effect.flatMap(SuggestService, suggestService => suggestService.suggest(id)).pipe(Effect.tapCause(Effect.logError))
    );

    return () => void appRuntime.runPromise(Fiber.interrupt(fiber));
}, [isReady]);

// Bad - async function with try/catch
useEffect(() => {
    const suggest = async () => {
        try {
            await suggestService.suggest(id);
        } catch (e) {
            logger.error(e);
        }
    };
    void suggest();
}, [isReady]);
```

## Background Tasks

`useAppInitialization` runs one startup Effect after the migrations: a 1s `Effect.sleep`, an idle wait (`waitForIdle`), then background-task registration and the startup sync. Each step is wrapped in `Effect.ignoreCause({ log: 'Error' })`, so a failure is logged once and never stops the next step.

Task files use the `.task.ts` suffix, live in `[module]/task/`, and call `appRuntime.runPromise(...)` inside `TaskManager.defineTask`, mapping a rejection to `BackgroundTaskResult.Failed`.

### Long-running work must yield to the UI

Any loop or multi-step process that can run long (valuing thousands of rows, bulk imports, batch consolidations) must yield to the JS event loop so the UI thread can paint — otherwise progress bars freeze at 0% and the app feels hung even when the work is succeeding. Process in batches (`processInputWithBatches` from `@generic/utils`), commit each batch in its own short `Db.transaction` (never hold a write transaction open across a yield), publish progress, then `yield* Effect.promise(() => microPause())` before the next batch.

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

`Effect.fn('Owner.method')` spans are the service logging mechanism. Services do not log their own failures: the edge that runs the effect logs the cause once, and fire-and-forget effects end in `Effect.ignoreCause({ log: 'Error' })`. Use `Effect.logError` / `Effect.logDebug` only for a real debugging handle (for example the CSV importer's per-row parse errors). The `makeLoggerLayer` layer in `appRuntime` is the only sink.

### Build-time gate

`EXPO_PUBLIC_LOGGING_DISABLE=true` suppresses release-bundle app log output. App logging stays enabled for Metro dev bundles (`__DEV__`) and for native configs where `APP_VARIANT=development` or profiling is enabled unless disabled explicitly. **Build-time config changes still require a rebuild for non-dev bundles.**

When starting Metro to watch service logs, always include `APP_VARIANT=development`, for example:

```bash
APP_VARIANT=development EXPO_PUBLIC_AI_DISABLE=true pnpm start --port 8082
```

Also verify the foreground bundle is the dev app (`com.vitalyiegorov.budgie.dev` on iOS), not the E2E app. The E2E build (`com.vitalyiegorov.budgie.e2e`) has `EXPO_PUBLIC_LOGGING_DISABLE=true` baked in, so Metro cannot re-enable service logs for that installed binary. If the wrong app is foreground, launch/reinstall the dev build or rebuild the target variant with logging enabled before debugging logs.
