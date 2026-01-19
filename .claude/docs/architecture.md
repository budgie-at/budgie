# Architecture

## Layers

| Layer | Responsibility | File Suffix |
|-------|---------------|-------------|
| API | External service calls (fetch, ky) | `.api.ts` |
| Repository | Database operations (Drizzle ORM) | `.repository.ts` |
| Service | Business logic orchestration | `.service.ts` |
| Task | Background jobs | `.task.ts` |

## Module Structure

Each feature module follows this structure:

```
[module]/
├── component/        # UI components
├── constant/         # Module constants
├── hook/             # Custom hooks
├── service/          # Business logic
├── task/             # Background jobs
└── [other]/          # Feature-specific folders
```

## React 19 Rules

All React packages (app, landing) use React 19 Compiler:

1. **No manual memoization** - Never use `useCallback`, `useMemo`, `React.memo`
2. **No displayName** - Never use `Component.displayName`
3. **No forwardRef** - Accept `ref` as a regular prop:

```typescript
// Good - React 19 native ref
interface Props {
    ref?: RefObject<ViewRef>;
}
export const MyComponent = ({ ref, ...props }: Props) => { ... };

// Bad
export const MyComponent = forwardRef<ViewRef, Props>((props, ref) => { ... });
```

## Styling (CVA)

Use `class-variance-authority` for component variants:

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
    variants: {
        variant: { primary: '...', secondary: '...' },
        size: { sm: '...', md: '...', lg: '...' }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
});
```

Use `cn()` utility for conditional classes.

## i18n (Lingui)

- **JSX content:** `<Trans>Text</Trans>`
- **String props:** `` t`placeholder text` ``
- **MessageDescriptor:** `t(CONSTANT_MAP[key])`
- **Never use:** `i18n.t()`
- **After changes:** `yarn i18n:sync`
