# Contracts Package Audit Plan

Package: `packages/contracts`

## Summary

The contracts package owns entity contracts, schemas, repositories, tables, relations, and the database-facing logic used by the app. Most complexity is legitimate database complexity, but raw SQL boundaries and a broad root export surface need hardening.

Current pressure points:

- 269 source TypeScript files.
- 11 lint-disable markers.
- 126 non-`as const` assertion matches, mostly SQL and typed helper boundaries.
- 14 focused canonical guard-pattern candidates.
- Largest files include `user-icon-name.enum.ts`, transaction repositories, statistics repository, and the root `index.ts`.
- Three single-consumer utility files (`active-where`, `untranslated-where`, `derive-embedding-flag`) and one one-method repository class (`TransactionEmbeddingRepository`) inflate the file tree without enabling reuse (rules 38/42/43/51). `parse-pending-context-base-fields` has two consumers, so keep it shared while fixing its inline interface placement.
- Confidence-bucket string literals are duplicated across two `.type.ts` files, four interfaces, and raw SQL `IN (...)` lists — a TS/SQL correctness gap every time a bucket name changes (rules 28/45).
- `CategoryUpdateEntitySchema` and `TagUpdateEntitySchema` derive from the full entity schema, exposing auto-managed fields (id, createdAt, deletedAt) as updatable (rule 36).
- Three inline interface definitions in `.constant.ts`, `.util.ts`, and `.base.ts` files violate rule 19; two `.type.ts` files are misplaced inside `/interface` folders.
- `DateRangeInterface` and `TransactionWithRelationsEntityInterface` association fields are missing `readonly` (rule 29).
- Zod import style is split between `import { z } from 'zod'` and named destructured imports with `enum as zodEnum` alias across the package.

## P0: Raw SQL Boundaries Need Validation

The highest-risk repository methods return raw SQL rows through generic type parameters. This is fast and practical, but it lets SQL aliases silently drift from interfaces.

Priority files:

- `transaction/repository/transfer-pair.repository.ts`
- `transaction/repository/transaction.repository.ts`
- `transaction/repository/transaction-pattern.repository.ts`
- `statistics/repository/statistics.repository.ts`
- embedding repositories that map vector query results.

Plan:

1. Add row validation or row builder functions to the highest-risk query outputs first.
2. Keep validation local to the repository unless a row shape is reused by multiple repositories.
3. Prefer Zod where object shape validation is valuable; prefer explicit row builders for hot paths where perf matters.
4. Keep query CTEs together when locality aids review.
5. Use `EXPLAIN QUERY PLAN` and bench scripts before and after SQL changes.

## P1: Transaction Repository Is A Multi-Domain Bucket

`TransactionRepository` owns creation, embedding flag cleanup, external ID lookup, consolidation source lookup, filter queries, account-linked consolidation queries, and list retrieval. This breadth explains the max-lines exception but also hides ownership boundaries.

Plan:

1. Split only by stable consumer-facing responsibility.
2. Candidate split points: embedding flag maintenance, consolidation source queries, external-source helpers, and list/filter retrieval.
3. Keep shared filter-building logic in the base repository if it has multiple consumers.
4. Do not create thin re-export files.
5. Preserve existing public method signatures unless a narrower signature encodes a real invariant.

## P1: Transfer Candidate Discovery Should Be Easier To Test In Slices

`TransferPairRepository` owns direct pair candidates, manual review candidates, ATM cash withdrawal candidates, and IBAN bridge candidates. These are related but independently testable algorithms.

Plan:

1. Keep SQL pipelines intact during the first pass.
2. Add focused bench and explain output for each candidate family.
3. Split repository classes only if consumers or tests can target candidate families without pulling unrelated logic.
4. Keep shared constants in `constant` files and candidate-specific row interfaces under `interface`.

## P1: Pattern Repository Has Two Different Domains

`TransactionPatternRepository` handles repeated transaction suggestions and monthly recurring patterns. Both are pattern detection, but they use different query styles and different review risks.

Plan:

