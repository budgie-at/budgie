# Oxc Toolchain Migration Design

Date: 2026-07-13  
Status: Superseded on 2026-07-14 by the [Untyped ESLint Fallback Design](2026-07-14-remove-typed-eslint-fallback-design.md)

The final implementation has 38 root development dependencies and a 60-rule syntax-only ESLint fallback. Oxlint owns `typescript/no-unnecessary-condition`. The remaining content is preserved as the historical approved migration design.

## Decision

Budgie will upgrade its repository toolchain, run type-aware Oxlint once across the existing production-package lint scope, retain ESLint 10 for exactly 61 residual rules, and replace Prettier with Oxfmt. Canonical `typescript` remains the TypeScript 6 API package required by typescript-eslint, editors, and compiler-API consumers. TypeScript 7 compilation is provided separately by `@typescript/native` and invoked explicitly.

The migration is tandem-first. The current ESLint and Prettier baseline remains available until diagnostic parity and formatter idempotence pass. Performance is measured but never justifies lost diagnostics.

## Goals and Non-goals

- Set Node to `>=22.22.1` and Yarn to `4.17.1`.
- Upgrade or replace all 33 current root development-dependency targets as one peer-compatible toolchain and add six Oxc/compatibility dependencies.
- Keep canonical TypeScript on `npm:@typescript/typescript6@6.0.2`; use `npm:typescript@7.0.2` only through `@typescript/native`.
- Preserve current production lint targets, inline disables, formatter options, Lingui generated-file exclusions, and lint-staged package sorting.
- Separate read-only CI/check commands from safe local/staged write commands.
- Do not change application behavior, enable dangerous fixes, expand Jest coverage, enable Oxfmt import/package sorting, add Babel 8, or perform an Expo/Babel migration.

## Platform and Dependency Targets

`package.json#engines.node` becomes `>=22.22.1`; `packageManager` and `.yarn/releases` become Yarn `4.17.1`. The 33 current root targets are:

| Current target group | Exact target |
| --- | --- |
| `@commitlint/cli`; conventional and Lerna configs | `21.2.1`; both configs `21.2.0` |
| `@eslint/js`; ESLint | `10.0.1`; `10.7.0` |
| `@jest/globals`; `babel-jest`; Jest | `30.4.1`; `30.4.1`; `30.4.2` |
| `@lingui/cli` and existing Lingui direct dependencies/resolutions | coordinated `6.5.0` |
| `@rnw-community/eslint-plugin`; `@stylistic/eslint-plugin` | hold `2.0.0`; `5.10.0` |
| `@types/node`; `@types/react`; `@types/react-dom` | `22.20.1`; `19.2.17`; `19.2.3` |
| `eslint-plugin-import`; Jest; Lingui; Node | hold `2.32.0`; `29.15.4`; `0.14.0`; `18.2.2` |
| `eslint-plugin-promise`; React; React Hooks | hold `7.3.0`; hold `7.37.5`; `7.1.1` |
| Husky; jscpd; Knip; Lerna; lint-staged | `9.1.7`; `5.0.12`; `6.26.0`; `9.0.7`; `17.0.8` |
| Prettier replacement; rimraf; rnsec; sort-package-json; Turbo | Oxfmt `0.58.0`; `6.1.3`; `1.3.0`; `4.0.0`; `2.10.4` |
| canonical `typescript`; `typescript-eslint` | `npm:@typescript/typescript6@6.0.2`; `8.63.0` |

Add `@eslint/compat@2.1.0`, `oxlint@1.73.0`, `@oxlint/migrate@1.73.0`, `eslint-plugin-oxlint@1.73.0`, `oxlint-tsgolint@0.24.0`, and `@typescript/native@npm:typescript@7.0.2`. The final normal root development-dependency count is 38. Nx stays transitive at `22.7.5`; do not add it directly.

After install, run `yarn explain peer-requirements`. If direct root `babel-jest@30.4.1` leaves `@babel/core` unsatisfied, add root `@babel/core@7.29.7`. Do not select Babel 8 or modify Expo Babel configuration.

