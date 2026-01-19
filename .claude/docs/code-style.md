# Code Style

## Self-Documenting Code

- **No comments** - Use clear, descriptive names instead
- **Never disable ESLint** - No `eslint-disable` comments without explicit user approval

## Declarations

- **Single const per line** - Each variable gets its own `const` declaration

```typescript
// Good
const name = 'value';
const count = 42;

// Bad
const name = 'value', count = 42;
```

## Utility Functions

Use `@rnw-community/shared` utilities:

```typescript
// No-op callbacks
import { emptyFn } from '@rnw-community/shared';
onPress={emptyFn}  // Not: () => void 0

// Error messages
import { getErrorMessage } from '@rnw-community/shared';
getErrorMessage(e)  // Not: e instanceof Error ? e.message : String(e)
```

## Async Patterns

No IIFEs - use promise chains:

```typescript
// Good
someAsyncFn().catch(handleError);
someAsyncFn().then(onSuccess, onError);

// Bad
void (async () => { await someAsyncFn(); })();
```

## File Organization

- **One component per folder** - `component-name/component-name.tsx`
- **No barrel exports** - Direct imports: `./component-name/component-name`
- **Constants in `/constant` folder** - Not alongside components
