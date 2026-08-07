# Budgie - Copilot Agent Instructions

## Repository Overview

**Project**: Budgie - Mobile Expenses, Banking & Wealth Tracker (Offline-First)
**Type**: Monorepo with React Native (Expo) mobile app, Next.js landing page, and shared contracts
**Size**: Large TypeScript monorepo spanning production, integration-test, and E2E workspaces
**Languages**: TypeScript, React/React Native
**Key Technologies**: Expo 56, React 19, Next.js 16, TurboRepo, Lerna, SQLite, Drizzle ORM

## Build & Development Requirements

**Required Versions**:

- Node.js: >= 22.22.1 (configured in package.json engines)
- Yarn: 4.17.1 (packageManager specified)
- Yarn uses the `node-modules` linker configured in `.yarnrc.yml`; this repository does not use PnP
- The root intentionally has 38 development dependencies after removing Prettier and the orphan root Babel tooling; do not add a dependency to satisfy the migration plan's stale count

**IMPORTANT**: Always use `yarn` commands, not `npm`. This repository uses Yarn 4 workspaces.

## Essential Commands (VALIDATED)

### Bootstrap & Setup

1. **Install dependencies** (ALWAYS run first): `yarn install`
    - Downloads and links dependencies into `node_modules`
    - Runs the configured `afterInstall` workspace build
    - Known peer warnings include ESLint 10 compatibility ranges and the contracts package's `expo-sqlite` peers; investigate new warnings

### Build Commands

2. **Build all configured packages**: `yarn build`
    - Turbo resolves workspace dependencies and caches the seven package build tasks currently in scope
    - Use `yarn build:force` to bypass Turbo cache
    - The landing task performs the Next.js production build; library packages emit their configured distributions

### Validation Commands (Run in this order)

3. **TypeScript check**: `yarn ts`
    - Uses the native TypeScript 7 compiler across all packages; TypeScript 6 remains available for tool API consumers
    - Incremental workspaces write `node_modules/.cache/tsbuildinfo.json`, which Turbo caches; non-incremental workspaces can legitimately report that no configured output was produced

4. **Linting**: `yarn lint`
    - Runs type-aware Oxlint first, including its JavaScript-plugin bridge, then a direct single-process 13-rule syntax-only ESLint fallback
    - Oxlint owns the `typescript/no-unnecessary-condition` diagnostic; ESLint does not build a TypeScript program
    - `eslint-plugin-oxlint` builds its disabling layer from `.oxlintrc.json`, leaving ESLint responsible only for unsupported and project-specific rules

5. **Deadcode detection**: `yarn deadcode`
    - Uses Knip to find unused code and dependencies
    - Clean codebase should show "no issues found"

6. **Copy/paste detection**: `yarn cpd`
    - Uses jscpd to detect code duplication
    - Report saved to `report/jscpd/jscpd-report.html`

7. **Tests**: `yarn test`
    - Production package Jest tasks are configured with `--passWithNoTests`
    - The real integration coverage is in three Vitest workspaces under `tests/`, currently 73 test files total
    - `yarn test:coverage` runs the integration coverage task used by CI
    - Task 9 measured both root test commands at approximately 28 seconds on the migration workstation; timings are machine- and cache-dependent

### Package-Specific Commands

- **Integration suites**: `yarn workspace @budgie-at/bank-sync-tests test`, `yarn workspace @budgie-at/budget-tests test`, and `yarn workspace @budgie-at/consolidation-tests test`
- **App package**:
    - `cd packages/app && yarn start` (starts Expo dev server with dev client)
    - `yarn ios` (runs iOS app) / `yarn android` (runs Android app)
    - `yarn web` (starts web version)
    - `yarn prebuild` (generates native iOS/Android projects)
    - `yarn db:generate` (generates Drizzle migrations)
    - `yarn i18n:extract` (extracts i18n strings) / `yarn i18n:compile` (compiles catalogs)
    - `yarn i18n:sync` (extracts and compiles in one command)
- **Landing package**:
    - `cd packages/landing && yarn start` (starts Next.js dev server on port 3000)
    - `yarn i18n:sync` (extracts and compiles Lingui translations)

### Utility Scripts (Root)

- `yarn format` - Format all TypeScript/TSX files with Oxfmt
- `yarn deps:check` - Check dependency version consistency across workspace
- `yarn deps:dedupe` - Deduplicate dependencies
- `yarn deps:update` - Check for dependency updates with npm-check-updates