## TypeScript Topology

The official side-by-side model is:

```json
{
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "@typescript/native": "npm:typescript@7.0.2"
}
```

- `typescript` is the canonical TS6 API seen by typescript-eslint, ESLint, editors, Next/Expo integrations, and packages importing the compiler API.
- Every repository `build`/`ts` script that currently invokes `tsc` must instead invoke the TS7 binary at `node ../../node_modules/@typescript/native/bin/tsc`; this covers AI, bank-sync, budget, consolidation, contracts, logger, app, landing, bank-sync-tests, budget-tests, consolidation-tests, and test-kit.
- Verify `yarn node -p "require('typescript/package.json').version"` prints `6.0.2` and `yarn node -p "require('@typescript/native/package.json').version"` prints `7.0.2`.
- Verify both `yarn tsc --version` and `node node_modules/@typescript/native/bin/tsc --version`. Yarn `4.17.1` includes the install fix from PR `#7190`, but issues `#7215` and `#7216` may still mislink an alias-provided binary. If the native alias wins the `tsc` shim or the shim is otherwise ambiguous, all scripts keep the explicit `@typescript/native/bin/tsc` path; canonical `typescript` is never changed to TS7.

## Lint Architecture and Scope

Root check commands are non-writing:

```text
lint:oxlint = oxlint --type-aware packages/app/src packages/landing packages/ai/src packages/budget/src packages/logger/src packages/bank-sync/src packages/consolidation/src packages/contracts/src
lint:eslint = eslint packages/app/src packages/landing packages/ai/src packages/budget/src packages/logger/src packages/bank-sync/src packages/consolidation/src packages/contracts/src
lint = yarn lint:oxlint && yarn lint:eslint
```

The target list is literal; it does not lint tests or app scripts because current Turbo lint does not. Package-local `lint` scripts become read-only Oxlint-then-ESLint checks for their existing `src`/`.` scope; `lint:fix` variants use Oxlint `--fix` followed by ESLint `--fix`. CI uses only the check path.

Generate `.oxlintrc.json` with `@oxlint/migrate --type-aware --js-plugins=false`, preserve all current ignores/overrides, and audit the generated config. Keep `eslint.config.mjs` as the fallback boundary. Wrap RNW Community, import, and React plugins with `fixupPluginRules` from `@eslint/compat`; do not wrap plugins that load on ESLint 10 without compatibility help. Compose `eslint-plugin-oxlint` last.

Existing `eslint-disable` comments remain unchanged because both linters honor them. The dormant `**/*.spec.ts` Jest override remains dormant; this migration does not expand it to the repository's 73 `.test.ts` files.

## Exact 61-rule ESLint Residual

**Oxlint nursery retained in ESLint (7):** `no-restricted-exports`, `no-unreachable-loop`, `no-useless-assignment`, `@typescript-eslint/no-unnecessary-condition`, `import/export`, `promise/no-return-in-finally`, `react/require-render-return`.

**External/local JS rules (9):** `@stylistic/lines-between-class-members`, `budgie/max-component-props`, `lingui/t-call-in-function`, `lingui/no-single-tag-to-translate`, `lingui/no-single-variables-to-translate`, `lingui/no-trans-inside-trans`, `lingui/no-expression-in-message`, `lingui/no-unlocalized-strings`, `@rnw-community/no-complex-jsx-logic`.

**Not implemented natively (18):** `consistent-this`, `id-denylist`, `no-restricted-syntax`, `require-atomic-updates`, `@typescript-eslint/naming-convention`, `@typescript-eslint/member-ordering`, `n/hashbang`, `n/no-deprecated-api`, `n/no-extraneous-import`, `n/no-extraneous-require`, `n/no-missing-require`, `n/no-process-exit`, `n/no-unpublished-bin`, `n/no-unpublished-import`, `n/no-unpublished-require`, `n/no-unsupported-features/es-builtins`, `n/no-unsupported-features/node-builtins`, `n/process-exit-as-throw`.

