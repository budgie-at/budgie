# App Package

React Native app built with Expo 54, Expo Router 6, Drizzle ORM, NativeWind 5, and Lingui 5.7.

## Commands

```bash
yarn start                # Expo dev server
yarn ios / yarn android   # Run on simulator
yarn db:generate          # Generate migrations (after schema changes)
yarn i18n:sync            # After modifying user-facing text
```

## Structure

```
src/
├── @generic/             # Shared infrastructure (components, hooks, utils)
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Tab navigation (main screens, tab bar visible)
│   └── (main)/           # Modal/push screens (tab bar hidden)
└── [modules]/            # Feature modules (account, category, transaction, etc.)
```

## Component Patterns

### Logic Order

```typescript
export const MyComponent = (props: Props) => {
    // 1. Props destructuring
    const { variant, onSelect } = props;

    // 2. Framework hooks (router, i18n)
    const { t } = useLingui();

    // 3. State and refs
    const [search, setSearch] = useState('');

    // 4. External hooks (queries, mutations)
    const { data } = useMyQuery();

    // 5. Handlers
    const handleOpen = () => { ... };

    // 6. Derived values
    const cardVariant = status === 'error' ? 'destructive' : 'primary';

    // 7. Effects
    useEffect(() => { ... }, []);

    // 8. Render
    return <View>...</View>;
};
```

### Props

- Destructure in body for 5+ props, in signature for fewer
- Prefer `children` for primary content composition
- No object props - pass plain props instead
- Extract handlers into named `handle*` methods

### Styling

Use color palettes from `@generic/constant/`:
- `BACKGROUND_COLOR_PALETTE` - Background + border
- `FOREGROUND_COLOR_PALETTE` - Text + icon

Variants: `default`, `destructive`, `warning`, `positive`, `ghost`, `pink`, `secondary`, `primary`

## Data Layer

### Repository Singletons

```typescript
import { accountRepository } from '../@generic/drizzle/db/db';
```

### Live Queries

```typescript
const { data } = useLiveQuery(accountRepository.findById(id), [id]);
```

### Drizzle

- Prefer: `db.query.[Entity].findMany/findFirst`
- Upserts: Use `.onConflictDoUpdate()`

## Routing

- One component per route file
- Prefer specific routes over dynamic with switch:
  - Good: `transactions/[id]/expense.tsx`
  - Bad: `transactions/[id].tsx` with type switch
- Components belong in entity folders, not in `src/app/`

## Forms

Use React Hook Form + Zod with `FormProvider`:

```typescript
const { form, handleSubmit } = useCreateTransactionForm({ ... });
return <FormProvider {...form}>...</FormProvider>;
```

## Error Handling

```typescript
import Toast from 'react-native-toast-message';
Toast.show({ type: 'error', text1: t`Something went wrong.` });
```

## Code Duplication

For similar form structures, wrap JSX only (not logic) in jscpd markers:

```tsx
{/* jscpd:ignore-start */}
<Page><FormProvider>...</FormProvider></Page>
{/* jscpd:ignore-end */}
```