1. Keep the shared pattern row type guards and CTE constants stable.
2. Add validation at raw row boundaries before structural splits.
3. Consider separating monthly recurring detection only after bench coverage is explicit.
4. Keep title/comment grouping local until another repository needs it.

## P2: Public Barrel Is Convenient But Too Broad

`packages/contracts/src/index.ts` has become a 344-line manual public surface. It is useful for package consumers, but it can accidentally expose internal repository rows and constants.

Plan:

1. Audit exports against actual imports in scoped packages.
2. Remove unused public exports only in PRs that can run full TypeScript validation.
3. Keep direct exports from the root index; do not add intermediate barrels.
4. Treat this as API pruning, not formatting churn.

## P1: Single-Consumer Utility Files (Rules 38/42/43/51)

Three utility files in `@generic/util/` and `transaction/util/` have exactly one importer each, and one repository class is a single-method wrapper. Rule 51 makes the remedy mechanical: inline as private methods or expressions on the sole consumer.

Evidence:

- `packages/contracts/src/@generic/util/active-where.util.ts` — sole importer: `translatable-repository.base.ts:4`. Four-line file.
- `packages/contracts/src/@generic/util/untranslated-where.util.ts` — sole importer: `translatable-repository.base.ts:5`. Five-line file.
- `packages/contracts/src/transaction/util/derive-embedding-flag.util.ts:18` — sole importer: `transaction.repository.ts:20`. Also owns the type alias `EmbeddingFlagPatch` (rule 19 / rule 51 combined).
- `packages/contracts/src/@generic/util/parse-pending-context-base-fields.util.ts:5` — defines `PendingContextBaseRowInterface` inline (rule 19) but has two consumers (`comment-embedding.repository.ts` and `merchant-embedding.repository.ts`), so it should stay shared.
- `packages/contracts/src/transaction-embedding/repository/transaction-embedding.repository.ts` — seven-line class with one public method (`countPending`). Rule 38: one-method classes are functions. The singleton is instantiated in `app/src/@generic/drizzle/db/db.ts:103` and consumed in one service (`embedding-progress.store.ts:33`).

Plan:

1. Inline `activeWhere` and `untranslatedWhere` as `private` methods (or direct expressions) on `TranslatableRepositoryBase`. Delete the two util files.
2. Inline `deriveEmbeddingFlag` as a `private` method on `TransactionRepository`; move `EmbeddingFlagPatch` to the repository's `/interface` folder or collapse to an inline `Pick<...>` if it has a single field.
3. Keep `parsePendingContextBaseFields` shared, but move `PendingContextBaseRowInterface` to `@generic/interface/pending-context-base-row.interface.ts`.
4. Move `countPending` logic into `TransactionRepository` as a method (it already queries `TransactionEntityTable`). Remove `TransactionEmbeddingRepository` class and file; update `db.ts` export.
5. Do not add new shared abstractions — each single-consumer move is a net file deletion.

## P1: Magic-String Unions Duplicated in Raw SQL (Rules 28/45)

Confidence-bucket strings and transfer `matchType` values are typed as string-literal unions in TypeScript but duplicated verbatim into raw SQL `IN (...)` lists. A bucket rename requires a grep-and-pray across both domains; tsc catches nothing.

Evidence:

- `packages/contracts/src/transaction/interface/transfer-pair-candidate.interface.ts:21` — `matchType: 'iban' | 'amount' | 'operation-amount' | 'implied-rate'` as a literal union; the same four strings are hard-coded in `transfer-pair.repository.ts:564–568`.
- `packages/contracts/src/transaction/interface/transfer-pair-auto-confidence-bucket.type.ts:1–4` — four `AUTO_*` strings; duplicated in SQL `IN ('AUTO_IBAN_AMOUNT', 'AUTO_SAME_CURRENCY_FAST', 'AUTO_CROSS_CURRENCY_OPERATION', 'AUTO_CROSS_CURRENCY_IMPLIED_RATE')` at `transfer-pair.repository.ts:53,85,543–554`.
- `packages/contracts/src/transaction/interface/transfer-pair-review-confidence-bucket.type.ts:1` — two `REVIEW_*` strings; same SQL duplication.
- `packages/contracts/src/transaction/interface/atm-cash-withdrawal-candidate.interface.ts:2` — `confidenceBucket: 'AUTO_ATM_CASH_WITHDRAWAL'` inline literal while `TransferPairCandidateInterface` uses the named type.
- `packages/contracts/src/transaction/interface/iban-bridge-transfer-candidate.interface.ts:2` — `confidenceBucket: 'AUTO_IBAN_BRIDGE_TRANSFER'` inline literal. Same gap.

