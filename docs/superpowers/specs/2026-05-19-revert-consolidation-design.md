# Revert Consolidation Design

## Goal

Add a user-facing **Revert** action for consolidated transactions so users can restore the original transaction state after automatic consolidation.

## Current Context

Consolidated transactions already preserve enough state to reverse the operation:

- Transfer-pair, IBAN bridge, and ATM cash withdrawal consolidation create a canonical transfer transaction, move source entries onto it, and retain each moved entry's `originalTransactionId`.
- Refund consolidation promotes the original expense by setting `consolidationType = REFUND`, moves refund income entries onto the expense, and retains each moved entry's `originalTransactionId`.
- `unconsolidateByIdInTransaction(transactionId, tx)` already moves source entries back, clears parent links, deletes canonical transfer-style transactions, and clears refund consolidation on promoted expense transactions.
- `transactionService.unconsolidateById(id)` wraps that operation in a database transaction and refreshes balances.

The missing piece is product clarity. Today consolidated transactions are exposed through a delete/unconsolidate path. Users need a short, understandable action label that describes undoing the consolidation rather than deleting normal data.

## User-Facing Behavior

For any transaction with `consolidationType`:

- The detail-page actions menu shows **Revert** as the destructive action instead of Delete.
- The transaction-list long-press menu shows **Revert** as the destructive action instead of Delete.
- The consolidation source form sheet shows a destructive **Revert** button near the bottom.
- The confirmation flow uses the existing native confirmation alert:
  - Title: **Revert consolidation?**
  - Body: **This will restore the original transactions and remove the consolidated transaction.**
  - Confirm button: **Revert**
  - Cancel button: **Cancel**
- Successful revert from a transaction detail page navigates back to the transactions list.
- Successful revert from the consolidation source form sheet dismisses the sheet and returns to the transactions list.
- Successful revert from the transaction-list long-press menu closes the menu and stays on the list.

For transactions without `consolidationType`:

- Delete behavior remains unchanged.
- No Revert action is shown.

## Technical Design

Add a UI-facing revert hook instead of continuing to call the delete flow for consolidated transactions.

### Revert Hook

Create `packages/app/src/transaction/hook/use-revert-consolidation.hook.ts`.

Responsibilities:

- Build the Revert confirmation copy with Lingui.
- Call `confirmAlert`.
- If confirmed, call `transactionService.unconsolidateById(transactionId)`.
- Show a Toast error on failure using `getErrorMessage`.
- Accept an optional success callback so callers can navigate or close UI after the revert succeeds.

This keeps confirmation and error handling shared by all UI entry points while keeping business logic in `TransactionService`.

### Detail Actions Menu

Update `TransactionActionsMenu` so consolidated transactions render **Revert** in the destructive menu slot instead of Delete.

The component should accept an `onRevert` callback in addition to `onDelete`. For consolidated transactions it calls `onRevert`; for non-consolidated transactions it calls `onDelete`. The detail pages pass `onRevert` only when the transaction is consolidated.

Update the expense, income, and transfer detail pages:

- Detect `isConsolidated` from `transaction.consolidationType`.
- Use `useRevertConsolidation`.
- On revert success, call `dismissAllOrReplace('/')`.
- Keep existing delete handling for non-consolidated transactions.

### Transaction List Long-Press Menu

Update `TransactionListContextMenu` so consolidated transactions render **Revert** instead of Delete.

For consolidated transactions, the menu calls `useRevertConsolidation` and stays on the list after success. For non-consolidated transactions, it keeps calling `useDeleteTransaction`.

### Consolidation Source Form Sheet

Update `ConsolidationSourceModalContent` to show a destructive **Revert** button when the loaded canonical transaction still has `consolidationType`.

The current `useGetConsolidationSourcesQuery` already returns `consolidationType`, so the form sheet can decide whether to show Revert without a second query. On success, the sheet should dismiss and return to the list.

### Selectors

Add stable selectors for the new action:

- `TransactionActionsMenuSelector.RevertButton`
- `TransactionListContextMenuSelector.RevertButton`
- `ConsolidationSourceModalSelector.RevertButton`

Keep existing delete selectors for non-consolidated delete actions.

### Icon

Use `UserIconNameEnum.Undo2` for the Revert action. It is short, direct, and matches the user's mental model of undoing the consolidation.

## Data Integrity

The revert operation is atomic through `transactionAsync`.

Expected state after revert:

- Transfer-pair, IBAN bridge, and ATM cash withdrawal canonicals are deleted.
- Their moved source entries return to their original transactions.
- Source transactions have `consolidationParentTransactionId = null`.
- Canonical ledger entries and tags are removed.
- Refund consolidation clears `consolidationType` on the expense.
- Refund income entries return to their original transactions.
- Account balances refresh after the operation.

## Testing

Existing integration coverage already verifies transfer-pair and refund unconsolidation. Add coverage for ATM cash withdrawal revert so all consolidation families represented by the current data model have restore coverage.

Add or update one Maestro flow only if an existing consolidation flow can reach the new UI action cheaply. Prefer checking the presence of **Revert** in the source form sheet or long-press menu over creating a broad new scenario.

Before completion, run the repository validation required by AGENTS instructions:

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```