**Unsupported or only superseded by different semantics (26):** `camelcase`, `no-invalid-this`, `no-octal`, `no-octal-escape`, `no-undef-init`, `nonblock-statement-body-position`, `newline-before-return`, `import/order`, `react/jsx-uses-react`, `react/jsx-uses-vars`, `react/no-deprecated`, `react-hooks/static-components`, `react-hooks/use-memo`, `react-hooks/component-hook-factories`, `react-hooks/preserve-manual-memoization`, `react-hooks/incompatible-library`, `react-hooks/immutability`, `react-hooks/globals`, `react-hooks/refs`, `react-hooks/set-state-in-effect`, `react-hooks/error-boundaries`, `react-hooks/purity`, `react-hooks/set-state-in-render`, `react-hooks/unsupported-syntax`, `react-hooks/config`, `react-hooks/gating`.

**Formatter conflict retained in ESLint (1):** `sort-imports`.

No residual is removed merely because a compiler or formatter has a related check. Enabling Oxlint nursery rules, JS plugins, or Oxfmt import sorting is a later separately reviewed migration.

## Oxfmt Configuration and Exact Scopes

Create `.oxfmtrc.json` with `singleQuote: true`, `printWidth: 140`, `tabWidth: 4`, `semi: true`, `trailingComma: "none"`, `arrowParens: "avoid"`, `sortImports: false`, and `sortPackageJson: false`. Move these ignores into `ignorePatterns`: `.agents/**`, `packages/app/src/i18n/locales/*/messages.ts`, and `packages/landing/src/i18n/locales/*/messages.ts`.

- Root `format`: `oxfmt --write "**/*.{ts,tsx}" packages/app/expo-env.d.ts packages/app/nativewind-env.d.ts`.
- Root `format:check`: the identical arguments with `--check`.
- AI, bank-sync, budget, consolidation, contracts, and logger package `format` scripts: `run -T oxfmt --write src`; app and landing gain no package format script.
- The scope is the current 2,475 tracked TS/TSX files. Explicit declaration paths preserve the two tracked `.d.ts` files that Oxfmt otherwise skips via `.gitignore`. Generated `.next`, Turbo, native, dist, public, build, `packages/app/drizzle`, Lingui compiled catalogs, and `.agents` content remain outside formatter ownership; source files under `packages/app/src/@generic/drizzle` remain included.
- Delete Prettier from `package.json`/`yarn.lock`, `.prettierrc.js`, `.prettierignore`, all six package Prettier scripts, and active Prettier references in `AGENTS.md` and `.github/copilot-instructions.md`. Historical changelogs are not rewritten.
- Root `format` never sorts manifests. Only lint-staged invokes `sort-package-json`; Oxfmt package sorting is incompatible and changed 7 current manifests in the conformance probe.

Lint-staged order is exact:

```text
*.{ts,tsx}: oxlint --type-aware --fix, then eslint --fix
*.{ts,tsx,md,json,js}: oxfmt --write
package.json: sort-package-json
```

Oxfmt import sorting stays disabled: the closest current grouping probe changed 192 TS/TSX files and did not exactly reproduce `import/order` plus `sort-imports`.

## Files and CI Surfaces

Change only the relevant surfaces: root `package.json` and `yarn.lock`; `.yarnrc.yml` and `.yarn/releases`; all package/test manifests containing `tsc`, ESLint, or Prettier scripts; `eslint.config.mjs`; new `.oxlintrc.json` and `.oxfmtrc.json`; `eslint-rules/max-component-props.mjs` only if ESLint 10 compatibility requires it; `.lintstagedrc.js`; `turbo.json`; `.husky/pre-commit`; `.github/workflows/pr.yml`; `AGENTS.md`; package AGENTS files that describe changed commands; and `.github/copilot-instructions.md`.