Plan:

1. Define `TransferPairConfidenceBucketEnum` (rule 28: UPPER_CASE keys and values) covering all six bucket strings from both type files plus the two inline literals.
2. Define `TransferPairMatchTypeEnum` for the four `matchType` strings.
3. Replace `matchType` union in `TransferPairCandidateInterface` with `TransferPairMatchTypeEnum`; replace `confidenceBucket` in all four candidate interfaces with `TransferPairConfidenceBucketEnum`.
4. Delete `transfer-pair-auto-confidence-bucket.type.ts` and `transfer-pair-review-confidence-bucket.type.ts`; they become redundant subsets of the enum.
5. Rewrite SQL `IN (...)` lists to reference `Object.values(TransferPairConfidenceBucketEnum)` so TS and SQL share a single source of truth.
6. Move the two `.type.ts` files (currently misplaced inside `/interface`) to `/type/` before deleting them — or delete directly if they are replaced entirely by the enum.

## P1: Update-Input Derivation Drift (Rule 36)

Three sibling entities derive their update schemas from different bases. Two use the full entity schema (exposing auto-managed fields as updatable), one uses the correct create-schema base, and two hand-write `Partial<Pick<...>>` instead of schema-inferring.

Evidence:

- `packages/contracts/src/category/schema/category-update-entity.schema.ts:1–2` — `CategoryEntitySchema.partial()`. Wrong base; exposes `id`, `createdAt`, `updatedAt`, `deletedAt` as updatable fields.
- `packages/contracts/src/tag/schema/tag-update-entity.schema.ts:1–4` — `TagEntitySchema.pick({...}).partial()`. Wrong base; same exposure risk.
- `packages/contracts/src/account/schema/account-update-entity.schema.ts` — `AccountCreateEntitySchema.partial()`. Correct (rule 36).
- `packages/contracts/src/account-balance/schema/account-balance-update-entity.schema.ts:3` — `.pick({ amount: true })` on `AccountBalanceCreateEntitySchema`. Single-field DTO (rule 44); the schema and its inferred type add one indirection with no payoff — pass `amount: number` directly at the call site.
- `TransactionUpdateInputInterface` and `TransactionEntryUpdateInputInterface` — already follow rule 36 by using `Partial<Pick<*CreateEntityInterface, ...>>`. Keep them as the convention for repository update inputs.

Plan:

1. Change `CategoryUpdateEntitySchema` to derive from `CategoryCreateEntitySchema.partial()`.
2. Change `TagUpdateEntitySchema` to derive from `TagCreateEntitySchema.partial()`.
3. Keep `TransactionUpdateInputInterface` and `TransactionEntryUpdateInputInterface` as `Partial<Pick<*CreateEntityInterface, ...>>` shapes per rule 36; do not convert them to hand-written update objects or schema-inferred full partials.
4. For `AccountBalanceUpdateEntitySchema`: collapse to a plain `amount: number` parameter only if every call site passes exactly that field and no schema validation boundary needs the object shape.

## P2: Inline Interfaces Outside `/interface` (Rule 19)

Three files define interfaces inline in non-interface files (`.constant.ts`, `.util.ts`, `.base.ts`). Two type alias files are inside `/interface/` instead of `/type/`.

Evidence:

- `packages/contracts/src/@generic/constant/base-entity-fields.constant.ts:3` — `interface BaseOverrides` defined inline in a `.constant.ts` file.
- `packages/contracts/src/@generic/util/parse-pending-context-base-fields.util.ts:5` — `interface PendingContextBaseRowInterface` inline in a `.util.ts` file.
- `packages/contracts/src/@generic/repository/translatable-repository.base.ts:12` — `interface TranslatableColumnsInterface` inline in a `.base.ts` file.
- `packages/contracts/src/transaction/interface/transfer-pair-auto-confidence-bucket.type.ts` — type alias file inside `/interface/`; belongs in `/type/` (moot once collapsed to enum per P1 above).
- `packages/contracts/src/transaction/interface/transfer-pair-review-confidence-bucket.type.ts` — same misplacement.
- `packages/contracts/src/comment-embedding/interface/comment-pending-context.interface.ts:3–4` — single-field extension (`{ readonly comment: string }`) over `EmbeddingPendingContextBaseInterface`. Rule 44: replace with intersection type `EmbeddingPendingContextBaseInterface & { readonly comment: string }` at the call site; delete the file if the intersection is used only inside one repository and `CommentEmbeddingDrainerService` (two consumers — keep if both reference it by name; remove file only if usage can be inlined).

Plan:

1. Move `BaseOverrides` from `base-entity-fields.constant.ts` to `@generic/interface/base-overrides.interface.ts`.
2. Move `PendingContextBaseRowInterface` from `parse-pending-context-base-fields.util.ts` to `@generic/interface/pending-context-base-row.interface.ts` because the parser utility is shared by two embedding repositories.
3. Move `TranslatableColumnsInterface` from `translatable-repository.base.ts` to `@generic/interface/translatable-columns.interface.ts`.
4. Do not create new files for P1 deletions — deletions resolve the misplaced type files.

## P2: Mutable Interface Fields (Rule 29)

Two interfaces expose association and date-range fields without `readonly`, violating the "interfaces are immutable contracts" rule.

Evidence:

- `packages/contracts/src/@generic/interface/date-range.interface.ts:2–3` — `from` and `to` fields not `readonly`. Consumed by `TransactionFilterInterface`, `StatisticsFilterInterface`, and `BaseTransactionFilterRepository.buildDateCondition`.
- `packages/contracts/src/transaction/entity/transaction-with-relations-entity.interface.ts:9–12` — four computed-key association fields (`ENTRIES`, `FROM_ACCOUNT`, `TO_ACCOUNT`, `TRANSACTION_TAGS`) not `readonly`.

Plan:

1. Add `readonly` to `from` and `to` in `DateRangeInterface`.
2. Add `readonly` to all four association fields in `TransactionWithRelationsEntityInterface`.
3. Run `yarn ts` — both changes are additive and will surface any write sites that were relying on mutability.

## P2: Drizzle Generated-Column Override and Zod Import Style (Rule SOTA)

Two unrelated hygiene items around Drizzle 0.45+ and Zod import consistency.

Evidence:

- `packages/contracts/src/transaction/schema/transaction-create-entity.schema.ts:7–8` — explicit `.omit({ operatedWeekday: true, operatedMinuteOfDay: true })` to exclude virtual generated columns that Drizzle 0.45+ `createInsertSchema` omits automatically. The manual override is dead weight.
- Zod import style is split across the package: `import { z } from 'zod'` (used in `transaction-entity.interface.ts`, `transaction-create-entity.interface.ts`, and ~8 other entity files) vs destructured named imports (`import { enum as zodEnum, literal, number, ... } from 'zod'`) in schema files. The `enum as zodEnum` alias is awkward because `enum` is a reserved word; the alias hides intent.

Plan:

1. Verify the installed Drizzle version supports automatic generated-column omission, then remove the `.omit({ operatedWeekday: true, operatedMinuteOfDay: true })` call from `TransactionCreateEntitySchema`.
2. Standardize on `import { z } from 'zod'` throughout `packages/contracts/src/`; replace all `enum as zodEnum` usages with `z.enum`, `literal` with `z.literal`, etc. Apply in one sweep so the diff is reviewable and `yarn ts` confirms no breakage.

## First Slice

Start with a single raw SQL output family:

1. Pick `TransferPairRepository.findCandidates`.
2. Add a row builder or schema.
3. Run TypeScript, integration scenarios, and query plan checks.
4. Repeat for manual review and ATM candidate outputs only after the first slice proves the pattern.
