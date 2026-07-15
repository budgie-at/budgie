# Debt Migration and Transaction Display Repair Design

## Goal

Repair migrated borrowed-debt history without changing legitimate post-migration activity, then make debt totals, transaction history, currency context, and home/detail progress presentation agree on the repaired canonical data.

The confirmed example is a USD debt with:

- `$45,000` borrowed principal.
- `$4,100` of legacy manual repayment progress.
- Seven transaction-linked repayments totaling `$3,966`.
- `$8,066` repaid in total.
- `$36,934` remaining.
- `17.92%` repayment progress.

The repair is complete only when those values are consistent in storage, the debt detail screen, and the home debt tile, and all seven repayment transactions remain visible exactly once.

## Evidence and Root Causes

Migration `0033_add_transaction_entry_kind.sql` normalizes legacy borrowed-debt directions, marks debt settlement entries, and converts eligible debt transactions to ordinary income or expense transactions. Migration `0035_add_debt_events.sql` then creates `debt_events` from those settlement entries and soft-deletes the legacy settlement entries.

The borrowed manual-close branch in `0035` interprets a negative legacy adjustment sum by adding it to `target_balance`. For the confirmed account, that converts `$4,100` of legacy repayment progress into `$40,900`, the remaining-balance complement. The transaction-backed close events add another `$3,966`, producing the observed incorrect `$44,866` repaid and `$134` remaining. This is a migration-shape error, not a rounding problem in the progress component.

The transaction repository selects debt-account history through live `debt_events`, but relation loaders do not consistently exclude soft-deleted transaction entries. In particular, full transaction hydration excludes consolidated source entries but not `transaction_entries.deleted_at`. A migrated transaction can therefore contain both its live UAH category entry and its deleted legacy debt settlement entry.

`TransactionCategoryBadge` treats every non-fee hydrated entry as a category entry. When the deleted settlement entry is present, it renders the transaction as a split with two chips and formats both chip amounts with the app default instrument. With UAH source, USD debt, and EUR app default, that creates two EUR-labelled chips instead of one UAH category chip. The deleted debt leg is also an invalid dependency for reconstructing the visible `₴29,000 → $684` conversion context.

The home and detail surfaces already expose debt-progress concepts, but their fallback and query paths can diverge. The repair must establish one canonical progress model so layout fixes cannot mask inconsistent calculations.

## Selected Approach

Add a forward-only corrective migration and tighten repository/UI invariants around `debt_events`.

This approach repairs persisted history at its source, keeps the offline ledger deterministic, and lets every consumer use the same canonical events. Migrations `0033` and `0035` remain unchanged because deployed databases may already have journaled either migration; editing historical SQL would not repair those installations and would make migration behavior depend on install history.

## Corrective Migration Design

Add a new migration after `0035`. It runs atomically and is idempotent: a fresh install, an upgrade from before `0033`, a database that already journaled the early/intermediate `0033`, and a database that has already run the correction must converge on the same live debt-event set.

The migration must identify affected borrowed accounts by the complete legacy shape, not by amount alone. Eligibility requires the account and related rows to match the historical `0033`/`0035` transformation pattern, including the migrated manual event provenance, the corresponding legacy adjustment/debt-entry shape, and transaction-backed settlement evidence. Compatibility predicates must recognize both the pre-`0033` path and the already-journaled intermediate `0033` path. An account with incomplete, contradictory, or ambiguous evidence is left unchanged.

For an eligible account, the migration must:

1. Correct the migration-created manual `CLOSE` amount from the remaining-balance complement to the original manual repayment progress. In the confirmed example, `$40,900` becomes `$4,100`.
2. Preserve transaction-linked repayments. The seven close events totaling `$3,966` remain live and keep their transaction association.
3. Reconstruct any transaction debt event missing only because of the supported intermediate migration history.
4. Deduplicate migration-created events by debt account, transaction, and direction before final totals are read. Exactly one live event may represent one transaction direction for one debt account.
5. Preserve legitimate manual or transaction events created after the original migration. Detection and updates are limited to events proven to belong to the legacy migration shape; the repair must not recalculate or overwrite newer user activity.
6. Keep base-instrument valuation fields consistent with the corrected amount when the legacy rows contain sufficient valuation evidence. Missing evidence must remain missing rather than being guessed from the current exchange rate.

`debt_events` remains the canonical source for opened principal, closed principal, outstanding amount, paid amount, and progress percentage. For the confirmed fixture, the canonical live events must produce one `$45,000` `OPEN`, `$8,066` total `CLOSE`, `$36,934` outstanding, and `17.92%` progress.

