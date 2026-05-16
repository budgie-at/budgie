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

## Git Commits And Pull Requests

### Commit Message And PR Title Format

Use Conventional Commits for commit messages and PR titles:

```text
type(scope): short description
```

For repo-wide changes where no single package owns the change, omit the scope:

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

1. Use the package scope when the primary product or code change belongs to one package, even if supporting docs, tests, or tooling files are also touched.
2. Omit the scope when the primary change touches multiple packages, root documentation, workspace tooling, shared agent configuration, or other repo-wide files.
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
9. **One component per file/folder** - Each top-level component lives in its own file inside its own folder. Lazy wrappers (`const Foo = lazy(() => import('...'))`) count as components — extract them to their own file so the dynamic-import boundary is a real code-split point and the file has exactly one default-shaped export.
10. **Constants in `/constant` folder** - Constant files go in the module's `constant/` folder, not alongside components. This includes Zod schemas and their inferred types used by forms.
11. **Use `t` macro for string props** - Use `t\`text\`` from `@lingui/react/macro` for string props (like `content={t\`Cancel\`}`), `<Trans>` only for direct JSX text children
12. **No abbreviated variable names** - Use full descriptive names (`category` not `cat`, `transaction` not `tx`, `account` not `acc`)
13. **No complex logic in JSX props** - Extract ternaries/logical operators to variables before JSX
14. **Utility functions in `/utils` folder** - Extract **reusable** functions to module's `utils/` folder with `.util.ts` suffix. Single-consumer helpers don't qualify (see rule 38 + rule 51).
15. **Pick minimal interface properties** - Use `Pick<EntityInterface, 'prop'>` when only specific properties are needed
16. **No redundant wrapper functions** - Don't create functions that only delegate to another function without adding logic. If a lint rule prevents inline callbacks, the wrapper is acceptable
17. **Use microunits utility functions** - Use `convertFromMicroUnits()` and `convertToMicroUnits()` for amount conversion instead of manual `/ PRECISION` or `* PRECISION`
18. **Spread syntax for optional params** - Use `...(isPositiveNumber(x) && { x })` instead of `x: isPositiveNumber(x) ? x : undefined` with eslint-disable
19. **Interfaces and types in separate files** - Never define interfaces or type aliases inline above classes, hooks, components, services, or repositories. Put them in the module's `/interface` folder with the proper `.interface.ts` or `.type.ts` suffix.
20. **Type guards in separate files** - Type guards go in `/type-guard` folder with `.type-guard.ts` suffix
21. **Group useWatch calls together** - In React components, keep all `useWatch` calls together near other hooks, not scattered throughout the component
22. **Services use classes, not utility functions** - Service files (`.service.ts`) should export a class instance, not standalone functions
23. **One utility per file** - Each utility function should be in its own file with `.util.ts` suffix, don't combine multiple utilities
24. **Re-export from package index** - Don't create intermediate export files (like `erste.ts`), re-export directly from `index.ts`
25. **Class method ordering** - Public methods come before private methods in class definitions
26. **Always brace control-flow bodies** - Every `if`, `else`, `for`, `while`, and `do` body must be wrapped in `{ }`, even for single statements. Enforced by ESLint `curly: ['error', 'all']` and `nonblock-statement-body-position: ['error', 'below']`.
27. **No unit tests in app code.** Production packages (`app`, `contracts`, `ai`, `landing`, `bank-sync`) do not host Jest/Vitest/etc. Verification at the code level is done via `yarn ts`, `yarn lint`, `yarn deadcode`, `yarn cpd`, manual testing, and — for SQL — `EXPLAIN QUERY PLAN` plus the bench harness under `packages/app/scripts/`. E2E coverage lives in `tests/app-tests/` via Maestro. The single integration-test exception is `tests/bank-sync-tests/` (Vitest + MSW), which covers raw-SQL ranking and bank-sync pagination paths Maestro cannot reach. Do not add Vitest/Jest workspaces elsewhere without amending this rule.
28. **Enum members are `UPPER_CASE` with `UPPER_CASE` string values.** Mirror the `@budgie/contracts` convention. Example: `TRANSFER = 'TRANSFER'`. Exception: when a pre-existing serialized value (DB column, telemetry endpoint, storage key) uses a different casing, preserve the value string while moving the key to UPPER_CASE: `MODEL_ERROR = 'model-error'`. Document the exception inline.
29. **Interface fields are `readonly` by default.** Interfaces are immutable contracts. If an interface is a mutable accumulator, convert it to a class with explicit mutation methods.
30. **No re-export-only files.** Import from the canonical source. Thin indirections rot and fragment signatures. Exception: test-harness barrels under `tests/*/src/harness/index.ts` are permitted because per-scenario import-block similarity otherwise trips `yarn cpd` (jscpd 0% threshold) and the project rule against `jscpd:ignore` and `.jscpd.json` edits prevents an in-source workaround.
31. **Every manual condition is reviewed against the canonical `@rnw-community/shared` guard table.** See `Type Guards and Validation → Canonical Mapping` below.
32. **Class-method lifecycle logs use `@Log` decorator from `@budgie/logger`.** Free-function / component / hook logs use `getLogger(context)` from the same package. Do not import `console.log` / `console.debug` / `console.error` directly in service code — route through the transport so app builds can gate logging consistently.
33. **Do not reshape public method arguments to satisfy lint.** Never convert existing positional arguments into an object, array, tuple/rest tuple, or new interface unless explicitly requested. Prefer splitting implementation into smaller private methods when it improves design; otherwise use a narrow `@typescript-eslint/max-params` lint disable with justification.
34. **No log-only abstractions.** Do not add helpers, wrapper decorators, or shared constants whose only purpose is to build or reuse lifecycle log strings. Keep `@Log` usage directly on the method so argument usage stays obvious.
35. **No internal catch-and-log inside `@Log` class methods.** If a decorated class method can fail, let `@Log` record the throw and handle intentional suppression at the call site with `.catch(...)`.
36. **Update inputs derive from entity types.** Use `Partial<Pick<*CreateEntityInterface, 'fieldA' | 'fieldB'>>` — never hand-write update field shapes. Pick from `*CreateEntityInterface` (already filtered to user-settable columns), not from `*EntityInterface` (which includes auto-managed fields like id/createdAt/deletedAt).
37. **Service signatures encode invariants — no silent field-dropping.** If a method ignores or strips fields from its input before calling deeper, narrow the parameter type so dropped fields are unrepresentable. Never accept a wide input "for convenience" and quietly filter.
38. **Class boundaries: cohesion over ceremony.** One-method classes are functions in disguise — keep them as free functions. Single-consumer free functions are methods in disguise — inline as private methods of the consumer class (see rule 51 — same logic applies to constants, reducers, and type aliases). Use a class when state is held, OR multiple cohesive methods share private helpers, OR two or more consumers share the same logic. When inlining produces a long file, prefer `// eslint-disable max-lines -- approved by <human>` with rationale over premature decomposition. Lint-disable additions of this kind require explicit human approval (see rule 4).
39. **Class-owned constants are `private static readonly` fields**, not module-level. Module-level `const` is reserved for values shared by multiple classes/functions in the same file.
40. **Domain-specific shapes carry the domain prefix.** Parser state, layout types, row interfaces specific to one bank/source/feature: `Erste*`, `Monobank*`. Bank-agnostic shapes (raw native-module output, generic transaction interfaces) stay neutral. Drop legacy qualifiers (`Modern`, `Classic`) once only one variant remains.
41. **Don't double-log a flow.** If a service method already carries `@Log` (enter/done/throw), don't add `getLogger` calls in the hook/component that triggers it. Service-level decorators record the lifecycle; hook-level logs of the same flow are noise duplication.
42. **Do not create single-use utilities to appease lint.** PR review fixes should address the root design issue, not move code into one-off `.util.ts` files, one-off interfaces, or wrappers used by a single service. Keep service-owned orchestration as private methods on the service, keep reusable pure helpers in `/utils`, and get explicit human approval before using a targeted lint disable when a cohesive service legitimately exceeds a size rule.
43. **No module-level helpers for class-internal use.** If a free function/const is consumed only by one class in the same file, it belongs inside the class — pure helpers as `private` (or `private static`) methods, value constants as `private static readonly` fields. Module-level scope is reserved for shapes shared by 2+ top-level declarations in the file.
44. **No single-field interfaces.** If an interface or type alias has exactly one field, pass that field's value directly. `interface Options { language?: string }` → `language: string | null` parameter. Wrappers cost one indirection per consumer for no payoff and rot when fields are added.
45. **Magic strings that name a thing become an enum.** Subsystem names, error sources, telemetry channels, storage keys, **hook return states (`'idle' | 'recording' | ...`), and reducer action types** that are referenced by ≥2 sites — define an enum (rule 28) and use it everywhere. `'chat' | 'embedding' | 'stt'` literal unions, hook state-machine unions, and string returns from `getSomeKind()` are red flags.
46. **No mount-time `useEffect` for service start when an app provider already starts it.** App-level providers (e.g. `AiProvider` running `aiCoordinatorService.start()`) own boot ordering for singletons. Don't add per-feature hooks (`useStartFooSubsystem`, `useEnsureBar`) that re-fire `useEffect` on every consumer mount — they're idempotent noise and obscure the real boot path.
47. **No hooks that wrap a single side effect.** A hook whose entire body is one `useEffect(() => { service.x(); }, [])` is overengineering — call the service directly from the parent component's existing effect, or hoist to the provider that owns the service. Hooks earn their cost only when they encapsulate multi-call state, refs, or composed sub-hooks.
48. **i18n keyword tables use `Record<LanguageEnum, ...>` with full coverage.** Number words, currency aliases, sentence separators, parser keywords — anything language-specific must be declared as `Record<LanguageEnum, readonly string[]>` (or similar) so adding a new `LanguageEnum` member is a TypeScript error at every keyword site, not a silent gap. Build the runtime regex by flattening `Object.values(...).flat()`.
49. **Don't hardcode external resource sizes/hashes.** When validating a downloaded file, prefer the server-reported size from the download progress callback (`totalBytesExpectedToWrite`) or HTTP `Content-Length` header. Hardcoded byte counts go stale silently when the upstream resource changes; runtime values stay correct.
50. **No deferred-promise resolver-ref bridging.** Don't store `resolverRef`/`rejecterRef` (or `this.resolveX`/`this.rejectX`) to bridge a `Promise` from a `start()` to a `stop()`/`cancel()`. The pattern always demands a custom `CancelledError` and complicates cancellation. Pick one shape: (a) `start(...): void` + `stop(): Promise<TResult>` — caller awaits the stop directly; (b) `start(onResult: (result: TResult) => void): void` — caller passes a result callback. Same applies to hooks exposing a Promise from `startAndCollect`-style methods: pass the result through a callback or expose it via state, never via a stored Promise resolver.
51. **Single-consumer rule covers all artifact types.** Rule 38's "single-consumer = method in disguise" applies equally to `*.util.ts`, `*.constant.ts`, `*.reducer.ts`, `/type` aliases, mapping records, and discriminated-union action interfaces. Before creating any of these, run `grep -r 'name' src/` — if exactly one importer, inline as a module-level `const` at the consumer file (for non-class consumers) or as a `private` method / `private static readonly` field (for class consumers). Domain interfaces (`/interface`) and enums (`/enum`) are excluded — they live in their own files for navigation and tooling even with one consumer.
52. **`useEffect` cleanups capture their target via a stable ref, not via deps.** A cleanup that depends on a function returned by a custom hook, a tuple member from a context provider, or any prop reconstructed each render fires on every parent re-render — not on actual unmount. Pattern:
    ```ts
    const resolveRef = useRef(resolveFromHook);
    resolveRef.current = resolveFromHook;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only cleanup; ref reads the live value
    useEffect(() => () => resolveRef.current(...), []);
    ```
    Empty deps + ref-stable read = cleanup fires only on actual unmount.