`yarn lint` and PR CI are read-only. `yarn lint:fix`, lint-staged, and `yarn format` write. Replace PR CI's `yarn turbo run lint --concurrency=2` with `yarn lint`, add `yarn format:check`, and retain the existing Lingui, TypeScript, selector, deadcode, CPD, build, and test jobs. Turbo keeps `ts`, `build`, and tests; root lint is no longer fanned out because Oxlint must build type information once.

## Diagnostics and Benchmarks

Before pruning ESLint or deleting Prettier, create `.ci-artifacts/oxc-toolchain/` and capture:

- `environment.txt`
- `eslint-baseline.json`, `eslint-baseline.time.txt`
- `prettier-baseline.time.txt`
- `oxlint.json`, `oxlint.time.txt`
- `eslint-fallback.json`, `eslint-fallback.time.txt`
- `oxfmt.time.txt`

Baseline commands are `yarn eslint packages/app/src packages/landing packages/ai/src packages/budget/src packages/logger/src packages/bank-sync/src packages/consolidation/src packages/contracts/src --format json --output-file .ci-artifacts/oxc-toolchain/eslint-baseline.json` and `yarn prettier --check "**/*.{ts,tsx}"`. Migrated commands are `yarn oxlint --type-aware packages/app/src packages/landing packages/ai/src packages/budget/src packages/logger/src packages/bank-sync/src packages/consolidation/src packages/contracts/src --format json > .ci-artifacts/oxc-toolchain/oxlint.json`, `yarn eslint packages/app/src packages/landing packages/ai/src packages/budget/src packages/logger/src packages/bank-sync/src packages/consolidation/src packages/contracts/src --format json --output-file .ci-artifacts/oxc-toolchain/eslint-fallback.json`, and `yarn oxfmt --check "**/*.{ts,tsx}" packages/app/expo-env.d.ts packages/app/nativewind-env.d.ts`.

Wrap the diagnostic commands with `/usr/bin/time -l -o FILE` on macOS and `/usr/bin/time -v -o FILE` on Linux. CI uploads `.ci-artifacts/oxc-toolchain/` as artifact `oxc-toolchain-benchmark` and writes elapsed time, maximum RSS, exit status, Node, Yarn, CPU, and OS to the job summary.

The TypeScript and complete-validation comparison has eight independent paths. Run every path in its own fresh checkout at the named commit, run `yarn install --immutable`, create `.ci-artifacts/oxc-toolchain/`, remove `.turbo`, then execute the matching block. `fresh` is the first measured run after that setup; `warm-1` through `warm-5` are the next five runs in the same checkout. The TypeScript benchmark sets `TURBO_FORCE=true` so all package checks execute on every run. Full validation intentionally measures the real required root workflow, including its normal Turbo cache behavior.

At the baseline commit, macOS local TypeScript checks use:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -l -o ".ci-artifacts/oxc-toolchain/benchmark-baseline-ts-local-${run}.txt" env TURBO_FORCE=true yarn ts
done
```

At the baseline commit, Linux CI TypeScript checks use:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -v -o ".ci-artifacts/oxc-toolchain/benchmark-baseline-ts-ci-${run}.txt" env TURBO_FORCE=true yarn ts
done
```

At the migrated commit, macOS local TypeScript checks use:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -l -o ".ci-artifacts/oxc-toolchain/benchmark-migrated-ts-local-${run}.txt" env TURBO_FORCE=true yarn ts
done
```

At the migrated commit, Linux CI TypeScript checks use:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -v -o ".ci-artifacts/oxc-toolchain/benchmark-migrated-ts-ci-${run}.txt" env TURBO_FORCE=true yarn ts
done
```

At the baseline commit, macOS local complete validation uses the baseline Prettier, canonical TypeScript 6, Turbo ESLint, Knip, and jscpd scripts in the required order:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -l -o ".ci-artifacts/oxc-toolchain/benchmark-baseline-validation-local-${run}.txt" sh -c 'yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd'
done
```

At the baseline commit, Linux CI complete validation uses:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -v -o ".ci-artifacts/oxc-toolchain/benchmark-baseline-validation-ci-${run}.txt" sh -c 'yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd'
done
```

