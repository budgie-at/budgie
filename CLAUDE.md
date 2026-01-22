# CLAUDE.md

Budgie is an offline-first mobile expenses tracker. Monorepo with 4 packages: app (React Native), contracts (shared types), landing (Next.js), and bank-sync (bank integrations).

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
yarn lint                                 # ESLint
yarn deadcode                             # Knip dead code detection
yarn cpd                                  # Code duplication check
yarn test                                 # Jest tests

# IMPORTANT: After completing any task, ALWAYS run:
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd

# Utilities
yarn deps:check                           # Check dependency versions
yarn deps:dedupe                          # Deduplicate dependencies
```

## Structure

```
packages/
├── app/                # React Native (Expo 54) - main mobile app
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
2. **No type assertions** - Never use `as`, `@ts-ignore`, `@ts-expect-error`
3. **No comments** - Self-documenting code with clear names
4. **Never disable ESLint without approval** - NEVER add `eslint-disable` comments without explicit user approval
5. **Single const declarations** - Each variable gets its own `const` declaration
6. **Use `emptyFn` for no-op callbacks** - Use `emptyFn` from `@rnw-community/shared` instead of `() => void 0`
7. **No IIFEs** - Use `.catch(handleError)` or `.then(onSuccess, onError)` instead of `void (async () => {})()` 
8. **Use `getErrorMessage`** - Use `getErrorMessage(e)` from `@rnw-community/shared` instead of `e instanceof Error ? e.message : String(e)`
9. **One component per folder** - Each component file lives in its own folder
10. **Constants in `/constant` folder** - Constant files go in the module's `constant/` folder, not alongside components
11. **Use `t` macro for string props** - Use `t\`text\`` from `@lingui/core/macro` for string props, `<Trans>` for JSX children

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interface | `*Interface` suffix | `AccountFilterInterface` |
| Enum | `*Enum` suffix | `AccountTypeEnum` |
| Function | module prefix | `exchangeRatesFetchApi` |
| Class | PascalCase | `AccountRepository` |
| File | kebab-case + type suffix | `account.service.ts` |

### Type Guards

Use `@rnw-community/shared` for type checks:
- `isDefined()`, `isEmptyArray()`
- `isNotEmptyArray()`, `isNotEmptyString()`
- `isPositiveNumber()`, `isNumber()`

For simple null/undefined checks on functions, prefer optional chaining: `callback?.(value)`

## Tech Stack

| Package | Stack |
|---------|-------|
| **app** | Expo 54, React 19 + Compiler, Expo Router 6, Drizzle ORM, NativeWind 5, Lingui 5.7 |
| **contracts** | Drizzle ORM, Zod, drizzle-zod |
| **landing** | Next.js 15, React 19, Tailwind CSS 4, Lingui 5.7 |
| **bank-sync** | ky HTTP client, date-fns |
| **Build** | Yarn 4.12 (PnP), Node >= 22, Lerna 8, TurboRepo 2, TypeScript 5.9, ESLint 9 |

## Workflow

1. **Fresh clone:** `yarn install`
2. **After contracts changes:** `yarn build`
3. **Before commit:** Husky runs `yarn ts`, `yarn lint-staged`, commitlint
4. **Before PR:** Run all validation commands

### Commit Format

Conventional commits: `type(scope): description`

**Scopes:** Use package names without prefix: `app`, `contracts`, `landing`, `bank-sync`

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

## Local Documentation

The `docs/plans/` folder contains design documents and implementation plans. This folder is gitignored for local-only usage - plans are working documents that don't need version control.
