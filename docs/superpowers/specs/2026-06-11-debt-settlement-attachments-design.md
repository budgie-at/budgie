# Debt Settlement Attachments Design

## Context

Budgie currently models debt account flows as transfers when one side of the transfer is a debt account. That works for the initial lending or borrowing event:

- Lending money: cash account is credited and the `LENT` debt account is debited.
- Borrowing money: `BORROW` debt account is credited and cash account is debited.

It does not work cleanly for debt returns and repayments. When a borrower returns money, the receiving cash account must increase and the `LENT` debt account must move toward settled. A pure transfer shape cannot represent both without making one account balance wrong. The same problem exists in reverse when the user repays a `BORROW` debt.

Issue #445 also identifies a related analytics problem: manual debt-account transfer conversion drops the original category, while the rule engine preserves it. Debt flows need category context in analytics and filters.

## Decisions

Debt return and repayment are not conversion-to-transfer flows. They are normal income or expense transactions with an attached debt settlement entry.

Categories remain user-controlled. A user can set any category on the income or expense, including a system debt category if one exists, but the debt attachment must not force the transaction into a transfer category.

Only one debt settlement can be attached to a transaction. The settlement amount is always the full primary transaction amount.

## Data Model

Add an explicit transaction-entry meaning field, separate from ledger direction.

```text
TransactionEntryKindEnum
- PRIMARY
- DEBT_SETTLEMENT
```

`TransactionEntryTypeEnum` continues to describe ledger direction: `DEBIT`, `CREDIT`, or `FEE`.

Existing entries default to `PRIMARY`.

### Lent Debt Return

When someone returns money owed to the user:

```text
transaction.type = INCOME

primary entry:
- account = receiving cash account
- type = DEBIT
- kind = PRIMARY
- category = user-selected category
- included in income analytics
- included in cash balance

debt settlement entry:
- account = LENT debt account
- type = CREDIT
- kind = DEBT_SETTLEMENT
- category = same category as the primary entry
- excluded from income analytics
- included in debt account balance
```

### Borrowed Debt Repayment

When the user repays money they borrowed:

```text
transaction.type = EXPENSE

primary entry:
- account = paying cash account
- type = CREDIT
- kind = PRIMARY
- category = user-selected category
- included in expense analytics
- included in cash balance

debt settlement entry:
- account = BORROW debt account
- type = DEBIT
- kind = DEBT_SETTLEMENT
- category = same category as the primary entry
- excluded from expense analytics
- included in debt account balance
```

This keeps the core balance invariant intact: account balances continue to come from transaction entries only. Analytics and category filters should count `PRIMARY` entries and ignore `DEBT_SETTLEMENT` entries.

## UX Flow

Debt settlement is a secondary relationship on an otherwise normal income or expense transaction. The user continues editing amount, account, category, tags, date, and notes as usual. Debt actions live in the transaction Actions menu; the edit form shows debt only after a settlement is attached.

Attached secondary state is displayed as a compact single-line metadata row, not as a large pill. Empty secondary state is not displayed in the form.

Income transactions get an `Attach debt return` action in Actions.

- Opens a bottom sheet similar to the refund source search flow.
- Lists and searches `LENT` debt accounts.
- User selects one debt account and confirms.
- Budgie adds the debt settlement entry.
- Transaction detail and transaction cards show one compact metadata row such as `Debt return · Alex`.
- Actions then shows `Detach debt return`.
- Detach removes only the debt settlement entry and keeps the income transaction intact.

Expense transactions get an `Attach debt repayment` action in Actions.

- Opens the same bottom sheet pattern.
- Lists and searches `BORROW` debt accounts.
- User selects one debt account and confirms.
- Budgie adds the debt settlement entry.
- Transaction detail and transaction cards show one compact metadata row such as `Debt repayment · Credit card`.
- Actions then shows `Detach debt repayment`.
- Detach removes only the debt settlement entry and keeps the expense transaction intact.

Existing `Convert to Transfer` remains valid for pure transfers and initial lending or borrowing. The new attachment actions are the recommended path for returns and repayments.

Fees should use the same secondary-action hierarchy. The transaction form should not show an empty fee pill because it competes with primary fields and consumes too much space.

- When no fee exists, Actions shows `Set fee`.
- `Set fee` opens the existing fee modal.
- When a fee exists, transaction detail and transaction cards show one compact metadata row such as `Fee · 2.50 · Bank fees`.
- Actions shows `Edit fee`.
- Removing a fee remains available from the fee modal unless a later usability pass proves a separate `Remove fee` action is needed.

## Validation

- Income can attach only to a `LENT` debt account.
- Expense can attach only to a `BORROW` debt account.
- A transaction can have at most one active debt settlement entry.
- The debt settlement amount always equals the full primary entry amount.
- The debt account cannot be the same account as the primary cash account.
- If account currencies differ, the settlement entry is valued with the same exchange-rate approach used by transfer conversion.

## Migration

Add the entry kind column and default all existing entries to `PRIMARY`.

Migrate only clear settlement-shaped existing `DEBT` transactions:

- `LENT` debt account plus cash account, where the cash side is `DEBIT` and the debt side is `CREDIT`: convert the transaction to `INCOME`, mark the cash entry `PRIMARY`, and mark the debt entry `DEBT_SETTLEMENT`.
- `BORROW` debt account plus cash account, where the cash side is `CREDIT` and the debt side is `DEBIT`: convert the transaction to `EXPENSE`, mark the cash entry `PRIMARY`, and mark the debt entry `DEBT_SETTLEMENT`.

Do not migrate initial lending or borrowing transfers. Those remain `DEBT` transfer flows.

Preserve the existing user category where present. Do not force a system category during migration.

When a migrated settlement has a category on only one entry, copy that category onto both the primary entry and the debt settlement entry. Analytics still counts only the `PRIMARY` entry.

## Implementation Notes

The main code paths that need changes are:

- transaction entry schema, table, entity, and create input types
- transaction creation and update helpers that build entries
- manual convert-to-transfer flow, so debt returns and repayments route to attachment instead of fake transfer conversion
- transaction actions menu for income and expense attachment actions
- bottom-sheet debt account picker
- analytics/statistics queries, category filters, tag filters, and transaction list filters so they count `PRIMARY` entries
- account balance rebuild and incremental update paths should continue to include both `PRIMARY` and `DEBT_SETTLEMENT` entries
- migration SQL for the new entry kind column and conservative existing data conversion

## PR Description Notes

The PR description should explicitly document these decisions:

- Debt returns and repayments are modeled as income or expense transactions with attached debt settlement entries, not as transfer conversions.
- Categories remain normal and user-controlled; attaching debt does not overwrite category.
- `TransactionEntryKindEnum` separates analytics meaning from ledger direction.
- Balances still come only from transaction entries.
- Analytics and category filters count primary entries and ignore debt settlement entries.
- Income can attach one full-amount settlement to one `LENT` debt account.
- Expense can attach one full-amount settlement to one `BORROW` debt account.
- Migration is conservative and only rewrites clear existing settlement-shaped debt transactions.