Running the migration again must perform no additional semantic change. All mutations occur in the migration transaction. If strict eligibility cannot be proven, the account and its events remain untouched.

## Transaction History and Currency Invariants

All transaction repository relation paths used by app behavior must exclude soft-deleted entries as well as consolidated source entries where applicable. The invariant is that a hydrated active transaction contains only live entries unless a specifically named archival API explicitly requests deleted rows.

Debt-account transaction lists are selected through live `debt_events`. Transaction IDs are distinct before hydration, so multiple historical artifacts cannot duplicate a card, while each of the seven legitimate repayment transaction IDs appears exactly once. Soft-deleted debt events and transactions are excluded.

The visible conversion context is reconstructed from live data: the live category/source entry supplies UAH and the associated debt event supplies the USD settlement value. It must not read the deleted legacy debt settlement entry. The confirmed cross-currency card displays `₴29,000 → $684`.

Each transaction card renders exactly one category chip for the live category entry. The chip amount uses that entry's account instrument, so it displays UAH even when EUR is the app default. The default instrument is not a substitute for an entry instrument. A deleted debt entry must neither create a second chip nor contribute an incorrect EUR amount.

## Progress Presentation

Restore the earlier compact debt-tile spacing and visual balance: reserve width for the left outstanding amount, keep the paid/total stack right-aligned, prevent either side from overlapping, and retain the thin bottom progress bar. Long localized values must shrink or truncate within their own allocation rather than displacing the other summary.

The layout restoration must retain the corrected canonical meaning:

- Main value: `$36,934` remaining.
- Paid value: `$8,066`.
- Total value: `$45,000` borrowed.
- Progress width: `17.92%`.

The home tile and debt detail summary consume the same debt-progress model derived from live `debt_events`. Fallback behavior is limited to states where canonical progress has not loaded; it must use the same semantics and cannot independently reinterpret account balance as repaid principal.

## Alternatives Considered

### Patch only queries and UI

This would hide the deleted entry and improve currency labels quickly, but persisted debt events would still say `$44,866` repaid. Other summaries and future features would continue to consume corrupted history. It is rejected because the source-of-truth error would remain.

### Recalculate debt history on every read

Dynamic reconstruction could bypass damaged events, but it would repeatedly reinterpret legacy ledger shapes, increase query complexity, and risk results changing across releases. It is rejected because an offline financial ledger needs stable, migrated history.

### Rewrite migrations `0033` and `0035`

Changing historical migration files would help only databases that have not journaled them and would leave affected production databases broken. It is rejected in favor of a forward-only correction that supports every known migration history.

## Regression Coverage

Create a legacy database fixture with a USD borrowed account, EUR app default, UAH repayment source, `$45,000` target principal, `$4,100` legacy manual progress, and seven repayment transactions totaling `$3,966`. Include the `₴29,000 → $684` transaction and enough row provenance to reproduce the duplicate-chip failure.

Exercise two upgrade histories:

1. A database from before `0033`, upgraded through the complete current migration chain and the correction.
2. A database whose early/intermediate `0033` is already journaled, then upgraded through the remaining migrations and the correction.

Integration coverage must assert:

- Exactly one live `$45,000` `OPEN` principal event.
- `$8,066` summed live `CLOSE` events.
- `$36,934` outstanding and `17.92%` progress.
- Seven unique transaction IDs associated with live repayment events.
- No duplicate live event for the same account, transaction, and direction.
- No soft-deleted transaction entry in normal hydrated relations.
- A second execution of the repair produces the same rows and totals.
- An ambiguous legacy-shaped account is unchanged.
- A freshly created debt and legitimate post-migration events are unchanged.

Maestro coverage must assert:

- The debt detail summary shows `$36,934`, `$8,066`, `$45,000`, and `17.92%` with the compact progress layout.
- The debt transaction list reports seven transactions and every fixture card appears once.
- The cross-currency card shows `₴29,000 → $684`.
- That card has one category chip using UAH.
- No incorrect `€29,000` or `€684` category chip is visible.
- The home debt tile presents the same progress values as the detail screen.

Production packages do not gain unit-test workspaces. Migration/integration coverage belongs in the existing integration harness, and UI behavior belongs in `tests/app-tests` Maestro coverage. After implementation, run targeted migration/integration and Maestro flows, then the mandated validation sequence:

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```

## Safety Boundary

The corrective migration is deliberately conservative. It mutates only rows proven to be artifacts of the supported legacy paths, makes all changes atomically, and leaves ambiguous rows untouched. It does not delete legitimate transactions, infer values from today's exchange rate, rewrite migration history, or modify post-migration events outside the strict legacy match.
