# Transaction Info Page Plan

## Goal

Add a read-first Transaction info page for existing income, expense, and transfer transactions. The current edit forms stay available behind an explicit Edit transaction action. Balance adjustments stay form-first because they do not have enough descriptive data to justify a read-only screen.

## Current State

- Transaction list cards link directly to `/transactions/:id/:type`.
- Existing `/transactions/:id/expense`, `/transactions/:id/income`, and `/transactions/:id/transfer` routes render edit forms immediately.
- `/transactions/:id/adjustment` already renders the adjustment form and should keep doing that.
- Source transactions with `consolidationParentTransactionId` redirect to the canonical parent transaction.
- `useGetTransactionByIdQuery` already loads transaction entries, accounts, instruments, category, MCC category, and tags.
- Existing reusable pieces cover most behavior: `TransactionActionsMenu`, `RefundedPill`, `TransactionFeePill`, `MatchingRulesPill`, consolidation source modal, convert-to-refund modal, convert-to-transfer modal, and quick forms.

## Proposed Route Model

Use the existing route URLs as the info pages:

- `/transactions/:id/expense` shows Transaction info for expense.
- `/transactions/:id/income` shows Transaction info for income.
- `/transactions/:id/transfer` shows Transaction info for transfer.
- `/transactions/:id/adjustment` keeps opening the adjustment form.

Move the existing edit forms behind nested edit routes:

- `/transactions/:id/expense/edit`
- `/transactions/:id/income/edit`
- `/transactions/:id/transfer/edit`

This preserves list navigation and deep links as "view details" while making the Edit transaction button a clear route transition. Existing redirects for consolidation source rows remain at the info route boundary.

## Screen Structure

The page should follow the mockups, adapted to Budgie's current native styling:

1. Header
   - Back button.
   - Actions menu on the right.
   - Menu keeps delete/revert and conversion actions where valid.

2. Hero
   - Large signed amount with type color.
   - Category or transfer icon in a soft tinted square/circle.
   - Transaction title or comment fallback.
   - Compact pills for type, category, refunded state, fee, matching rules, and consolidation/source state where relevant.

3. Details
   - Date and time.
   - Account for income/expense.
   - From account and To account for transfer.
   - Category for income/expense.
   - MCC category when present.
   - Note/comment when present.
   - Tags when present.
   - Source/external source when present.
   - External ID when present and useful.
   - Exchange rate for cross-currency transfers.
   - Transfer fee or transaction fee when fee entries exist.
   - Consolidation sources entry point when transaction is consolidated.
   - Refund sources entry point when expense has refunded sources.
   - Matching rules entry point when existing rule detection finds matches.

4. Similar Transactions
   - Monobank-inspired block showing repeated/similar spend or income for the same merchant/title/category/account.
   - Default period should be 6 months, with a segmented 6 months / 12 months switch.
   - Show total amount, transaction count, average amount, and a compact month-by-month bar chart.
   - Hide the block if there is no useful history.

5. Footer
   - Sticky primary Edit transaction button.
   - Button opens the corresponding `/edit` route.

## Field Inventory By Type

### Expense

- Amount: negative, destructive color.
- Title: merchant/title first, comment fallback.
- Type pill: Expense.
- Category pill: selected category, or uncategorized state.
- Refunded pill: existing `RefundedPill`; opens sources when applicable.
- Fee pill: existing fee amount when fee entries exist.
- Matching rules pill: same behavior as form.
- Date/time.
- From account.
- Category.
- MCC category.
- Note/comment.
- Tags.
- Source/external source and external ID.
- Consolidation sources or revert state when consolidated.
- Similar expenses block.

### Income

- Amount: positive color.
- Title: title first, comment fallback.
- Type pill: Income.
- Category pill.
- Matching rules pill.
- Date/time.
- To account.
- Category.
- Note/comment.
- Tags.
- Source/external source and external ID.
- Consolidation sources or revert state when consolidated.
- Similar income block.

### Transfer

