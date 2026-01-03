# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budgie is an offline-first mobile expenses, banking & wealth tracker built with React Native (Expo). It's a monorepo containing a mobile app, landing page, shared contracts library, and bank sync package.

**Key Characteristics:**
- Offline-first architecture with local SQLite database
- Privacy-focused (data stored locally, optional bank sync)
- Multi-platform: iOS, Android, and Web via React Native
- Monorepo structure using Yarn workspaces, Lerna, and TurboRepo

## Essential Commands

### Setup & Installation
```bash
yarn install                    # Install dependencies (always run first)
```

### Build Commands
```bash
yarn build                      # Build all packages with Turbo cache (~15s)
yarn build:force                # Build without cache
```

### Validation & Testing
```bash
yarn ts                         # TypeScript check (~10s)
yarn lint                       # ESLint across all packages (~18s)
yarn test                       # Run unit tests (~4s)
yarn test:coverage              # Run tests with coverage
yarn deadcode                   # Find unused code with Knip (~5s)
yarn cpd                        # Detect code duplication (~2s)
```

### Package-Specific Commands

**App (packages/app):**
```bash
cd packages/app
yarn start                      # Start Expo dev server with dev client
yarn ios                        # Run iOS app
yarn android                    # Run Android app
yarn web                        # Run web version
yarn prebuild                   # Generate native iOS/Android projects
yarn db:generate                # Generate Drizzle migrations
yarn i18n:sync                  # Extract and compile i18n strings
```

**Contracts (packages/contracts):**
```bash
cd packages/contracts
yarn test                       # Run schema validation tests
yarn build:watch                # Build in watch mode
```

**Landing (packages/landing):**
```bash
cd packages/landing
yarn start                      # Start Next.js dev server (port 3000)
yarn i18n:sync                  # Extract and compile Lingui translations
```

### Development Utilities
```bash
yarn format                     # Format all files with Prettier
yarn deps:check                 # Check dependency version consistency
yarn deps:dedupe                # Deduplicate dependencies
```

## Project Structure

### Monorepo Layout
```
/
├── packages/
│   ├── app/              # React Native (Expo 54) mobile app
│   ├── contracts/        # Shared TypeScript schemas, types, and repositories
│   ├── landing/          # Next.js 15 marketing website
│   └── bank-sync/        # Bank synchronization package
├── tests/
│   └── app-tests/        # Maestro E2E tests
├── turbo.json            # TurboRepo task configuration
├── lerna.json            # Lerna monorepo versioning (v1.104.0)
└── package.json          # Root workspace config
```

### App Structure (packages/app/src/)
```
src/
├── @generic/             # Reusable components and database
│   ├── drizzle/         # SQLite schema, migrations, and DB instance
│   └── [components]     # Shared UI components (chip, icon, etc.)
├── account/             # Account management
├── ai/                  # AI chat functionality
├── auth/                # Authentication
├── category/            # Category management
├── exchange-rate/       # Currency exchange rates
├── export/              # Data export functionality
├── import/              # Data import (CSV, bank sync)
├── instrument/          # Financial instruments
├── settings/            # App settings
├── sync/                # Background sync tasks
├── tag/                 # Transaction tags
├── theme/               # Theme configuration
├── transaction/         # Transaction management
├── app/                 # Expo Router screens (file-based routing)
│   ├── (main)/         # Main app screens
│   ├── (tabs)/         # Tab navigation screens
│   └── _layout.tsx     # Root layout
└── locales/            # i18n translations (en, fr, es, uk, de)
```

### Contracts Structure (packages/contracts/src/)

Each entity follows a consistent structure:
```
entity-name/
├── constant/           # Constants (max/min lengths, defaults)
├── entity/             # Entity interfaces (base, create, update, with-relations)
├── enum/               # Enums (types, statuses)
├── input/              # Input interfaces for operations
├── interface/          # Other interfaces (filters, etc.)
├── repository/         # Repository class (database operations)
├── relations/          # Drizzle ORM relations
├── schema/             # Zod schemas for validation
└── table/              # Drizzle table definitions
```

**Entities:** account, account-balance, bank-sync, category, exchange-rate, instrument, mcc-category, mcc-group, settings, tag, transaction, transaction-entry, transaction-tags

## Architecture & Patterns

### Database Architecture
- **ORM:** Drizzle ORM with expo-sqlite driver
- **Schema Location:** `packages/app/src/@generic/drizzle/db/schema.ts`
- **Migration Generation:** `yarn db:generate` in packages/app
- **Pattern:** Repository pattern with expert OOP classes

### Repository Pattern

**Definition in Contracts:**
Repository classes live in `packages/contracts/src/[entity]/repository/` and are framework-agnostic (accept `db` via constructor).

**Instantiation in App:**
Export singleton instances in `packages/app/src/@[module]/repository/` that inject the database instance.