At the migrated commit, macOS local complete validation uses Oxfmt, native TypeScript 7, root Oxlint plus residual ESLint, Knip, and jscpd scripts in the required order:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -l -o ".ci-artifacts/oxc-toolchain/benchmark-migrated-validation-local-${run}.txt" sh -c 'yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd'
done
```

At the migrated commit, Linux CI complete validation uses:

```bash
for run in fresh warm-1 warm-2 warm-3 warm-4 warm-5; do
    /usr/bin/time -v -o ".ci-artifacts/oxc-toolchain/benchmark-migrated-validation-ci-${run}.txt" sh -c 'yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd'
done
```

These blocks create exactly 48 benchmark files: six files for each baseline/migrated, TypeScript/validation, and local/CI combination. `/usr/bin/time` records elapsed time and peak RSS in every file and returns the measured command's exit status.

Normalize diagnostics by path, line, column, severity, and mapped rule ownership. Every baseline diagnostic must appear in Oxlint or the residual ESLint output unless the semantic retirement is explicitly documented in the PR.

## Go/No-go Gates

Do not remove baseline dependencies/configuration or commit the formatter cutover until all gates pass:

1. `yarn install --immutable`, version probes, `yarn explain peer-requirements`, TS6 canonical resolution, and explicit TS7 binary resolution pass on macOS and Linux.
2. Oxlint plus residual ESLint starts under ESLint 10, all 61 residual rules remain active in representative files, and diagnostic comparison has no unexplained loss.
3. Oxfmt changes zero tracked TS/TSX files under the migrated options, a second write produces no diff, compiled Lingui catalogs remain untouched, and `sort-package-json` is idempotent.
4. Check commands leave `git status --short` empty; only declared fix/format commands write.
5. The required validation order passes, followed by build and tests: `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd && yarn build && yarn test`.
6. PR CI repeats `yarn i18n:check`, `yarn format:check`, `yarn ts`, `yarn lint`, selector checks, deadcode, CPD, build, and `test:coverage` without modifying tracked files.

A failed gate is a no-go: retain the full ESLint/Prettier baseline, fix the migration on the feature branch, and rerun the complete gate. Performance regression is investigated and reported but cannot waive correctness or idempotence.

## Branch, Commits, and Push

Create `codex/oxc-toolchain-migration`. Preserve a baseline commit before pruning, then use coherent Conventional Commits: `build: upgrade repository toolchain`, `refactor: add Oxlint with ESLint fallback`, `refactor: replace Prettier with Oxfmt`, and `docs: update toolchain workflow`. After all gates pass, push with `git push -u origin codex/oxc-toolchain-migration` and open a draft PR containing the diagnostic and benchmark artifact summaries.

## Official References

- [Oxlint ESLint migration](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint) and [type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [Oxlint JS-plugin limitations](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) and [inline ESLint-comment compatibility](https://oxc.rs/docs/guide/usage/linter/ignore-comments.html)
- [Oxfmt Prettier migration](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html), [configuration](https://oxc.rs/docs/guide/usage/formatter/config.html), and [sorting](https://oxc.rs/docs/guide/usage/formatter/sorting)
- [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0) and [`@eslint/compat`](https://eslint.org/blog/2024/05/eslint-compatibility-utilities/)
- [TypeScript native port](https://devblogs.microsoft.com/typescript/typescript-native-port/) and [`@typescript/native`](https://www.npmjs.com/package/@typescript/native)
- [Yarn install fix PR #7190](https://github.com/yarnpkg/berry/pull/7190), [alias-bin issue #7215](https://github.com/yarnpkg/berry/issues/7215), and [alias-bin issue #7216](https://github.com/yarnpkg/berry/issues/7216)
- [Turborepo tasks](https://turborepo.com/docs/crafting-your-repository/configuring-tasks), [lint-staged](https://github.com/lint-staged/lint-staged), and [Jest 30](https://jestjs.io/docs/upgrading-to-jest30)
