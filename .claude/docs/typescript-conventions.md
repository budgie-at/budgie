# TypeScript Conventions

## Strict Typing

- **No `any` type** - Everything must be properly typed
- **No type assertions** - Never use `as`, `@ts-ignore`, `@ts-expect-error`

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interface | `*Interface` suffix | `AccountFilterInterface` |
| Enum | `*Enum` suffix | `AccountTypeEnum` |
| Function | module prefix | `exchangeRatesFetchApi` |
| File | kebab-case + type suffix | `account.service.ts` |

## Type Guards

Use `@rnw-community/shared` for type checks:

```typescript
import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

// Good
if (isDefined(value)) { ... }
if (isNotEmptyArray(items)) { ... }

// Bad
if (value !== undefined && value !== null) { ... }
```

Available guards: `isDefined`, `isEmptyArray`, `isNotEmptyArray`, `isNotEmptyString`, `isPositiveNumber`, `isNumber`

For simple null/undefined checks on functions, prefer optional chaining: `callback?.(value)`
