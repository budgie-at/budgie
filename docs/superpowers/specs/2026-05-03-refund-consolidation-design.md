# Refund-pair consolidation — design

**Branch:** `feat/refund-consolidation`
**Issue:** [#243 — Refund transactions](https://github.com/budgie-at/budgie/issues/243)
**Scope:** Auto-detect bank-synced refund pairs (one prior expense + one or more later refund incomes on the same account) during the existing consolidation pass, and merge them into a synthetic net-expense canonical that hides the source rows. Manual UX flows from the issue (Mark as refund / Create refund / Unlink) are deferred.

## Goal

Refunds today inflate income, leave the original expense at full magnitude, and confuse spending insights even though card balances are mathematically correct. The user-visible problem: spending charts show the full €120 purchase plus €120 income, instead of showing the €0 effective spend. The issue lists three manual flows; we are intentionally **not** building them in v1. Instead we extend the existing consolidation engine to recognise refund pairs the same way it already recognises transfer pairs, IBAN-bridge transfers, and ATM withdrawals, and produce a single net-expense canonical that the rest of the app already treats as the source of truth (sources reparented, hidden by filtered indexes, balances correct).

## Non-goals

- **Manual UX flows** (`Mark as refund`, `Create refund from expense`, `Unlink`) — deferred. The data model we land here does not block them.
- **Visible "linked" refund pair** — the issue's "Group refunds with original transaction" / "Visually distinguish refund transactions" copy applies to a model that keeps both rows visible. We chose the canonical-hidden-source model instead, matching every other consolidation type today. Both rows are reparented; only the canonical is visible.
- **Cross-currency refunds** — same-currency only in v1. A foreign-card purchase refunded in a different currency does not match.
- **Cross-account refunds** — refund landing on a replacement card or a different account does not match.
- **MCC-only fuzzy matching** — MCC alone never matches a refund pair. The auto bucket ignores MCC entirely. The manual-review bucket treats MCC as an *additional* required filter (`exp.mcc = inc.mcc`) on top of title containment, raising precision rather than recall.
- **Late-arriving refund extension** — a refund synced *after* its expense is already consolidated stays as standalone income. No "absorb into existing canonical" pass.
- **Schema migration** — all data rides on existing columns (`consolidation_parent_transaction_id`, `consolidation_type`).

## Why this fits the existing engine

`packages/app/src/sync/service/transfer-consolidation.service.ts` already runs a `runConsolidation()` loop that:

1. Calls `findConsolidationCandidateGroups()` to fetch candidate rows from `transferPairRepository` (auto bucket + manual-review bucket per type).
2. Sequentially runs three processors — `processPairCandidates`, `processIbanBridgeTransferCandidates`, `processAtmCashWithdrawalCandidates` — each of which opens a `transactionAsync` per candidate, re-checks eligibility, creates a synthetic canonical via `createCanonicalTransfer`, copies tags, and reparents source rows via `moveSourcesToCanonical`.
3. Records the result on the canonical via `consolidationType` (one of the values in `TransactionConsolidationTypeEnum`).
4. Counts manual-review candidates and surfaces the count via the settings toast (`packages/app/src/settings/components/consolidate-transfers/consolidate-transfers.tsx`). **There is no per-candidate approval UI** — review-bucket entries are log-only today.

A **refund** is structurally a same-account expense + later income pair where the counterparty is **not** another user-owned account (otherwise it would already be a transfer pair). The detection step is a sibling SQL CTE; the apply step is a sibling canonical creator (single CREDIT entry instead of two-entry transfer); the eligibility / tag-copy / reparenting helpers are reused unchanged. The manual-review bucket reuses the *count-and-log* pattern, not any approval machinery (none exists).

### What Monobank's API tells us (deterministic detection is impossible)

The Monobank Personal API (`/personal/statement/{account}/{from}/{to}`) does **not** expose any explicit refund / reversal / chargeback signal. The full `StatementItem` schema is `id, time, description, mcc, originalMcc, hold, amount, operationAmount, currencyCode, commissionRate, cashbackAmount, balance, comment, receiptId, invoiceId, counterEdrpou, counterIban, counterName` — every field already captured in `BaseTransactionFieldsInterface`. There is no `type` / `operationType` / `refundOf` / `originalTransactionId` / `linkedTransactionId` field. A refund appears as a positive-`amount` statement entry with no documented linkage to the original purchase. Heuristic detection on title + amount + time window + same-account + same-MCC is the only available approach. This is also true (by inspection) for the other providers we currently sync (Erste, Privatbank).

## Decisions

| | |
|---|---|
| Trigger | Auto-only. New 4th processor in `runConsolidation`. No manual-action surface, no review-approval UI. |
| Canonical model | Synthetic `EXPENSE` transaction, `consolidationType = REFUND`, single CREDIT entry on the source account. Sources reparented + hidden via `consolidationParentTransactionId`. Identical mechanism to existing consolidations. `comment` is set to `''` (matches existing `createCanonicalTransfer`). |
| Cardinality | 1:N — one expense + many refund incomes per consolidation. The candidate row aggregates refund IDs via `group_concat`. |
| Net amount | `expense.amount - SUM(refund.amount)`. Partial refund → residual stays visible. Full refund → canonical with `0` net amount. Trade-off documented in §"Full-refund (net=0) handling" below: 0-row is excluded from totals by `getTotalIncomeAndExpenseQuery`'s CASE aggregation, but does appear as a €0 EXPENSE row in list views. Accepted: an empty row at the original purchase date communicates *"this was fully refunded"* without needing a separate refund-link UI. |
| Match strictness — **auto** | `UPPER(TRIM(title))` exact equality, same-account (which implies same-currency since accounts hold one currency), refund-after-expense, ≤ 30 days, sum-of-refunds ≤ expense. Transfer-pair-shaped pairs excluded **by processor ordering**, not by SQL — see §"Processor ordering is load-bearing". |
| Match strictness — **manual-review (telemetry only, no UI)** | Title containment after stripping refund prefixes (`REFUND`, `RETURN`, `REVERSAL`, `CHARGEBACK`, `CR `), **and** matching MCC, ≤ 90 days, otherwise same constraints. Auto-bucket rows excluded from this query. Counts surface in `preview()`/`consolidate-transfers.tsx` toast — same pattern as today's transfer-pair manual-review counts. **No approval UI.** |
| Race + idempotence | Existing `areCandidatesStillEligible` + `isRunning` flag cover concurrent passes and stale candidates. |
| Schema | No migrations. New `TransactionConsolidationTypeEnum.REFUND = 'REFUND'` value. |
| Telemetry | `@Log` lifecycle on the **outer** wrappers `processRefundCandidates` and `consolidateRefund` only — matches existing `processPairCandidates` / `consolidatePair` / `consolidatePairInner` discipline (inner method has no `@Log`). |

## Architecture

```
runConsolidation()
  ├─ findConsolidationCandidateGroups()           ← extended with refund auto + review groups
  ├─ processPairCandidates(...)                   ← existing
  ├─ processIbanBridgeTransferCandidates(...)     ← existing
  ├─ processAtmCashWithdrawalCandidates(...)      ← existing
  └─ processRefundCandidates(...)                 ← new   [@Log] | runs LAST, load-bearing
       └─ for each candidate (sequential .reduce, swallows per-candidate errors):
            consolidateRefund(candidate)          ← new   [@Log]
              └─ transactionAsync(db, tx => consolidateRefundInner(candidate, tx))   ← new (no @Log)
                   1. areCandidatesStillEligible([expenseTxId, ...refundIncomeTxIds], tx)   ← existing
                   2. createCanonicalRefund(canonicalInput, tx)                              ← new (no @Log; sibling to createCanonicalTransfer)
                   3. copySourceTags(sourceTransactionIds, canonical.id, tx)                 ← existing
                   4. moveSourcesToCanonical(sourceTransactionIds, canonical.id, tx)         ← existing
```

`preview()` and `findConsolidationCandidateGroups()` get the two new `findRefundCandidates()` / `findRefundReviewCandidates()` calls.

## Data shapes

### Contracts package

**Enum** — `packages/contracts/src/transaction/enum/transaction-consolidation-type.enum.ts`:

```ts
export enum TransactionConsolidationTypeEnum {
    TRANSFER_PAIR = 'TRANSFER_PAIR',
    IBAN_BRIDGE_TRANSFER = 'IBAN_BRIDGE_TRANSFER',
    ATM_CASH_WITHDRAWAL = 'ATM_CASH_WITHDRAWAL',
    CROSS_CURRENCY_EXCHANGE = 'CROSS_CURRENCY_EXCHANGE',
    REFUND = 'REFUND'                                    // new
}
```

**Interfaces** — `packages/contracts/src/transaction/interface/`:

```ts
// refund-candidate.interface.ts
export interface RefundCandidateInterface {
    readonly confidenceBucket: 'auto-strict-title';
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly expenseOperatedAt: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundIncomeAmounts: number[];
    readonly netAmount: number;
    readonly maxTimeDiffSeconds: number;
}

// refund-review-candidate.interface.ts
export interface RefundReviewCandidateInterface {
    readonly confidenceBucket: 'review-prefix-strip' | 'review-extended-window';
    readonly accountId: number;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseEntryAmount: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundIncomeAmounts: number[];
    readonly netAmount: number;
    readonly maxTimeDiffSeconds: number;
}
```

**Constants** — `packages/contracts/src/transaction/constant/`:

```ts
// refund-time-window.constant.ts
export const REFUND_TIME_WINDOW_SECONDS = 2_592_000;              // 30 days

// refund-manual-review-time-window.constant.ts
export const REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS = 7_776_000; // 90 days

// refund-title-prefixes.constant.ts
export const REFUND_TITLE_PREFIXES = ['REFUND', 'RETURN', 'REVERSAL', 'CHARGEBACK', 'CR '] as const;
```

### App package

```ts
// sync/interface/canonical-refund-input.interface.ts
export interface CanonicalRefundInputInterface {
    readonly title: string;
    readonly operatedAt: number;
    readonly accountId: number;
    readonly netAmount: number;
    readonly entryExchangeRate: number;
}
```

The canonical's `comment` field is hard-coded to `''` in the create call (matches existing `createCanonicalTransfer`) — no `comment` is propagated from sources, so the input shape doesn't carry one.

`sync/interface/consolidation-candidate-groups.interface.ts` extends with `refundCandidates: RefundCandidateInterface[]` and `refundReviewCandidates: RefundReviewCandidateInterface[]`.

## Processor ordering is load-bearing

The four processors run in this fixed order inside `runConsolidation`:

1. `processPairCandidates`
2. `processIbanBridgeTransferCandidates`
3. `processAtmCashWithdrawalCandidates`
4. `processRefundCandidates` ← **must be last**

The refund auto query cannot reliably exclude transfer-pair-shaped pairs at SQL time. Bank-synced transactions are single-entry (one entry on the user's account, external counterparty); transfer pairs are detected by matching **two separate single-entry transactions across different user accounts** via the dedicated transfer-pair / IBAN-bridge / ATM CTEs in `transferPairRepository`. There is no per-transaction signal that says *"this single-entry income is half of a transfer pair."*

The exclusion is therefore **temporal**: by the time `processRefundCandidates` runs, any income that the prior three processors recognised as a transfer-pair / bridge / ATM partner has already been reparented under its canonical and now has `consolidationParentTransactionId IS NOT NULL`. The refund CTE filters on that. Same-pass races are caught by `areCandidatesStillEligible(...)` per candidate.

Candidates **are** queried up-front via `findConsolidationCandidateGroups()` (matches existing behaviour). A refund query taken at the start of the pass may therefore include incomes that *will be* consolidated by an earlier processor in the same pass — those candidates are dropped by the eligibility check at apply time. This is wasted query work but not a correctness problem and stays consistent with how the existing three processors interact.

## SQL — auto-bucket CTE (illustrative)

Lives in a **new** repository file `packages/contracts/src/transaction/repository/transaction-refund.repository.ts`. Two reasons for the new file:

- `transferPairRepository` is already 608 lines and owns three distinct CTE pipelines (transfer-pair, IBAN-bridge, ATM). Adding refund there pushes past the maintenance threshold and would require a `max-lines` ESLint disable.
- A separate file establishes a precedent the spec author should propose follow-up work for: in a later PR, split ATM-cash-withdrawal and IBAN-bridge into siblings (`transaction-atm.repository.ts`, `transaction-iban-bridge.repository.ts`) so each consolidation type owns one repository file. **Out of scope for this PR.**

Sibling `createCanonicalRefund` is kept (rather than refactoring `createCanonicalTransfer` to take canonical type + entries as parameters) because the entry shape diverges meaningfully — refund has one CREDIT entry on the source account with `toAccountId: null`; transfer has two entries (CREDIT + DEBIT) across two accounts with both `fromAccountId` and `toAccountId` set. A unified factory would carry more conditional branching than the duplication it removes.

```sql
WITH expense_entries AS (
    SELECT
        t.id              AS tx_id,
        t.title           AS tx_title,
        t.operated_at     AS operated_at,
        e.account_id      AS account_id,
        e.amount          AS amount,
        e.mcc_category_id AS mcc_category_id,
        UPPER(TRIM(t.title)) AS norm_title
    FROM transactions t
    JOIN transaction_entries e ON e.transaction_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.consolidation_parent_transaction_id IS NULL
      AND t.type = 'EXPENSE'
      AND e.type = 'CREDIT'
      AND e.amount > 0
),
income_entries AS (
    SELECT
        t.id              AS tx_id,
        t.operated_at     AS operated_at,
        e.account_id      AS account_id,
        e.amount          AS amount,
        e.mcc_category_id AS mcc_category_id,
        UPPER(TRIM(t.title)) AS norm_title
    FROM transactions t
    JOIN transaction_entries e ON e.transaction_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.consolidation_parent_transaction_id IS NULL    -- transfer-pair-shaped pairs already
                                                           -- reparented by earlier processors
                                                           -- (see "Processor ordering is load-bearing")
      AND t.type = 'INCOME'
      AND e.type = 'DEBIT'
      AND e.amount > 0
),
candidate_pairs AS (
    SELECT
        exp.tx_id       AS expense_tx_id,
        exp.tx_title    AS expense_title,
        exp.account_id,
        exp.amount      AS expense_amount,
        exp.operated_at AS expense_operated_at,
        inc.tx_id       AS refund_tx_id,
        inc.amount      AS refund_amount,
        (inc.operated_at - exp.operated_at) AS time_diff
    FROM expense_entries exp
    JOIN income_entries inc
      ON inc.account_id = exp.account_id
     AND inc.norm_title = exp.norm_title
     AND inc.operated_at > exp.operated_at
     AND inc.operated_at - exp.operated_at <= :REFUND_TIME_WINDOW
)
SELECT
    expense_tx_id,
    expense_title,
    expense_amount,
    expense_operated_at,
    account_id,
    SUM(refund_amount)                          AS sum_refunds,
    expense_amount - SUM(refund_amount)         AS net_amount,
    GROUP_CONCAT(refund_tx_id)                  AS refund_tx_ids,
    GROUP_CONCAT(refund_amount)                 AS refund_amounts,
    MAX(time_diff)                              AS max_time_diff_seconds
FROM candidate_pairs
GROUP BY expense_tx_id
HAVING SUM(refund_amount) <= expense_amount;
```

The repository method parses each `GROUP_CONCAT` column back into `number[]` via `value.split(',').map(Number)` after a null-check (SQLite returns `NULL` for empty groups; `HAVING` already eliminates that case here, but the parser stays defensive). No precedent in the existing contracts repos uses `GROUP_CONCAT`; this PR establishes the pattern.

### Manual-review CTE — differences from auto

- Replace `inc.norm_title = exp.norm_title` with `(inc.norm_title LIKE '%' || stripped(exp.norm_title) || '%' OR exp.norm_title LIKE '%' || stripped(inc.norm_title) || '%')` where `stripped(...)` strips each prefix in `REFUND_TITLE_PREFIXES` from the leading edge — implemented as a chained `REPLACE(REPLACE(..., 'REFUND', ''), 'RETURN', '')` etc., wrapped in `UPPER(TRIM(...))`.
- `(inc.operated_at - exp.operated_at) <= :REFUND_MANUAL_REVIEW_WINDOW`.
- `inc.mcc_category_id = exp.mcc_category_id` — MCC must match (precision boost).
- A `LEFT JOIN` against the auto-bucket query excludes rows already auto-eligible, so a candidate never appears in both buckets.

## Canonical creation

```ts
// transferConsolidationService method (new)
private async consolidateRefundInner(candidate: RefundCandidateInterface, tx: DB): Promise<void> {
    const sourceTransactionIds = [candidate.expenseTransactionId, ...candidate.refundIncomeTransactionIds];

    if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
        return;
    }

    const canonical = await this.createCanonicalRefund(
        {
            title: candidate.expenseTransactionTitle ?? '',
            operatedAt: candidate.expenseOperatedAt,
            accountId: candidate.accountId,
            netAmount: candidate.netAmount,
            entryExchangeRate: 1
        },
        tx
    );

    await this.copySourceTags(sourceTransactionIds, canonical.id, tx);
    await this.moveSourcesToCanonical(sourceTransactionIds, canonical.id, tx);
}

private async createCanonicalRefund(input: CanonicalRefundInputInterface, tx: DB): Promise<TransactionEntityInterface> {
    const canonical = await transactionRepository.create(
        {
            type: TransactionTypeEnum.EXPENSE,
            title: input.title,
            externalId: null,
            operatedAt: new Date(input.operatedAt * 1000),
            comment: '',
            toAccountId: null,
            fromAccountId: input.accountId,
            exchangeRate: 1,
            externalSource: null,
            needsEmbedding: false,
            consolidationType: TransactionConsolidationTypeEnum.REFUND,
            consolidationParentTransactionId: null
        },
        tx
    );

    await transactionEntryRepository.bulkCreate(
        [
            {
                transactionId: canonical.id,
                accountId: input.accountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: input.netAmount,
                externalId: null,
                exchangeRate: input.entryExchangeRate,
                toIban: null,
                originalTransactionId: null
            }
        ],
        tx
    );

    return canonical;
}
```

`processRefundCandidates` mirrors `processPairCandidates` 1:1 — sequential reduce, swallows per-candidate errors via `.then(() => true, () => false)`, returns the count.

## Full-refund (net=0) handling

When `SUM(refund.amount) === expense.amount`, the canonical is created with `netAmount = 0`. Verified behaviour against `statistics.repository.ts` and `base-transaction-filter.repository.ts`:

- `buildFilterWhere` (line 70) filters `isNull(consolidationParentTransactionId)`. Source children are hidden from every stats / list query that uses the base filter.
- `getTotalIncomeAndExpenseQuery` aggregates via a `CASE WHEN entry.type = CREDIT ... THEN amount * rate ELSE 0` sum. A 0-amount entry contributes 0 to the expense total.
- `getTransactions` (the visible list query) returns all parent transactions matching the filter — **including** the €0 EXPENSE canonical.

Net effect: balances are correct, totals are correct, the refund canonical appears as a single empty row in the expense list at the original purchase date. Accepted: this row communicates *"this purchase was fully refunded"* without needing a separate refund-link UI. **No additional `amount > 0` filter is added to stats queries**; that would suppress fully-refunded canonicals from list views and make refund consolidation invisible to the user.

If a follow-up PR introduces a refund-aware list renderer (e.g. a "fully refunded" badge on the row), this is the place to read the `consolidationType` and customise — out of scope here.

## Manual-review bucket — telemetry only, no UI

The existing pattern, locked in by `packages/app/src/settings/components/consolidate-transfers/consolidate-transfers.tsx:29`:

> *"This will consolidate ${autoCandidateCount} high-confidence transfer pairs. ${manualReviewCandidateCount} lower-confidence pairs will be **logged for review only**."*

Manual-review candidates today are counted in `preview()`, surfaced in the toast above, and logged via `@Log`. **There is no approval UI for any consolidation type.** The refund manual-review bucket follows the same pattern:

- `findRefundReviewCandidates()` runs alongside `findRefundCandidates()` in `findConsolidationCandidateGroups()`.
- Counts roll into `manualReviewCandidateCount` in `ConsolidationPreviewInterface` (alongside transfer-pair + ATM review counts).
- Counts and per-candidate detail are logged through the service's `@Log` pipeline.
- **No** new modal, route, sheet, icon, or `consolidateRefundFromReview` method.

A dedicated approval surface for the entire consolidation engine — refund-review **and** transfer-pair-review — is a deliberate future-PR scope. The data model used here doesn't block it.

## File-by-file changes

**`packages/contracts/`** — additions only:

- `src/transaction/enum/transaction-consolidation-type.enum.ts` — append `REFUND`.
- `src/transaction/interface/refund-candidate.interface.ts` (new).
- `src/transaction/interface/refund-review-candidate.interface.ts` (new).
- `src/transaction/constant/refund-time-window.constant.ts` (new).
- `src/transaction/constant/refund-manual-review-time-window.constant.ts` (new).
- `src/transaction/constant/refund-title-prefixes.constant.ts` (new).
- `src/transaction/repository/transaction-refund.repository.ts` (new) — `findCandidates()`, `findReviewCandidates()`. **No** dismissal method (no approval surface).
- `src/index.ts` — re-export the new interfaces, constants, and repository singleton.

**`packages/app/`**:

- `src/sync/service/transfer-consolidation.service.ts` — add `processRefundCandidates`, `consolidateRefund`, `consolidateRefundInner`, `createCanonicalRefund`, `findRefundCandidates`, `findRefundReviewCandidates`. Wire into `runConsolidation()` (as the **last** processor), `findConsolidationCandidateGroups()`, `preview()`. `@Log` only on the outer wrappers `processRefundCandidates` and `consolidateRefund`; inner methods (`consolidateRefundInner`, `createCanonicalRefund`, `findRefundCandidates`, `findRefundReviewCandidates`) carry no decorator — matches existing service discipline.
- `src/sync/interface/consolidation-candidate-groups.interface.ts` — add `refundCandidates`, `refundReviewCandidates`.
- `src/sync/interface/canonical-refund-input.interface.ts` (new).
- `src/transaction/utils/unconsolidate-by-id-in-transaction.util.ts` — verify it works for refund canonicals (it should — it operates generically on `consolidationParentTransactionId` and entry reparenting). Spec author confirms by reading the file before implementation; no behavioural change expected.

**No UI changes.** No edits to `consolidation-source-row.tsx` or `consolidation-source-modal-content.tsx` — those render the source-rows of an *already-consolidated* canonical when the user drills in, and that path works automatically once the refund canonical exists. No edits to the settings `consolidate-transfers.tsx` flow — its toast already shows aggregated `manualReviewCandidateCount` which now includes refund-review counts. **No new i18n strings** in this PR (the toast string is reused unchanged; user-facing UI for refund as a distinct concept is deferred to the future-PR approval surface).

**`tests/bank-sync-tests/`**:

- `src/harness/seed/seed-refund-fixture.ts` (new) — helper to seed an expense + N refund incomes on the same account with controllable title / amount / time offset / MCC.
- `src/scenarios/consolidation/refund-pair-by-title.test.ts` — strict title match auto-consolidates into a single net-expense canonical.
- `src/scenarios/consolidation/refund-pair-partial.test.ts` — €120 expense + €40 refund → canonical = €80; both sources reparented.
- `src/scenarios/consolidation/refund-pair-multiple-refunds.test.ts` — 1:N (€120 + €40 + €30 → canonical = €50; all three sources reparented).
- `src/scenarios/consolidation/refund-pair-full-refund.test.ts` — €120 + €120 → canonical = €0 net amount; both sources hidden; canonical present in expense list as a 0-amount row; expense total unaffected.
- `src/scenarios/consolidation/refund-pair-time-window-boundary.test.ts` — at 30d auto-matches, at 30d + 1s does not auto-match, at ≤ 90d (with prefix-stripped title + same MCC) lands in review bucket.
- `src/scenarios/consolidation/refund-pair-manual-review.test.ts` — `REFUND - STARBUCKS` vs `STARBUCKS` lands in review bucket (containment + same MCC), counted in `preview()`, **not auto-consolidated**.
- `src/scenarios/consolidation/refund-pair-processor-ordering.test.ts` — same-shape pair where the income is also a transfer-pair partner: the pair processor reparents first, the refund processor sees `consolidationParentTransactionId IS NOT NULL` and skips. Locks in the load-bearing ordering.
- `src/scenarios/consolidation/unconsolidate-refund-restores-sources.test.ts` — unconsolidate symmetry; verifies `unconsolidate-by-id-in-transaction.util.ts` works for refund canonicals without modification.

Eight scenarios. The `cross-currency-skipped` scenario from the prior draft was dropped: same-account constraint already implies same-currency (one currency per account in Budgie's model), so the scenario was tautological.

All tests run under the existing Vitest + MSW + Drizzle harness. No app-level tests (per root rule 27).

## Error handling

- **Eligibility race** — `areCandidatesStillEligible` checks every source ID before the canonical is created; mismatch → no-op.
- **Concurrent passes** — `transferConsolidationService.isRunning` guard already exists.
- **Per-candidate failure** — `.then(() => true, () => false)` in `processRefundCandidates` matches existing processors. Failure of one candidate does not abort the batch.
- **Logging** — `@Log` lifecycle on `processRefundCandidates` and `consolidateRefund` (outer wrappers) only; `getErrorMessage(e)` for throw-hook strings. Matches existing service discipline.
- **Idempotence** — re-running `consolidate()` is a no-op once sources are reparented (auto query filters `consolidation_parent_transaction_id IS NULL`).

## Validation

`yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd` passes. Tests via `yarn workspace @budgie/bank-sync-tests test`. No new ESLint disables expected; if the SQL CTE pushes the new repository file over `max-lines`, an approved disable per root rule 4 is acceptable with rationale (`File owns a single multi-stage SQL/CTE pipeline that must stay together`).

## Known limitations (locked-in deferrals)

1. **Late-arriving refunds.** Refund synced after its expense is already consolidated (into a refund canonical or any other type) stays as standalone income. No "extend canonical" pass.
2. **Cross-currency refunds.** Different-currency refund of a foreign-card purchase is not matched.
3. **Cross-account refunds.** Refund landing on a different / replacement account is not matched.
4. **MCC-only matching.** Title is the primary signal; MCC participates only as a strengthening filter in the manual-review bucket.
5. **Manual UX flows from issue #243** (Mark as refund / Create refund / Unlink) — deferred. The data model used here (`consolidationType = REFUND` + reparenting) does not block their later addition.
