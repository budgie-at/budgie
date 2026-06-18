# Debt Account Ledger Design

## Purpose

Debt accounts need one reliable model for lending, borrowing, repayments, progress, and completed state. The current implementation has the right building blocks, including `transaction_entries.kind = DEBT_SETTLEMENT`, but the UI derives totals from a mix of balance snapshots, raw debit and credit sums, and `targetBalance`. That makes lent debt especially fragile when legacy data or edited starting values are involved.

This design makes debt progress a canonical ledger projection. Home tiles, account details, section totals, and E2E assertions should all consume the same semantics.

## Canonical Semantics

`targetBalance` is the expected original principal or endgame amount for the debt account.

For `LENT` debt:

- `targetBalance` is the amount the user lent.
- The create/edit `currentBalance` field means the amount already returned.
- Income attached to the debt is a payback and reduces outstanding debt.
- Expense attached to the debt is additional lending and increases outstanding debt.
- The UI shows left to receive, return progress, returned, and lent.

For `BORROW` debt:

- `targetBalance` is the amount the user borrowed or expects to repay.
- The create/edit `currentBalance` field means the amount still owed.
- Expense attached to the debt is a repayment and reduces outstanding debt.
- Income attached to the debt is additional borrowed money and increases outstanding debt.
- The UI shows left to repay, repayment progress, repaid, and borrowed.

The signed account balance remains a ledger invariant:

- `LENT` outstanding debt is positive balance.
- `BORROW` outstanding debt is negative balance, displayed as its absolute value.

## Ledger Projection

Add a single debt summary projection that returns:

- `outstandingAmount`
- `paidAmount`
- `totalAmount`
- `percentage`
- source ledger totals needed for diagnostics or UI reuse

The projection interprets transaction entries by debt type:

| Debt type | Increase/open debt | Settlement/close debt |
| --- | --- | --- |
| `LENT` | debt account `DEBIT` | debt account `CREDIT` |
| `BORROW` | debt account `CREDIT` | debt account `DEBIT` |

The query should include only live ledger entries:

- `transaction_entries.deleted_at IS NULL`
- parent transaction is not deleted
- transaction is not a consolidation parent
- source entries that moved into a non-refund consolidation are excluded
- refund consolidations keep their source ledger behavior, matching the existing account-balance rules

The total amount is:

```text
max(targetBalance, openedLedgerAmount, closedLedgerAmount + outstandingAmount)
```

The paid amount is:

```text
clamp(totalAmount - outstandingAmount, 0, totalAmount)
```

This preserves legacy accounts where principal exists only as `targetBalance`, while still supporting explicit debt transactions and later attached income or expense entries.

## Data Flow

The debt summary projection becomes the source of truth for:

- `DebtAccountBalance` on the account details page
- `DebtAccountCard` on the home page
- debt section totals on the home page
- exact E2E assertions for debt status

The old pattern of independently fetching `balance`, `debitAmount`, and `creditAmount`, then recomputing progress in several callers, should be replaced or wrapped by the new projection so all surfaces agree.

Transaction creation and update keep the existing entry model:

- regular income and expense entries remain `PRIMARY`
- attached debt entries are `DEBT_SETTLEMENT`
- the attached entry account is the debt account
- income creates a debt `CREDIT`
- expense creates a debt `DEBIT`

This means the existing “attach income to lent debt” path remains a real transaction on the receiving account and a debt settlement entry on the debt account. It should show in both account transaction lists without double-counting income or expense analytics.

## Migration And Legacy Data

The existing `0033_add_transaction_entry_kind.sql` migration backfills old two-entry `DEBT` transactions into income or expense transactions with a `DEBT_SETTLEMENT` debt entry. That migration is useful but narrow.

The new summary projection should not require a destructive legacy repair to be correct. It must handle accounts where:

- the original principal exists only in `targetBalance`
- opening or adjustment entries exist on the debt account
- repayment entries are already marked `DEBT_SETTLEMENT`
- old explicit debt transfer entries remain as primary ledger entries

A follow-up migration is only needed if inspection proves there are old income or expense debt entries that should have `DEBT_SETTLEMENT` kind but still have `PRIMARY`. If added, it should be targeted and idempotent.

## Query Performance

The summary query should aggregate debt entries once per account instead of running independent per-card debit and credit queries. For home data, prefer a grouped projection over all debt accounts so the home screen avoids N+1 debt summary reads.

Index coverage should support:

- filtering entries by `account_id`
- live ledger entry checks
- grouping by `account_id`, `type`, and `kind`
- joining to live transactions

The existing `transaction_entries_ledger_account_idx` helps with live account lookup. If the grouped summary plan shows scans on realistic data, add a partial index for live debt ledger aggregation, for example on `account_id`, `type`, and `kind` with the live-entry predicate.

## E2E Coverage

Add or replace Maestro debt flows so they assert exact values, not just pill visibility or approximate progress.

Required lent flow:

- create a lent debt with target `15000`
- set already returned/current input to `2000`
- attach an income of `109` to that debt
- verify the debt transaction list shows the attached income
- verify detail header shows left to receive `12891`, returned `2109`, lent `15000`, and `14.06%`
- verify the home tile shows the same outstanding and target relationship

Required borrowed flow:

- create a borrowed debt
- attach an expense repayment
- verify left to repay decreases, repaid increases, and progress increases
- attach income as additional borrowed money
- verify outstanding increases and the transaction list still shows both attached entries

Required completion flow:

- create a debt
- attach settlement entries that fully close it
- verify outstanding is `0`
- verify progress is `100%`
- verify the completed account is still visible and stable on home and details

## Acceptance Criteria

- Lent and borrowed debts use mirror-image ledger semantics based on `debtType`.
- Attached income to a lent debt is counted as returned money.
- Attached expense to a lent debt is counted as additional lent money.
- Attached expense to a borrowed debt is counted as repaid money.
- Attached income to a borrowed debt is counted as additional borrowed money.
- Initial principal remains visible through `targetBalance` even when legacy transaction history is incomplete.
- Home cards, details headers, and debt section totals agree.
- E2E coverage asserts exact debt amounts and progress for lent, borrowed, and completed debts.
- Query shape is grouped and index-friendly for home and details views.