**Example:**
```typescript
// packages/contracts/src/account/repository/account.repository.ts
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '../schema';

export class AccountRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    async findAll() {
        return this.db.query.accountEntity.findMany();
    }
}

// packages/app/src/account/repository/account.repository.ts
import { AccountRepository } from '@budgie/contracts';
import { db } from '@generic/drizzle/db/db';

export const accountRepository = new AccountRepository(db);
```

### Service Layer
- Services are classes (not functions) that orchestrate business logic
- Export singleton instances (e.g., `export const myService = new MyService()`)
- Services compose API and repository layers
- Public methods first, then private methods (follow `@typescript-eslint/member-ordering`)

### Layered Architecture
1. **API Layer:** External service communication (third-party APIs)
2. **Repository Layer:** Database operations (SQLite via Drizzle)
3. **Service Layer:** Business logic orchestration
4. **Task Layer:** Background job registration (Expo TaskManager)

### Background Tasks
- Named with `.task.ts` suffix
- Registration logic is part of the service class
- Import task definitions in app entry point to ensure `TaskManager.defineTask` runs

### Navigation
- **Framework:** Expo Router (file-based routing)
- **Structure:** Routes defined in `packages/app/src/app/`
- **Tabs:** Main navigation uses tab layout in `app/(tabs)/`

### State Management
- React Context + hooks (no Redux/MobX)
- TanStack Query for server state (mentioned in README)
- Zustand/Jotai for client state (mentioned in README)

### Styling
- **Framework:** NativeWind (Tailwind CSS for React Native)
- **Global Styles:** `packages/app/src/global.css`
- **Components:** Tailwind utility classes with `class-variance-authority` for variants

### Internationalization (i18n)
- **Library:** Lingui with compiled catalogs
- **Supported Languages:** English, French, Spanish, Ukrainian, German
- **Workflow:** Extract with `yarn i18n:extract`, compile with `yarn i18n:compile`, or use `yarn i18n:sync`
- **App Locales:** `packages/app/src/locales/`
- **Landing Locales:** `packages/landing/src/locales/`

## TypeScript & Coding Standards

### Critical Rules

1. **Never use `any` type** - Everything must be properly typed
2. **Never write comments** - Code should be self-documenting
3. **Maximize TypeScript usage** - Leverage the type system fully
4. **No type circumvention** - Never use `as any` or `@ts-ignore`

### Naming Conventions
- **Interfaces:** Must end with `Interface` (e.g., `AccountFilterInterface`)
- **Enums:** Must end with `Enum` (e.g., `AccountTypeEnum`)
- **Functions:** Use module name as prefix (e.g., `exchangeRatesFetchApi`)
- **Classes:** PascalCase (e.g., `AccountRepository`)
- **Files:** kebab-case matching exported entity + type suffix (`.service.ts`, `.repository.ts`, `.constant.ts`)

### Module Organization
- Follow modular architecture with clear separation: `api/`, `repository/`, `service/`, `constant/`, `interface/`, `enum/`
- Single Responsibility Principle - one file, one entity, one purpose
- **No barrel exports** - import directly from specific files (no `index.ts` re-exports)

### Type Guards (Use @rnw-community/shared)
Always use these type guards instead of manual checks:
- `isDefined()` - for nullish checks (never use `!== null`, `!== undefined`, or `??`)
- `isNotEmptyArray()` - for array validation
- `isNotEmptyString()` - for string validation
- `isPositiveNumber()` - for numeric validation

### Drizzle ORM Best Practices
- **Prefer:** `db.query.[EntityName].findMany/findFirst`
- **Avoid:** `db.select().from(...)`
- **Upserts:** Use `.onConflictDoUpdate()` instead of select-then-update pattern

### Database Typing
Repository classes use this pattern for the db parameter:
```typescript
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '../../schema';

constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}
```

## Testing

### Unit Tests
- Located in `packages/contracts/src/`
- Test schema validation (valid/invalid cases)
- Run with `yarn test` or `yarn test:coverage`
- Should maintain 100% coverage on schema validation logic

### E2E Tests
- Located in `tests/app-tests/`
- Use Maestro for React Native testing
- Currently disabled in CI
- Config: `tests/app-tests/config.yaml`

## CI/CD

### PR Workflow (.github/workflows/pr.yml)
Runs on every pull request:
1. **code-quality job:**
   - Validates PR title (conventional commits)
   - Runs `yarn turbo ts` (TypeScript)
   - Runs `yarn turbo lint` (ESLint)
   - Runs `yarn turbo deadcode` (Knip)
   - Runs `yarn turbo cpd` (jscpd)
   - Runs `yarn test:coverage`
   - Uploads coverage to Codecov

