# Untyped ESLint Fallback Design

**Approved:** 2026-07-14  
**Implementation baseline:** `1f07afc9205b25bfcbc4d2d03e12311e5896cedf` (`fix: keep Knip within CI memory limits`)

## Objective

Remove ESLint's TypeScript program construction without losing the useful `no-unnecessary-condition` diagnostic. Oxlint remains the primary type-aware linter; ESLint becomes a strictly syntax-based fallback for rules Oxlint does not implement. The change must improve measured lint cost, retain the repository's written enum convention, and replace the invalid cached-versus-forced benchmark comparison with reproducible evidence.

## Rule Ownership

- Enable Oxlint's native `typescript/no-unnecessary-condition` rule at error severity for the existing TypeScript and TSX scope. This replaces `@typescript-eslint/no-unnecessary-condition`; both linters must never own the diagnostic simultaneously.
- Remove `@typescript-eslint/no-unnecessary-condition` and `@typescript-eslint/naming-convention` from the literal ESLint residual list and from explicit ESLint rule configuration.
- Reduce the documented and asserted fallback count from 62 to exactly 60.
- Replace `tseslint.configs.strictTypeChecked` with `tseslint.configs.strict` and remove `languageOptions.parserOptions.projectService`. No ESLint rule may require parser services after the change.
- Keep the official `eslint-plugin-oxlint` disabling layer as the final production layer, followed only by the intentional dormant `**/*.spec.ts` override. Its generated coverage must continue to disable JavaScript and TypeScript rules already owned by `.oxlintrc.json`.

Before editing, capture effective ESLint configurations for representative `.ts`, `.tsx`, test, and service files. After editing, repeat the audit and enumerate all enabled fallback rules. The audit must prove that the only intended ownership changes are the two removed residual IDs, that the final set contains exactly 60 IDs, and that no enabled ESLint rule requires type information. If switching to `strict` changes any unrelated effective rule, configure that rule explicitly to preserve the current behavior or stop the migration for review.

## Enum Naming Policy

Automated enum-member naming enforcement is intentionally retired because Oxlint does not yet implement `naming-convention`. The repository's `UPPER_CASE` enum rule remains unchanged in `AGENTS.md` and continues to govern reviews and new code.

Add a concise unchecked TODO to the root `README.md` backlog. It must name the missing `UPPER_CASE` enum-member automation and say to restore it with Oxlint when Oxlint supports an equivalent naming-convention rule. This is the only intentional diagnostic loss; do not weaken or delete the policy prose.

## Performance Measurement

Delete active documentation and PR claims that compare a cache-assisted 12.53-second baseline with a forced 60.39-second migrated run. Historical specs and implementation plans remain untouched.

Remeasure baseline `1f07afc9205b25bfcbc4d2d03e12311e5896cedf` and the implementation commit in separate detached worktrees using the same machine, Node and Yarn versions, immutable install, lint targets, concurrency, remote-cache setting, and cache policy. For each revision:

1. Measure uncached lint with remote caching disabled, `.turbo` removed, and forced Turbo execution.
2. Measure uncached full validation with the same forced policy for `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`.
3. Measure cache-assisted validation separately after an explicit priming run.
4. Record multiple samples, wall time, exit status, and peak memory. Label memory according to what the measuring tool actually observes; do not present a single-process maximum as aggregate process-tree RSS.

Compare only matching workloads and report medians with the sample count and cache policy. Generated benchmark outputs remain ignored local or CI artifacts. Update only current operational documentation and the pull-request description with verified results; remove obsolete or misleading numbers rather than preserving them for narrative continuity.

## Validation

Implementation is acceptable only when all of the following pass:

- Immutable dependency installation.
- Effective-config and exact-60-rule assertions.
- A focused fixture proving Oxlint reports `typescript/no-unnecessary-condition` while ESLint does not duplicate it.
- A focused enum fixture proving the naming diagnostic is intentionally absent and the README TODO is present.
- `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`.
- Relevant builds and integration tests if configuration changes expose failures.
- Clean-tree and documentation scans confirming current references say 60 rules and no active source repeats the invalid cold comparison.
- CI on the exact pushed commit, with benchmark claims updated only from successful artifacts.

No implementation plan or benchmark artifact may be staged or committed.

## Risks And Rollback

- `strict` and `strictTypeChecked` can differ beyond parser-service rules. The before/after effective-config audit is the guard against accidental diagnostic loss.
- Oxlint's rule semantics may differ from typescript-eslint. A representative positive and negative fixture must establish acceptable ownership before removing the ESLint rule.
- Removing `projectService` may reveal a plugin that implicitly expects parser services. Any crash or missing unrelated rule blocks the change.
- Total validation time can still be dominated by TypeScript, Knip, concurrency, or filesystem state. Report measured results without promising a target that the data does not support.
- Enum naming becomes review-enforced until Oxlint gains equivalent support. The root TODO makes that debt explicit without retaining the expensive typed ESLint graph.

Rollback is one coherent revert of the implementation commit: restore `strictTypeChecked`, `projectService`, both TypeScript-ESLint residuals, the 62-rule assertions and documentation, and remove Oxlint's replacement rule plus the README TODO. Benchmark corrections that merely remove invalid claims should not be rolled back.
