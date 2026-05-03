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
- **MCC-only fuzzy matching** — title is the primary identity signal; MCC is used only as a strengthening filter in the manual-review bucket.
- **Late-arriving refund extension** — a refund synced *after* its expense is already consolidated stays as standalone income. No "absorb into existing canonical" pass.
- **Schema migration** — all data rides on existing columns (`consolidation_parent_transaction_id`, `consolidation_type`).

## Why this fits the existing engine

`packages/app/src/sync/service/transfer-consolidation.service.ts` already runs a `runConsolidation()` loop that:

1. Calls `findConsolidationCandidateGroups()` to fetch candidate rows from `transferPairRepository` (auto bucket + manual review bucket per type).
2. Sequentially runs three processors — `processPairCandidates`, `processIbanBridgeTransferCandidates`, `processAtmCashWithdrawalCandidates` — each of which opens a `transactionAsync` per candidate, re-checks eligibility, creates a synthetic canonical via `createCanonicalTransfer`, copies tags, and reparents source rows via `moveSourcesToCanonical`.
3. Records the result on the canonical via `consolidationType` (one of the values in `TransactionConsolidationTypeEnum`).
4. Surfaces low-confidence candidates in `consolidation-source.tsx` for user approval.

A **refund** is structurally a same-account expense + later income pair where the counterparty is **not** another user-owned account (otherwise it would already be a transfer pair). The detection step is a sibling SQL CTE; the apply step is a sibling canonical creator (single CREDIT entry instead of two-entry transfer); everything else (eligibility, tags, reparenting, manual review) is reused unchanged.

### What Monobank's API tells us (deterministic detection is impossible)

The Monobank Personal API (`/personal/statement/{account}/{from}/{to}`) does **not** expose any explicit refund / reversal / chargeback signal. The full `StatementItem` schema is `id, time, description, mcc, originalMcc, hold, amount, operationAmount, currencyCode, commissionRate, cashbackAmount, balance, comment, receiptId, invoiceId, counterEdrpou, counterIban, counterName` — every field already captured in `BaseTransactionFieldsInterface`. There is no `type` / `operationType` / `refundOf` / `originalTransactionId` / `linkedTransactionId` field. A refund appears as a positive-`amount` statement entry with no documented linkage to the original purchase. Heuristic detection on title + amount + time window + same-account + same-MCC is the only available approach. This is also true (by inspection) for the other providers we currently sync (Erste, Privatbank).

## Decisions

| | |
|---|---|
| Trigger | Auto-only. New 4th processor in `runConsolidation`. No manual-action surface. |
| Canonical model | Synthetic `EXPENSE` transaction, `consolidationType = REFUND`, single CREDIT entry on the source account. Sources reparented + hidden via `consolidationParentTransactionId`. Identical mechanism to existing consolidations. |
| Cardinality | 1:N — one expense + many refund incomes per consolidation. The candidate row aggregates refund IDs via `group_concat`. |
| Net amount | `expense.amount - SUM(refund.amount)`. Partial refund → residual stays visible. Full refund → canonical with `0` net amount; the 0-row stays hidden by spending-stat filters (verified: `use-get-statistics-transactions.query.ts` already filters on positive amounts). |
| Match strictness — **auto** | `UPPER(TRIM(title))` exact equality, same-currency, same-account, refund-after-expense, ≤ 30 days, refund counterparty not another user account, sum-of-refunds ≤ expense. |
| Match strictness — **manual review** | Title containment after stripping refund prefixes (`REFUND`, `RETURN`, `REVERSAL`, `CHARGEBACK`, `CR `), **and** matching MCC, ≤ 90 days, otherwise same constraints. Auto-bucket rows excluded from this query. |
| Race + idempotence | Existing `areCandidatesStillEligible` + `isRunning` flag cover concurrent passes and stale candidates. |
| Schema | No migrations. New `TransactionConsolidationTypeEnum.REFUND = 'REFUND'` value. |
| Telemetry | `@Log` lifecycle on every new method, `expenseTransactionId` + `refundIncomeTransactionIds.join(',')` + `netAmount` on every line. |

## Architecture

```
runConsolidation()
  ├─ findConsolidationCandidateGroups()           ← extended to include refund auto + review groups
  ├─ processPairCandidates(...)                   ← existing
  ├─ processIbanBridgeTransferCandidates(...)     ← existing
  ├─ processAtmCashWithdrawalCandidates(...)      ← existing
  └─ processRefundCandidates(...)                 ← new
       ├─ for each candidate (sequential, like existing processors):
       │     transactionAsync(db, tx => consolidateRefundInner(candidate, tx))
       └─ consolidateRefundInner:
            1. areCandidatesStillEligible([expenseTxId, ...refundIncomeTxIds], tx)   ← existing
            2. createCanonicalRefund(canonicalInput, tx)                              ← new (sibling to createCanonicalTransfer)
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
    readonly expenseTransactionComment: string | null;
    readonly expenseEntryId: number;
    readonly expenseEntryAmount: number;
    readonly expenseOperatedAt: number;
    readonly refundIncomeTransactionIds: number[];
    readonly refundIncomeEntryIds: number[];
    readonly refundIncomeAmounts: number[];
    readonly netAmount: number;
    readonly maxTimeDiffSeconds: number;
}

// refund-review-candidate.interface.ts
export interface RefundReviewCandidateInterface {
    readonly confidenceBucket: 'review-prefix-strip' | 'review-extended-window';
    readonly accountId: number;
    readonly accountTitle: string;
    readonly currencyCode: string;
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
    readonly comment: string;
    readonly operatedAt: number;
    readonly accountId: number;
    readonly netAmount: number;
    readonly entryExchangeRate: number;
}
```