53. **After `await` inside `useEffect`, downstream reads come from the awaited result, not the captured closure.** Hook destructured state (`const { data } = useFoo()`) is captured at render time. By the time `await something()` resolves, `data` is stale. Thread fresh values through the resolved value, the callback parameter, or a fresh ref read — never `data.foo` from the original closure.
54. **Snapshot Typed Array buffers from native callbacks.** When a native API hands you a `Float32Array`/`Int16Array`/etc. view (`AudioBuffer.getChannelData(0)`, JNI callbacks, FFI), the underlying memory is typically reused on the next callback. Always copy via `new Float32Array(samples)` before storing — otherwise all stored chunks alias the latest buffer.

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

### Canonical Mapping (Mandatory)

| Manual pattern | Required guard | Lint |
|---|---|---|
| `x === null`, `x === undefined`, `x === null \|\| x === undefined` | `!isDefined(x)` | ✓ |
| `x !== null`, `x !== undefined`, both combined | `isDefined(x)` | ✓ |
| `typeof x === 'number'` | `isNumber(x)` | — |
| `typeof x === 'string'` | `isString(x)` | — |
| `Array.isArray(x) && x.length > 0` | `isNotEmptyArray(x)` | ✓ (length case) |
| `x.length === 0` on array | `isEmptyArray(x)` | ✓ |
| `typeof x === 'string' && x.length > 0`, `x !== ''` | `isNotEmptyString(x)` | ✓ (length case) |
| `x === ''`, `x.length === 0` on string | `!isNotEmptyString(x)` | ✓ |
| `typeof x === 'number' && x > 0`, `x > 0` on number | `isPositiveNumber(x)` | — |

