# Budgie - Copilot Agent Instructions

## Repository Overview

**Project**: Budgie - Mobile Expenses, Banking & Wealth Tracker (Offline-First)
**Type**: Monorepo with React Native (Expo) mobile app, Next.js landing page, and shared contracts
**Size**: ~176 TypeScript/TSX files across multiple packages
**Languages**: TypeScript, React/React Native
**Key Technologies**: Expo 54, React 19, Next.js 15, TurboRepo, Lerna, WatermelonDB, Drizzle ORM

## Build & Development Requirements

**Required Versions**:
- Node.js: >= 22.0.0 (configured in package.json engines)
- Yarn: 4.10.3 (packageManager specified)
- All dependencies use Yarn Berry (v4) with PnP

**IMPORTANT**: Always use `yarn` commands, not `npm`. This repository uses Yarn 4 workspaces.

## Essential Commands (VALIDATED)

### Bootstrap & Setup
1. **Install dependencies** (ALWAYS run first): `yarn install`
   - Takes ~40s on first run (downloads packages, builds native modules)
   - Automatically runs post-install hook that builds packages
   - May show peer dependency warnings - these are expected and safe to ignore

### Build Commands
2. **Build all packages**: `yarn build` (uses Turbo cache, ~15s clean build)
   - Builds in dependency order: contracts → app & landing
   - Use `yarn build:force` to bypass Turbo cache (~15s)
   - Landing package builds Next.js app (~3-4s for production build)
   - Contracts package compiles TypeScript to dist/esm (~2s)

### Validation Commands (Run in this order)
3. **TypeScript check**: `yarn turbo ts` (~10s)
   - Validates TypeScript across all packages
   - No output files generated (cache warning is expected)
   
4. **Linting**: `yarn turbo lint` (~18s)
   - ESLint with strict configuration
   - Current codebase has ~55 warnings (empty interfaces, magic numbers) - these are acceptable
   
5. **Deadcode detection**: `yarn turbo deadcode` (~5s)
   - Uses Knip to find unused code and dependencies
   - Clean codebase should show "no issues found"
   
6. **Copy/paste detection**: `yarn turbo cpd` (~2s)
   - Uses jscpd to detect code duplication
   - Reports saved to report/jscpd/html/

7. **Unit tests**: `yarn test` (~4s)
   - Runs Jest tests in packages/contracts (12 test suites, 57 tests)
   - Uses `yarn test:coverage` for coverage reports

### Package-Specific Commands
- **Contracts package**: `cd packages/contracts && yarn test` (schema validation tests)
- **App package**: `cd packages/app && yarn start` (starts Expo dev server)
- **Landing package**: `cd packages/landing && yarn start` (starts Next.js dev server on port 3000)

## CI/CD Pipelines

### Pull Request Workflow (.github/workflows/pr.yml)
**Triggered on**: Every pull request
**Jobs**:
1. **code-quality** (runs on ubuntu-latest, ~2-3 min):
   - Validates PR title with commitlint (conventional commits required)
   - Runs `yarn turbo ts` (TypeScript checks)
   - Runs `yarn turbo lint` (ESLint)
   - Runs `yarn turbo deadcode` (Knip)
   - Runs `yarn turbo cpd` (jscpd)
   - Runs `yarn test:coverage` (Jest with coverage)
   - Uploads coverage to Codecov
   
2. **eas-deploy** (requires code-quality to pass):
   - Creates Expo EAS update for development channel
   - Builds and deploys web app to Vercel
   - Posts deployment URL as PR comment
   - Creates GitHub deployment environment
   
3. **e2e-ios** & **e2e-android** (currently disabled with `if: false`):
   - Would run Maestro E2E tests on iOS and Android
   - Uses EAS local builds with e2e profile

### Main Branch Workflow (.github/workflows/main.yml)
**Triggered on**: Push to main or manual workflow_dispatch
**Jobs**:
1. **release**: 
   - Publishes releases using Lerna with conventional commits
   - Requires `PUSH_TO_PROTECTED_TOKEN` secret
   - Creates GitHub releases automatically
   
2. **eas-update**:
   - Publishes EAS update to production channel

## Project Structure

### Root Directory
```
/
├── packages/
│   ├── app/              # React Native (Expo) mobile app
│   ├── contracts/        # Shared TypeScript schemas and types
│   └── landing/          # Next.js marketing website
├── tests/
│   └── app-tests/        # Maestro E2E tests
├── .github/workflows/    # CI/CD pipelines
├── .husky/              # Git hooks (pre-commit, commit-msg)
├── turbo.json           # TurboRepo configuration
├── lerna.json           # Lerna monorepo settings
├── package.json         # Root package with workspace config
└── eslint.config.mjs    # Shared ESLint configuration
```

### packages/app/ (React Native App)
**Main directories**:
- `src/@account/` - Account management components/queries
- `src/@ai/` - AI chat components
- `src/@generic/` - Reusable UI components (chip, icon, etc.)
- `src/@settings/` - Settings screens and logic
- `src/app/` - Expo Router app directory (screens)
- `src/drizzle/` - Database schema and migrations
- `src/locales/` - i18n translations (en, fr, es, uk, de)
- `src/theme/` - Theme configuration and context

