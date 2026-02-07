# App Package (React Native)

Main mobile application built with Expo 54, React 19 + Compiler, Expo Router 6, Drizzle ORM, NativeWind 5, and Lingui 5.7.

## Commands

```bash
yarn start                    # Expo dev server
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

**Destructuring** - For 5+ props, destructure in function body:
```typescript
// Good - Destructure in body for many props
export const MyComponent = (props: Props) => {
    const { className, header, footer, children, contentClassName, withBlur = false, ...rest } = props;
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

| Group | Purpose | Tab Bar |
|-------|---------|---------|
| `(tabs)` | Main screens | Visible |
| `(main)` | Modal/push screens | Hidden |

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
const { data, error, updatedAt } = useLiveQuery(
    accountRepository.findById(id),
    [id]
);
```

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

Root layout has 11 nested providers in this order:
1. SafeAreaProvider
2. SQLiteProvider
3. SettingsProvider
4. I18nProvider
5. KeyboardProvider
6. ThemeProvider
7. BottomSheetsProvider
8. AuthProvider
9. AuthGuard
10. CreateActionProvider
11. AiProviderWrapper

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