`sync/interface/consolidation-candidate-groups.interface.ts` extends with `refundCandidates: RefundCandidateInterface[]` and `refundReviewCandidates: RefundReviewCandidateInterface[]`.

## SQL — auto-bucket CTE (illustrative)

Lives in a **new** repository file `packages/contracts/src/transaction/repository/transaction-refund.repository.ts` (not in `transfer-pair.repository.ts`, which is already 608 lines and would push past the maintenance threshold; co-locating refund detection in its own repository keeps the file focused and tracks the existing pattern for `transaction-pattern.repository.ts`).

```sql
WITH expense_entries AS (
    SELECT
        t.id              AS tx_id,
        t.title           AS tx_title,
        t.comment         AS tx_comment,
        t.operated_at     AS operated_at,
        e.id              AS entry_id,
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
        t.title           AS tx_title,
        t.operated_at     AS operated_at,
        e.id              AS entry_id,
        e.account_id      AS account_id,
        e.amount          AS amount,
        e.mcc_category_id AS mcc_category_id,
        UPPER(TRIM(t.title)) AS norm_title
    FROM transactions t
    JOIN transaction_entries e ON e.transaction_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.consolidation_parent_transaction_id IS NULL
      AND t.type = 'INCOME'
      AND e.type = 'DEBIT'
      AND e.amount > 0
      AND NOT EXISTS (
          SELECT 1
          FROM transaction_entries other
          JOIN accounts acc ON acc.id = other.account_id
          WHERE other.transaction_id = t.id
            AND other.account_id != e.account_id
            AND acc.deleted_at IS NULL
      )                                              -- exclude transfer-pair-shaped incomes
),
candidate_pairs AS (
    SELECT
        exp.tx_id     AS expense_tx_id,
        exp.tx_title  AS expense_title,
        exp.tx_comment AS expense_comment,
        exp.entry_id  AS expense_entry_id,
        exp.account_id,
        exp.amount    AS expense_amount,
        exp.operated_at AS expense_operated_at,
        inc.tx_id     AS refund_tx_id,
        inc.entry_id  AS refund_entry_id,
        inc.amount    AS refund_amount,
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
    expense_comment,
    expense_entry_id,
    expense_amount,
    expense_operated_at,
    account_id,
    SUM(refund_amount)                          AS sum_refunds,
    expense_amount - SUM(refund_amount)         AS net_amount,
    GROUP_CONCAT(refund_tx_id)                  AS refund_tx_ids,
    GROUP_CONCAT(refund_entry_id)               AS refund_entry_ids,
    GROUP_CONCAT(refund_amount)                 AS refund_amounts,
    MAX(time_diff)                              AS max_time_diff_seconds
FROM candidate_pairs
GROUP BY expense_tx_id
HAVING SUM(refund_amount) <= expense_amount;
```

The repository method parses the comma-joined IDs/amounts back into `number[]` (mirroring the same convention used in `transaction-pattern.repository.ts`).

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
            comment: candidate.expenseTransactionComment ?? '',
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
            comment: input.comment,
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

## UX — manual review surface

The existing `consolidation-source.tsx` modal already lists transfer-pair manual-review candidates. We extend its query and renderer to include refund-review rows:

- **Source row component** picks an icon and label per candidate type. New label: `<Trans>Possible refund</Trans>`. Icon: `RotateCcw` (already in `UserIconNameEnum`).
- **Approve action** calls a new path `transferConsolidationService.consolidateRefundFromReview(candidateId)` that re-fetches the candidate, re-runs `areCandidatesStillEligible`, and applies `consolidateRefundInner`.
- **Dismiss action** marks the pair as user-rejected (existing dismissal mechanism — reuses the `consolidation_dismissals` table).
- No new screen, no new route, no new bottom sheet.

i18n strings added to all five locales (`en`, `de`, `es`, `fr`, `uk`); compiled via `yarn i18n:sync`.

## File-by-file changes

**`packages/contracts/`** — additions only:

- `src/transaction/enum/transaction-consolidation-type.enum.ts` — append `REFUND`.
- `src/transaction/interface/refund-candidate.interface.ts` (new).
- `src/transaction/interface/refund-review-candidate.interface.ts` (new).
- `src/transaction/constant/refund-time-window.constant.ts` (new).
- `src/transaction/constant/refund-manual-review-time-window.constant.ts` (new).
- `src/transaction/constant/refund-title-prefixes.constant.ts` (new).
- `src/transaction/repository/transaction-refund.repository.ts` (new) — `findCandidates()`, `findReviewCandidates()`, `dismissReviewCandidate()`.
- `src/index.ts` — re-export the new interfaces, constants, and repository singleton.

**`packages/app/`**:

- `src/sync/service/transfer-consolidation.service.ts` — add `processRefundCandidates`, `consolidateRefund`, `consolidateRefundInner`, `createCanonicalRefund`, `findRefundCandidates`, `findRefundReviewCandidates`, `consolidateRefundFromReview`. Wire into `runConsolidation()`, `findConsolidationCandidateGroups()`, `preview()`. Keep `@Log` discipline on every new method.
- `src/sync/interface/consolidation-candidate-groups.interface.ts` — add `refundCandidates`, `refundReviewCandidates`.
- `src/sync/interface/canonical-refund-input.interface.ts` (new).
- `src/transaction/components/consolidation-source-row/consolidation-source-row.tsx` — extend the row renderer with the refund branch.
- `src/transaction/components/consolidation-source-modal-content/consolidation-source-modal-content.tsx` — include refund-review rows in the modal list.
- `src/transaction/utils/unconsolidate-by-id-in-transaction.util.ts` — verify it works for refund canonicals (it should — it operates generically on `consolidationParentTransactionId` and entry reparenting).
- `src/i18n/locales/{en,de,es,fr,uk}/messages.{po,ts}` — new strings for "Possible refund", "Refund detected", review surface copy.

**`tests/bank-sync-tests/`**:

- `src/harness/seed/seed-refund-fixture.ts` (new) — helper to seed an expense + N refund incomes on the same account with controllable title / amount / time offset / MCC.
- `src/scenarios/consolidation/refund-pair-by-title.test.ts` — strict title match auto-consolidates into a single net-expense canonical.
- `src/scenarios/consolidation/refund-pair-partial.test.ts` — €120 expense + €40 refund → canonical = €80; both sources reparented.
- `src/scenarios/consolidation/refund-pair-multiple-refunds.test.ts` — 1:N (€120 + €40 + €30 → canonical = €50; all three sources reparented).
- `src/scenarios/consolidation/refund-pair-full-refund.test.ts` — €120 + €120 → canonical = €0 net amount; both sources hidden.
- `src/scenarios/consolidation/refund-pair-time-window-boundary.test.ts` — at 30d, at 30d + 1s, at 90d.
- `src/scenarios/consolidation/refund-pair-manual-review.test.ts` — `REFUND - STARBUCKS` vs `STARBUCKS` lands in review bucket (containment + same MCC), not auto.
- `src/scenarios/consolidation/refund-pair-not-transfer.test.ts` — refund-shaped pair where the income's counterparty is another user account stays as a transfer pair, not a refund.
- `src/scenarios/consolidation/refund-pair-cross-currency-skipped.test.ts` — different currencies do not match (locks deferred behavior).
- `src/scenarios/consolidation/unconsolidate-refund-restores-sources.test.ts` — unconsolidate symmetry.

All tests run under the existing Vitest + MSW + Drizzle harness. No app-level tests (per root rule 27).

## Error handling

- **Eligibility race** — `areCandidatesStillEligible` checks every source ID before the canonical is created; mismatch → no-op.
- **Concurrent passes** — `transferConsolidationService.isRunning` guard already exists.
- **Per-candidate failure** — `.then(() => true, () => false)` in `processRefundCandidates` matches existing processors. Failure of one candidate does not abort the batch.
- **Logging** — `@Log` lifecycle on every new method; `getErrorMessage(e)` for throw lines.
- **Idempotence** — re-running `consolidate()` is a no-op once sources are reparented (auto query filters `consolidation_parent_transaction_id IS NULL`).

## Validation

`yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd` passes. Tests via `yarn workspace @budgie/bank-sync-tests test`. No new ESLint disables expected; if the SQL CTE pushes the new repository file over `max-lines`, an approved disable per root rule 4 is acceptable with rationale (`File owns a single multi-stage SQL/CTE pipeline that must stay together`).

## Known limitations (locked-in deferrals)

1. **Late-arriving refunds.** Refund synced after its expense is already consolidated (into a refund canonical or any other type) stays as standalone income. No "extend canonical" pass.
2. **Cross-currency refunds.** Different-currency refund of a foreign-card purchase is not matched.
3. **Cross-account refunds.** Refund landing on a different / replacement account is not matched.
4. **MCC-only matching.** Title is the primary signal; MCC participates only as a strengthening filter in the manual-review bucket.
5. **Manual UX flows from issue #243** (Mark as refund / Create refund / Unlink) — deferred. The data model used here (`consolidationType = REFUND` + reparenting) does not block their later addition.