**Key files**:
- `app.config.js` - Expo configuration (dynamic based on APP_VARIANT env)
- `eas.json` - EAS Build profiles (development, preview, e2e, production)
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel with React Compiler and Lingui
- `drizzle.config.ts` - Drizzle ORM configuration for SQLite

### packages/contracts/
**Purpose**: Shared TypeScript schemas using Zod and Drizzle
**Structure**:
- Each entity has: schema, entity interface, create interface
- Entities: account, account-balance, category, exchange-rate, instrument, settings, tag, transaction, transaction-entry
- All schemas have comprehensive Jest test suites

### packages/landing/
**Purpose**: Next.js 15 marketing website with App Router
**Key features**: Internationalization (en, fr, es, uk, de), MDX blog, Tailwind CSS

## Configuration Files

### Linting & Formatting
- **eslint.config.mjs**: Strict ESLint with TypeScript, React, React Hooks, Lingui
  - Ignores: .next, .turbo, .expo, dist, node_modules, drizzle
  - Complexity limit: 25
  - Warns on empty interfaces (common in contracts package)
  
- **.prettierrc.js**: Prettier configuration (applied via lint-staged)
- **.lintstagedrc.js**: Pre-commit hooks run `eslint --fix`, `prettier --write`, `sort-package-json`

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
  - Tasks: build, ts, lint, test, test:coverage, cpd, deadcode
  - Remote caching disabled in CI (TURBO_TOKEN configured for user's Vercel account)

## Development Workflow

### Making Code Changes
1. **ALWAYS start with**: `yarn install` (if fresh clone or after pulling)
2. **Before committing**: Changes are automatically validated by Husky hooks
   - TypeScript check runs automatically
   - ESLint fixes applied via lint-staged
   - Commit message validated (must follow conventional commits)
3. **After changes**: Run `yarn turbo ts && yarn turbo lint && yarn test`
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
**Solution**: These are expected. The monorepo structure causes some packages to not directly depend on React, Expo, etc. Safe to ignore.

**Issue**: Turbo cache warnings about missing outputs for ts task
**Solution**: Expected. TypeScript check doesn't produce artifacts, only validates types.

**Issue**: Build fails after dependency update
**Solution**: 
1. Run `yarn dedupe` to resolve version conflicts
2. Run `yarn build:force` to bypass stale Turbo cache
3. Clear node_modules: `rm -rf node_modules && yarn install`

**Issue**: ESLint warnings about empty interfaces
**Solution**: These are in contracts package for future extensibility. Not errors, safe to leave.

**Issue**: Cannot run Expo app builds locally
**Solution**: EAS builds require EXPO_TOKEN secret. Use `yarn start` in packages/app for local development with Expo Go or dev client.

## Key Architectural Patterns

### Monorepo Structure
- Uses Yarn workspaces + Lerna for versioning
- TurboRepo for build orchestration and caching
- Packages share common tooling (ESLint, TypeScript, Prettier)

### Mobile App (packages/app)
- **Framework**: Expo 54 with SDK features (Router, SQLite, Updates)
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
- **Testing**: Comprehensive Jest tests for valid/invalid schema cases

### Landing Site (packages/landing)
- **Framework**: Next.js 15 with App Router
- **Rendering**: Static generation for all pages
- **i18n**: Custom implementation with locale prefixes (/en/, /fr/, etc.)
- **Content**: MDX for blog posts
- **Styling**: Tailwind CSS + Radix UI components

## Testing Strategy

### Unit Tests
- Located in packages/contracts/src/
- Test schema validation (valid/invalid cases)
- Run with `yarn test` (Jest)
- Should maintain 100% coverage on schema validation logic

### E2E Tests
- Located in tests/app-tests/
- Use Maestro for React Native testing
- Currently disabled in CI (e2e-ios, e2e-android jobs have `if: false`)
- Config: tests/app-tests/config.yaml
- Flows: tests/app-tests/flows/

### Integration Tests
- No dedicated integration test suite currently
- Consider adding for database migrations and API integration

## Important Notes for Agents

1. **Trust these instructions**: Only search the codebase if information here is incomplete or incorrect. These instructions are comprehensive and validated.

2. **Command sequence matters**: Always install dependencies first, then build, then validate (ts/lint/test).

3. **Don't fix unrelated warnings**: The codebase has known acceptable warnings (empty interfaces, magic numbers in tests). Focus only on errors or warnings introduced by your changes.

4. **Respect the monorepo structure**: Changes in packages/contracts affect packages/app. Always rebuild after contract changes.

5. **Use conventional commits**: The commit-msg hook will reject non-conforming messages. Format: `type(scope): description`

6. **Check CI before merging**: All PR checks must pass (TypeScript, ESLint, tests, deadcode, cpd).

7. **Expo app requires secrets**: Cannot build native apps locally without EXPO_TOKEN. Use `yarn start` for local dev.

8. **Build times**: 
   - Clean build: ~15s
   - TypeScript check: ~10s  
   - Lint: ~18s
   - Tests: ~4s
   - Full CI run: ~2-3 minutes

9. **Node version**: Requires Node.js >= 22.0.0. Check with `node --version` if encountering unexpected errors.

10. **Yarn version**: Must use Yarn 4.10.3. The repository uses Yarn Berry with PnP, not classic Yarn or npm.