The "Lint" column marks rows enforced by `no-restricted-syntax` at `warn` severity in `eslint.config.mjs`. Un-linted rows must be caught at code review.

**Gotcha:** `isEmptyString` in `@rnw-community/shared` has type predicate `value is string` — when used as an early-return guard on a string-typed local, it narrows the else branch to `never` and breaks downstream code. Use `!isNotEmptyString(x)` instead.

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

## Logging

The transport auto-prefixes every line with `[ClassName::methodName]` (for `@Log`-decorated methods) or `[context]` (for `getLogger(context)`). Tags must not repeat that information.

### `@Log` decorator (class methods)

Three lifecycle hooks: `pre` (entry), `post` (success), `error` (catch). **Each hook accepts either a string OR a function. Use a string when the message is fully static; use a function only when the message needs values from method args / result / error.** When a function is used, the library **auto-infers parameter types** from the decorated method's signature — never annotate them.

```ts
import { Log } from '@budgie/logger';
import { getErrorMessage } from '@rnw-community/shared';

class TransactionRepository {
    @Log(
        inputs => `enter externalIds=${inputs.map(input => input.externalId).join(',')}`,
        result => `done insertedIds=${result.map(row => row.id).join(',')}`,
        (error, inputs) => `throw externalIds=${inputs.map(input => input.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    async bulkCreate(inputs: TransactionCreateEntityInterface[]): Promise<TransactionEntityInterface[]> { /* ... */ }
}
```

Output:
```
[TransactionRepository::bulkCreate] enter externalIds=tx_abc,tx_def
[TransactionRepository::bulkCreate] done insertedIds=42,43
```

**Static-tag shortcut.** When `enter` and/or `done` carry no dynamic data (no inputs, no result), pass strings directly — don't wrap in `() =>`:

```ts
// Good — static strings
@Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
async start(): Promise<void> { /* ... */ }

// Bad — needless arrow wrapping a static value
@Log(() => 'enter', () => 'done', error => `throw error=${getErrorMessage(error)}`)
async start(): Promise<void> { /* ... */ }
```

Mix freely: any of the three hooks can independently be a string or a function.

### Hook formatting rules

1. **Tag prefix:** `enter` | `done` | `throw` only. No method name. The transport already shows `[Class::method]`.
2. **String when static, function when dynamic.** Don't wrap a constant in `() =>`.
3. **Function-hook param types are auto-inferred.** Never write `(error: unknown, x: string) => ...`. Just `(error, x) => ...`.
4. **Every method argument must appear in every hook.** Don't underscore-prefix args. If the data is too large to log directly (LLM prompts, embeddings), use `.length` or another scalar derived from the arg — but the arg is still present in the message.
5. **Strings (short or business-identifying)** → output quoted values: `title="${transactionTitle}"`. Do not log `titleLen=${title.length}` because length is not useful for debugging identifiers.
6. **Strings (long, sensitive, or prompt-sized)** → use a quoted preview plus a scalar only when the full value would be noisy or unsafe: `promptPreview="${prompt.slice(0, 120)}" promptLen=${prompt.length}`.
7. **Numbers / IDs** → output directly: `id=${row.id}`.
8. **Arrays of entities** → `.map(item => item.<scalarField>).join(',')`. Pick the most identifying scalar (`id`, `externalId`, `title`). Never `.length` — the join makes the failing entries debuggable.
9. **Arrays of primitives** (`string[]`, `number[]`) → `.join(',')`. Same reason.
10. **`Map<K, V>`** → `[...map.keys()].join(',')`. Keys are usually the debuggable handle; `.size` loses information.
11. **`Set<T>`** → `[...set].join(',')`.
12. **Typed arrays** (`Uint8Array`, `Float32Array`, embedding buffers) → KEEP `.length` as `dimensions=${vec.length}`. Raw bytes are meaningless inline.
13. **Objects** → destructure their identifying scalars; do not stringify the whole object.
14. **Errors** → `getErrorMessage(error)` from `@rnw-community/shared`. Never `String(error)` or `error.message`.
15. **`enter`, `done`, and `throw` each show every method arg.** `done` additionally surfaces result data. `throw` additionally surfaces `error=${getErrorMessage(error)}`. Don't drop arg context from `done` or `throw` to "minimize" — debugging needs the call identity.

### `getLogger(context)` (free-form / non-class)

```ts
import { getLogger } from '@budgie/logger';
import { getErrorMessage } from '@rnw-community/shared';

const logger = getLogger('useCategorySuggestion');

logger.log('fired', { transactionTitle });
logger.error('failed', { errorMessage: getErrorMessage(error) });
```

Free-form `context: string`. Convention: hook/file/component name. Instantiate once at module top.

### Build-time gate

`EXPO_PUBLIC_LOGGING_DISABLE=true` (e2e profile in `eas.json`) suppresses all output. Build-time only — flipping requires a rebuild.

### `bank-sync` exception

`packages/bank-sync` imports `Log` and `getLogger` through `@budgie/logger`. Its `syncLogger` helper in `packages/bank-sync/src/core/util/sync-logger.util.ts` only binds the `SYNC` context.

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
5. Run Maestro verification only against a clean E2E build installed fresh from the current branch. Dev-client or Metro runs are useful for debugging, but they are not acceptance evidence and must not be reported as passing E2E.
6. Before any E2E verification claim, rebuild the E2E app with `APP_VARIANT=e2e`, reinstall `com.vitalyiegorov.budgie.e2e`, refresh fixtures, then run Maestro against that bundle id.
7. If Maestro needs a stable selector for an existing control, add a `testID` to that control instead of using fragile coordinates where possible.
8. Any new `testID` or other app-code change used by E2E requires rebuilding and reinstalling the E2E app before rerunning the test.
9. Do not add `launchApp`, `stopApp`, relaunch subflows, or app restarts to Maestro flows without explicit user approval for that exact case.

### Maestro Robustness

1. Wait for the destination identity once, not container plus child plus redundant assert.
2. After `scrollUntilVisible` on a tappable card inside a scroll view, let the list settle before tapping.
3. Do not wrap ordinary taps in retry loops. If a tap is flaky, fix the state before the tap.
4. Use retries only for real native edge cases like submit/relaunch, not as a generic band-aid.
5. Keep flows state-driven: positive target checks beat blind waits and negative assertions.
6. Date-sensitive fixtures must be refreshed before the suite so test time and app time stay aligned.
7. Shared subflows must stay minimal and deterministic. Do not add recovery branches, retries, relaunches, or alternative navigation paths without explicit user approval.
8. If a stable deeplink already exists for setup or navigation, prefer it over replaying UI navigation in Maestro.
9. If a flow appears fundamentally broken, stop and ask the user before adding test-side workaround logic.
10. System or simulator prompts outside the app, such as Apple account verification sheets, are environment noise and must not be treated as app or Maestro regressions.
11. Settings flows must verify the user-visible outcome after a toggle, not only the switch interaction itself.
12. When a correct selector matches the right element but the native control only responds to a specific hit target inside that element, use `tapOn` with the selector plus `point` to target the relative position inside the matched bounds. Prefer this over absolute screen coordinates.

## PR Review

- **Only address human reviewer feedback** - Never fix comments from AI assistants without human confirmation
- **Validate all AI suggestions** - AI-generated review comments may be incorrect
- **Review all changes before finishing** - Check for unused imports and unnecessary code
- **Fix review feedback without utility sprawl** - Do not resolve review findings by creating single-consumer utility files. Inline service-specific logic as private methods, preserve class-owned logging with `@Log`, and keep only genuinely shared helpers in `/utils`.

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
| `max-lines` | Files that own a single multi-stage SQL pipeline or a large generated enum (e.g. `UserIconNameEnum`) where splitting would fragment a single logical unit | `-- File owns a single multi-stage SQL/CTE pipeline that must stay together` |
| `@typescript-eslint/max-params` | Existing public APIs or lifecycle log hooks must preserve positional argument shape | `-- Existing public API and Log hooks intentionally keep positional arguments` |
| `func-style` | Next.js `generateMetadata` requires `export async function`, not `const` | `-- Next.js generateMetadata must be a function declaration` |

Example:
```typescript
// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const MyFormComponent = (props: Props) => { ... };
```

## Local Documentation

The `docs/plans/` and `docs/superpowers/` folders contain design documents, specs, and implementation plans (including those produced by the superpowers brainstorming and writing-plans skills). These folders are gitignored for local-only usage — plans and specs are working documents that don't need version control.