## CI/CD Pipelines

### Pull Request Workflow (.github/workflows/pr.yml)

**Triggered on**: Every pull request
**Jobs**:

1. **detect-mobile-impact** (self-hosted `linux-tiered` / `linux-medium`):
    - Uses Turbo's affected-package query and relevant path changes to decide whether mobile preview and iOS E2E jobs are required

2. **code-quality** (self-hosted `linux-tiered` / `linux-large`, 30-minute timeout):
    - Validates PR title with commitlint (conventional commits required)
    - Verifies Lingui catalogs and Maestro selector assignments
    - Runs `yarn format:check` (Oxfmt)
    - Runs `yarn ts` (native TypeScript 7 checks)
    - Runs `yarn lint` (type-aware Oxlint plus the direct-root 13-rule syntax-only ESLint fallback)
    - Runs `yarn deadcode` (Knip)
    - Runs `yarn cpd` (jscpd)
    - Builds and runs the Vitest integration coverage workspaces
    - Uploads coverage to Codecov

3. **eas-update-preview** (hosted `ubuntu-24.04`, mobile-impact changes only):
    - Exports iOS and Android bundles and publishes an EAS Update to the development channel

4. **ios-maestro** (`rnw-community/mobile-ci`'s reusable `ios-maestro.yml` workflow, pinned to `v1.0.0`, mobile-impact changes after code quality):
    - Build job on self-hosted Apple Silicon `macos-builder`: reuses a fingerprinted native app when possible (repacking the current PR's JS bundle into the cached shell via `repack-on-hit`), and falls back to a full native build when required
    - Test job on two self-hosted Apple Silicon `macos-maestro` shards: downloads the built app and runs the 41 entry flows assigned via `tests/app-tests/shards/shard-*.txt`
    - There is no Android E2E job in the current PR workflow

### Main Branch Workflow (.github/workflows/main.yml)

**Triggered on**: Push to main or manual workflow_dispatch
**Jobs**:

1. **release**:
    - Runs on self-hosted `linux-tiered` / `linux-medium` and publishes releases using Lerna with conventional commits
    - Requires `PUSH_TO_PROTECTED_TOKEN` secret
    - Creates GitHub releases automatically

2. **eas-update**:
    - Runs on hosted `ubuntu-24.04` after release and publishes an EAS Update to the production channel

## Project Structure

### Root Directory

```text
/
├── packages/
│   ├── app/              # React Native (Expo) mobile app
│   ├── ai/               # AI and LLM services
│   ├── bank-sync/        # Bank integrations
│   ├── budget/           # Budget domain logic
│   ├── consolidation/    # Transaction consolidation
│   ├── contracts/        # Shared TypeScript schemas and repositories
│   ├── logger/           # Shared logging package
│   └── landing/          # Next.js marketing website
├── tests/
│   ├── app-tests/        # Maestro E2E tests
│   ├── bank-sync-tests/  # Bank-sync integration tests
│   ├── budget-tests/     # Budget integration tests
│   └── consolidation-tests/ # Consolidation integration tests
├── .github/workflows/    # CI/CD pipelines
├── .husky/              # Git hooks (pre-commit, commit-msg)
├── turbo.json           # TurboRepo configuration
├── lerna.json           # Lerna monorepo settings
├── package.json         # Root package with workspace config
├── .oxlintrc.json       # Primary type-aware Oxlint configuration
└── eslint.config.mjs    # Residual ESLint configuration
```

### packages/app/ (React Native App)

**Main directories**:

- `src/@generic/` - Reusable UI components (chip, icon, etc.)
- `src/@generic/drizzle/` - Database schema and migrations
- `src/account/` - Account management components/queries
- `src/ai/` - AI chat components
- `src/settings/` - Settings screens and logic
- `src/app/` - Expo Router app directory (screens)
- `src/locales/` - i18n translations (en, fr, es, uk, de)
- `src/theme/` - Theme configuration and context

**Key files**:

- `app.config.js` - Expo configuration (dynamic based on APP_VARIANT env)
- `eas.json` - EAS Build profiles (development, preview, e2e, production)
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel with React Compiler and Lingui
- `drizzle.config.ts` - Drizzle ORM configuration for SQLite

### packages/contracts/

**Purpose**: Shared TypeScript schemas and repositories using Zod and Drizzle
**Structure**:

- Each entity has: schema, entity interface, create interface
- Entities: account, account-balance, category, exchange-rate, instrument, settings, tag, transaction, transaction-entry
- Production packages do not host unit tests; integration behavior is exercised from the dedicated `tests/` workspaces

### packages/landing/

**Purpose**: Next.js 16 marketing website with App Router
**Key features**: Internationalization (en, fr, es, uk, de), MDX blog, Tailwind CSS

## Configuration Files

### Linting & Formatting

- **.oxlintrc.json**: Primary type-aware Oxlint configuration for native rules and JavaScript-bridge rules from Lingui, React Compiler, Node, React Native Web, Stylistic, and the local Budgie plugin
    - Owns `typescript/no-unnecessary-condition` and the `budgie/max-component-props` grandfather `allow` list
- **eslint.config.mjs**: 13-rule syntax-only fallback for rules that remain unsupported by native Oxlint and its JavaScript-plugin bridge
    - Uses the official `eslint-plugin-oxlint` companion generated from `.oxlintrc.json` to disable overlapping rules
    - Runs once from the repository root after Oxlint; the root lint pipeline does not delegate the fallback to Turbo

- **.oxfmtrc.json**: Oxfmt configuration (applied via lint-staged)
- **.lintstagedrc.js**: Pre-commit hooks run `oxlint --type-aware --fix`, the ESLint fallback, `oxfmt --write`, and `sort-package-json`

### Equal-Topology Local Benchmark

Baseline `1f07afc` and measured revision `044badce` were benchmarked on 2026-07-14 using Node.js v22.23.0, Yarn 4.17.1, and macOS arm64. Each workload used five interleaved samples, remote caching disabled, and isolated local-only caches. Medians are sorted sample index 2. Sequential validation is `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`.

| Workload                             | Baseline elapsed | `044badce` elapsed |                     Elapsed change | Baseline RSS | `044badce` RSS |                         RSS change |
| ------------------------------------ | ---------------: | -----------------: | ---------------------------------: | -----------: | -------------: | ---------------------------------: |
| Uncached lint                        |           49.10s |             31.96s |                             -34.9% |    2764.2MiB |      1480.3MiB |                             -46.4% |
| Uncached sequential validation       |           59.78s |             41.56s |                             -30.5% |    2761.0MiB |      1315.8MiB |                             -52.3% |
| Cache-assisted sequential validation |           10.96s |             10.69s | Effectively unchanged; noise-sized |    1349.2MiB |      1359.9MiB | Effectively unchanged; noise-sized |

RSS is the macOS `/usr/bin/time -l` maximum observed child-process RSS, not aggregate process-tree RSS. The cache-assisted result is not claimed as an improvement.

### TypeScript

- **tsconfig.json** (root): Base TypeScript config
- **tsconfig.build-esm.json**: ESM build configuration
- **tsconfig.build-cjs.json**: CommonJS build configuration
- Each package has its own tsconfig.json extending root

### Git Hooks (Husky)

- **pre-commit**: Runs `yarn ts` and `yarn lint-staged`
- **commit-msg**: Validates commit messages with commitlint (conventional commits)

### Turbo

- **turbo.json**: Defines task dependencies and caching
    - Tasks: `release`, `ts`, `lint:eslint`, `clear`, `build`, `test`, `test:coverage`, plus root `cpd` and `deadcode`
    - Package-level `lint:eslint` tasks remain available, while root `yarn lint` runs Oxlint and then one direct-root ESLint fallback process
    - PR CI enables remote caching through `TURBO_TEAM` and `TURBO_TOKEN`

## Development Workflow

### Making Code Changes

1. **ALWAYS start with**: `yarn install` (if fresh clone or after pulling)
2. **Before committing**: Changes are automatically validated by Husky hooks
    - TypeScript check runs automatically
    - Oxlint, the ESLint fallback, and Oxfmt fixes are applied via lint-staged
    - Commit message validated (must follow conventional commits)
3. **After changes**: Run `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`
4. **For package changes**: Run `yarn build` to ensure downstream packages work

### Commit Message Format

**Required format**: `type(scope): description`
**Types**: feat, fix, chore, docs, style, refactor, perf, test
**Scopes**: Package names (app, contracts, landing) or feature areas
**Examples**:

- `feat(app): add expense tracking screen`
- `fix(contracts): validate transaction amount range`
- `chore: update dependencies`

### Common Issues & Solutions

**Issue**: Peer dependency warnings during `yarn install`
**Solution**: The known migration warnings are ESLint 10 peer ranges and `expo-sqlite` peers exposed through contracts. Compare new warnings with the current baseline instead of treating every warning as safe.

**Issue**: Turbo cache warnings about missing outputs for a TypeScript task
**Solution**: Composite and app workspaces emit `node_modules/.cache/tsbuildinfo.json`; some non-incremental test or landing tasks do not. Confirm the warning belongs to one of those tasks before accepting it.

**Issue**: Build fails after dependency update
**Solution**:

1. Run `yarn dedupe` to resolve version conflicts
2. Run `yarn build:force` to bypass stale Turbo cache
3. Clear node_modules: `rm -rf node_modules && yarn install`

**Issue**: A lint rule is not supported by Oxlint
**Solution**: Keep only the 13 residual syntax-only rules in the ESLint fallback. Put supported plugin families in Oxlint's JavaScript-plugin bridge, and use the official companion to disable overlapping ESLint rules. Keep `typescript/no-unnecessary-condition` in Oxlint.

The root `readme.md` backlog tracks restoring automated `UPPER_CASE` enum-member enforcement when Oxlint supports an equivalent naming-convention rule.

**Issue**: Cannot run Expo app builds locally
**Solution**: EAS builds require EXPO_TOKEN secret. Use `yarn start` in packages/app for local development with Expo Go or dev client.

## Key Architectural Patterns

### Monorepo Structure

- Uses Yarn workspaces + Lerna for versioning
- TurboRepo for build orchestration and caching
- Packages share common tooling (Oxlint, residual ESLint 10, native TypeScript 7, TypeScript 6 API, and Oxfmt)

### Mobile App (packages/app)

- **Framework**: Expo 56 with SDK features (Router, SQLite, Updates)
- **Navigation**: Expo Router (file-based routing in src/app/)
- **State**: React Context + hooks (no Redux/MobX)
- **Database**: SQLite via Drizzle ORM + expo-sqlite
- **Styling**: NativeWind (Tailwind for React Native)
- **i18n**: Lingui with compiled catalogs
- **Build variants**: Development, Preview, Production (controlled by APP_VARIANT env)

### Data Contracts (packages/contracts)

- **Schema validation**: Zod schemas exported alongside TypeScript types
- **Database**: Drizzle ORM schemas for SQLite
- **Pattern**: Each entity has base interface, create interface, and schema
- **Testing**: Exercised through the dedicated integration workspaces rather than package-local unit tests

### Landing Site (packages/landing)

- **Framework**: Next.js 16 with App Router
- **Rendering**: Static generation for all pages
- **i18n**: Custom implementation with locale prefixes (/en/, /fr/, etc.)
- **Content**: MDX for blog posts
- **Styling**: Tailwind CSS + Radix UI components

## Testing Strategy

### Production Package Test Tasks

- `packages/ai`, `packages/contracts`, and `packages/logger` expose Jest commands with `--passWithNoTests`
- Production packages do not contain unit-test suites

### E2E Tests

- Located in tests/app-tests/
- Use Maestro for React Native testing
- CI builds the iOS E2E app and runs two Maestro shards only when the mobile-impact gate is true
- There is no Android E2E job in the current PR workflow
- Config: tests/app-tests/config.yaml
- Two checked `tests/app-tests/shards/shard-*.txt` manifest files assign the 41 entry flows exactly once for selector validation
- The current PR workflow consumes those same two manifest partitions directly via `ios-maestro.yml`'s `shard-manifest-dir` input, preserving the hand-tuned wall-clock balance instead of falling back to a computed index-modulo split

### Integration Tests

- `tests/bank-sync-tests/`, `tests/budget-tests/`, and `tests/consolidation-tests/` are dedicated Vitest integration workspaces
- They currently contain 73 test files and are the suites executed by root `yarn test` and `yarn test:coverage`

## Coding Standards and Best Practices

**IMPORTANT**: Never write comments!

### TypeScript Best Practices

- **Never use `any` type**: Everything must be properly typed
- **Maximize TypeScript usage**: Leverage TypeScript's type system to its fullest extent
- **Strict typing**: Use strict TypeScript settings and avoid type assertions unless absolutely necessary
- **Proper database typing**: Repository classes must use `ExpoSQLiteDatabase<Record<string, never>>` for db parameter, never `any`
- **Type inference**: Let TypeScript infer types when possible, but be explicit for public APIs
- **No type circumvention**: Never use `as any` or `@ts-ignore` to bypass type checking

### Module Structure and Organization

- **Follow modular architecture**: Separate concerns into distinct folders (api/, repository/, service/, constant/, interface/, enum/)
- **Single Responsibility Principle**: Each file exports one entity with one clear responsibility
- **No barrel exports**: Avoid index.ts re-exports; import directly from specific files
- **File naming**: Use kebab-case matching the exported entity name, ending with file type (`.service.ts`, `.repository.ts`, `.constant.ts`)

### Naming Conventions

- **Interfaces**: Must end with `Interface` suffix (e.g., `ExchangeRateApiResponseInterface`)
- **Enums**: Must end with `Enum` suffix (e.g., `ThemeEnum`)
- **Functions**: Use module name as prefix for simple functions (e.g., `exchangeRatesFetchApi`)
- **Classes**: Use PascalCase (e.g., `ExchangeRateRepository`)

### Repository Pattern

- **Location**: Repository classes should be in `packages/contracts/src/[entity]/repository/`
- **Structure**: Create expert OOP classes following singleton pattern
- **Instantiation**: Export singleton instances in `packages/app/src/@[module]/repository/` that inject `db`
- **Dependency injection**: Repositories accept `db` instance in constructor
- **Database typing**: Use `ExpoSQLiteDatabase<typeof schema>` with eslint-disable for db parameter (this is the only acceptable use of `any`)
    ```typescript
    import * as schema from '../../schema';
    import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

    export class MyRepository {
        constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}
    }
    ```

### Type Guards and Validation

- **Always use typeguards from `@rnw-community/shared`**:
    - `isDefined()` for nullish checks (never use `!== null`, `!== undefined`, or `??`)
    - `isNotEmptyArray()` for array validation
    - `isNotEmptyString()` for string validation
    - `isPositiveNumber()` for numeric validation

### Drizzle ORM Best Practices

- **Query**: Use `db.query.[EntityName].findMany/findFirst` instead of `db.select().from(...)`
- **Upsert operations**: Use `.onConflictDoUpdate()` instead of select-then-update pattern

### Service Layer

- **Structure**: Create service classes (not functions) for business logic
- **Pattern**: Export singleton instances (e.g., `export const exchangeRatesService = new ExchangeRatesService()`)
- **Methods**: Public methods first, then private methods (follow `@typescript-eslint/member-ordering`)
- **Composition**: Services compose API and repository layers

### Background Tasks (Expo)

- **Task files**: Name with `.task.ts` suffix (e.g., `exchange-rate-sync.task.ts`)
- **Registration**: Background task registration logic should be part of the service class, not separate files
- **Import task definitions**: Import task definition files directly in app entry point to ensure TaskManager.defineTask runs

### Separation of Concerns

- **API layer**: Handle external service communication (e.g., fetching from third-party APIs)
- **Repository layer**: Manage all database operations (read/write to SQLite)
- **Service layer**: Orchestrate business logic by composing API and repository
- **Task layer**: Manage background job registration and execution

## Important Notes for Agents

1. **Trust these instructions**: Only search the codebase if information here is incomplete or incorrect. These instructions are comprehensive and validated.

2. **Command sequence matters**: Always install dependencies first, then build, then validate (ts/lint/test).

3. **Don't fix unrelated warnings**: The codebase has known acceptable warnings (empty interfaces, magic numbers in tests). Focus only on errors or warnings introduced by your changes.

4. **Respect the monorepo structure**: Changes in packages/contracts affect packages/app. Always rebuild after contract changes.

5. **Use conventional commits**: The commit-msg hook will reject non-conforming messages. Format: `type(scope): description`

6. **Check CI before merging**: All PR checks must pass (Oxfmt, TypeScript, Oxlint, residual ESLint, tests, deadcode, cpd).

7. **Expo app requires secrets**: Cannot build native apps locally without EXPO_TOKEN. Use `yarn start` for local dev.

8. **Node version**: Requires Node.js >= 22.22.1. Check with `node --version` if encountering unexpected errors.

9. **Yarn version**: Must use Yarn 4.17.1 with the repository's `node-modules` linker, not PnP, classic Yarn, or npm.