2. **eas-deploy job:**
   - Creates Expo EAS update (development channel)
   - Deploys web app to Vercel
   - Posts deployment URL as PR comment

3. **e2e-ios & e2e-android:** Currently disabled

### Main Branch Workflow (.github/workflows/main.yml)
Runs on push to main:
1. **release job:** Publishes releases with Lerna (conventional commits)
2. **eas-update job:** Publishes EAS update to production channel

## Git Workflow

### Commit Message Format
**Required:** `type(scope): description`

**Types:** feat, fix, chore, docs, style, refactor, perf, test
**Scopes:** Package names (app, contracts, landing, bank-sync) or feature areas

**Examples:**
- `feat(app): add expense tracking screen`
- `fix(contracts): validate transaction amount range`
- `chore: update dependencies`

### Pre-commit Hooks (Husky)
- Runs `yarn ts` (TypeScript check)
- Runs `yarn lint-staged` (ESLint auto-fix, Prettier, sort-package-json)
- Validates commit message with commitlint

## Technology Stack

### Mobile App (packages/app)
- **Framework:** Expo 54 (SDK)
- **React:** 19.1.0 with React Compiler
- **Navigation:** Expo Router 6 (file-based)
- **Database:** SQLite via Drizzle ORM + expo-sqlite
- **Styling:** NativeWind 5 (Tailwind for RN) + Tailwind CSS 4
- **State:** React Context, TanStack Query, Zustand/Jotai
- **i18n:** Lingui 5.7.0
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React Native
- **Animations:** Reanimated 4, Gesture Handler
- **Key Libraries:** Bottom Sheet, Keyboard Controller, Toast Message

### Landing Page (packages/landing)
- **Framework:** Next.js 15 (App Router)
- **React:** 19.1.0
- **Styling:** Tailwind CSS 4
- **i18n:** Custom implementation with locale prefixes
- **Content:** MDX for blog posts

### Contracts (packages/contracts)
- **Validation:** Zod 4.1.12
- **ORM:** Drizzle ORM 0.44.7 + drizzle-zod
- **Type Guards:** @rnw-community/shared

### Build Tools
- **Package Manager:** Yarn 4.12.0 (Berry with PnP)
- **Node Version:** >= 22.0.0
- **Monorepo:** Lerna 8 for versioning
- **Build Orchestration:** TurboRepo 2
- **TypeScript:** 5.9.3 (strict mode)
- **Linting:** ESLint 9 with TypeScript, React, Lingui plugins
- **Formatting:** Prettier 3
- **Testing:** Jest 29

## Configuration Files

### Key Config Files
- `turbo.json` - TurboRepo task dependencies and caching
- `lerna.json` - Monorepo versioning (current: v1.104.0)
- `eslint.config.mjs` - Shared ESLint rules (strict, complexity limit: 25)
- `packages/app/eas.json` - EAS Build profiles (development, preview, e2e, production)
- `packages/app/app.config.js` - Expo config (dynamic based on APP_VARIANT env)
- `packages/app/drizzle.config.ts` - Drizzle ORM config for SQLite

### Build Variants (APP_VARIANT env)
- `development` - Development builds with dev client
- `preview` - Internal preview builds
- `e2e` - E2E testing builds
- `production` - Production builds

## Common Issues & Solutions

**Issue:** Peer dependency warnings during `yarn install`
**Solution:** Expected and safe to ignore. Monorepo structure causes some packages to not directly depend on React/Expo.

**Issue:** Turbo cache warnings about missing outputs for ts task
**Solution:** Expected. TypeScript check doesn't produce artifacts.

**Issue:** Build fails after dependency update
**Solution:**
1. Run `yarn deps:dedupe`
2. Run `yarn build:force`
3. If still failing: `rm -rf node_modules && yarn install`

**Issue:** ESLint warnings about empty interfaces
**Solution:** These are in contracts package for future extensibility. Not errors, safe to leave.

**Issue:** Cannot run EAS builds locally
**Solution:** Requires EXPO_TOKEN secret. Use `yarn start` for local development with Expo Go or dev client.

## Development Workflow

1. **Fresh clone:** Run `yarn install` first
2. **After pulling:** Run `yarn install` if dependencies changed
3. **Before committing:** Hooks automatically run TypeScript check, ESLint, and commit message validation
4. **After contracts changes:** Run `yarn build` to ensure app package picks up changes
5. **Full validation:** Run `yarn ts && yarn lint && yarn test` before pushing

## Important Notes

- Always use `yarn` commands, never `npm` (Yarn 4 with PnP)
- Requires Node.js >= 22.0.0
- Monorepo structure: changes in contracts affect app (rebuild required)
- Known acceptable warnings: empty interfaces, magic numbers in tests
- Focus only on errors or warnings introduced by your changes
- Never skip hooks (`--no-verify`) unless explicitly instructed