- Amount: source amount in transfer/default color.
- Secondary amount: destination amount for cross-currency transfers.
- Title: transfer title/comment fallback.
- Type pill: Transfer.
- Date/time.
- From account.
- To account.
- Exchange rate when cross-currency.
- Transfer fee when fee entries exist.
- Note/comment.
- Source/external source and external ID when present.
- Consolidation sources or revert state when consolidated.
- Similar transactions block is probably hidden by default unless we intentionally want repeated transfers.

### Adjustment

- Keep existing form route.
- No read-only page in the first implementation.

## Similar Transactions Data Design

Add a small read model rather than reusing the quick-form pattern suggestion APIs directly. The info page needs historical facts, not suggestions.

Candidate match logic:

- Exclude the current transaction.
- Exclude deleted transactions and consolidation source children.
- Match same transaction type.
- Prefer exact normalized title match when title exists.
- Otherwise match same category and account with comment fallback.
- For expense/income, constrain to the primary account and category when present.
- For transfer, either hide or match same from/to accounts only if we decide to include transfer history.
- Query bounded by selected period start date: 6 or 12 months before the current transaction operated date.

Returned shape:

- count.
- total amount in transaction currency or base currency.
- average amount.
- monthly buckets for chart.
- latest matching transactions for possible future expansion, capped to a small number.

Performance:

- Use one repository query with date/type/account/category/title predicates and monthly grouping.
- Add no long-running scan on render.
- Use `useLiveQuery` with current transaction id, period, and language/settings dependencies.

## Component Plan

Create cohesive transaction info components under `packages/app/src/transaction/components/transaction-info-*`:

- `transaction-info-page`: page shell, sticky footer, and action wiring.
- `transaction-info-hero`: amount, icon, title, and top pills.
- `transaction-info-row`: reusable details row with icon, label, value, optional description, and optional press.
- `transaction-info-tags-row`: compact tags display.
- `transaction-info-similar-card`: segmented period control, totals, and chart.
- `transaction-info-actions`: wrapper for edit, convert, delete, revert, refund sources, and consolidation sources.

Route files stay thin and only load data, redirect, and pass props.

## Styling Direction

Use a refined native read screen, not a form disguised as details:

- Keep Budgie dark/light theme tokens and existing variants.
- Use the expressive hero idea from the mockups but avoid adding a giant decorative landing-page style.
- Use compact rows with strong hierarchy: grey labels, primary values, secondary metadata.
- Use existing icons through `UserIconNameEnum` and `CircleIcon`.
- Use current `Button`, `Card`, `PopoverMenu`, `RefundedPill`, `TransactionFeePill`, and `MatchingRulesPill`.
- Footer edit button should be sticky and safe-area aware.

## Testing Plan

Add or update Maestro coverage in `tests/app-tests`:

- Existing transaction card opens info page, not edit form.
- Edit transaction button opens the old form.
- Adjustment transaction still opens form directly.
- Expense info shows amount, date, account, category, MCC, note, tags, refund pill, fee pill, and similar block when fixture has history.
- Income info shows amount, date, account, category, note, tags, and similar block.
- Transfer info shows from/to accounts, exchange rate, destination amount, and fee.
- Consolidated transaction info opens sources and can revert through existing flow.
- Source child transaction still redirects to canonical parent.
- Existing edit/conversion/revert tests should be updated only where route expectations change.

Run before PR:

- `yarn format`
- `yarn ts`
- `yarn lint`
- `yarn deadcode`
- `yarn cpd`
- Targeted Maestro flow for transaction info.

## Open Questions

1. Should the info page replace the current route URLs and move forms to `/edit`, or should we keep forms at current URLs and add separate `/info` routes?
2. For similar transactions, should transfer history be hidden in the first version, or shown for same from/to account pairs?
3. Should similar transactions match by exact title first only, or combine title + category + account for stricter matching?
4. Should the similar block display totals in the transaction currency, the account currency, or the app base currency when history crosses currencies?
5. Should fields like external source and external ID be visible by default, or tucked behind a Source row/action?
6. Should transaction rows be individually tappable to edit each field later, or should all edits go through the single Edit transaction button for this first version?
7. Should receipt/PDF actions from bank statements be in scope now, or explicitly out of scope until we have receipt storage?
