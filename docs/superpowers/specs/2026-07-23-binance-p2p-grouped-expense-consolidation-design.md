# Binance P2P Grouped Expense Consolidation Design

## Goal

Automatically consolidate one Binance P2P buy income with one, two, or three bank expense transactions when the bank payments collectively fund the Binance order.

The change also makes P2P candidate discovery reach a fixed point during one consolidation run so a valid pair exposed by an earlier consolidation does not require another user-triggered resync.

## Scope

This design covers:

- Binance C2C buy transactions represented as crypto income.
- One to three bank expense transactions funding one Binance income.
- Existing one-to-one Binance P2P buy and sell matching.
- Localized canonical P2P transfer titles.
- Same-run discovery of candidates exposed by earlier consolidations.

This design does not add grouped bank incomes for Binance P2P sells. Existing one-to-one sell matching remains unchanged.

## Matching Rules

A grouped Binance P2P buy candidate is eligible only when all of the following are true:

- The group contains one, two, or three unconsolidated bank expense transactions.
- Every expense belongs to the same active bank account.
- Every expense is within 3,600 seconds of the Binance transaction.
- Every amount is positive.
- The summed bank amount and Binance amount imply an exchange rate within 10% of the expected exchange rate.
- The expected exchange rate exists.
- None of the source transactions is already claimed by a higher-priority consolidation family.

Expenses whose individual amount exceeds the maximum total allowed by the 10% exchange-rate range are discarded before combinations are generated.

## Candidate Discovery

The consolidation repository returns the atomic data needed for P2P grouping: unconsolidated Binance C2C transactions, eligible bank expenses within the one-hour window, account identity, instrument identity, amounts, and timestamps.

A P2P grouping service partitions bank expenses by Binance transaction and bank account. It generates combinations containing at most three expenses and calculates:

- Summed bank amount.
- Implied exchange rate.
- Exchange-rate difference from the expected rate.
- Maximum absolute time difference between a source expense and the Binance transaction.
- Source transaction count.

Non-P2P transfer discovery remains on the existing path. Existing one-to-one P2P matching moves behind the grouped P2P path so single and grouped candidates use one ranking and ambiguity policy.

## Ranking and Ambiguity

Eligible combinations are ranked lexicographically by:

1. Lowest exchange-rate difference.
2. Smallest maximum time difference.
3. Fewest bank expense transactions.

Transaction IDs are not used to resolve equal scoring candidates. Equal-best candidates are ambiguous and remain unconsolidated.

A bank expense may belong to only one selected candidate. If selected candidates overlap, the affected candidates remain unconsolidated unless the ranking produces one unambiguous non-overlapping assignment.

## Consolidation Execution

The selected candidate supplies all bank expense transaction IDs followed by the Binance transaction ID as source transactions.

The canonical transfer uses:

- The shared bank account as the source account.
- The Binance crypto account as the destination account.
- The sum of the bank expense amounts as the source amount.
- The Binance income amount as the destination amount.
- The implied grouped exchange rate.
- The existing P2P fiat consolidation type.
- A localized Binance P2P title.

The existing consolidation executor already accepts an arbitrary source transaction ID list. It revalidates all source transactions and moves them under the canonical transfer within one database transaction. Any failed eligibility check leaves every source unchanged.

Unconsolidation restores every original bank expense and the Binance source transaction.

## Fixed-Point Processing

P2P candidate discovery reruns after a pass successfully consolidates at least one candidate. Processing stops as soon as a pass consolidates zero candidates.

Each successful pass removes at least one visible source transaction, so the loop terminates without an arbitrary retry count. This allows a valid pair hidden by the initial reciprocal ranking to consolidate during the same sync-triggered drain.

## Localization

The consolidation package remains independent of Lingui. The app injects a P2P canonical-title resolver when it wires the consolidation services.

The resolver uses Lingui messages for:

- `Binance P2P buy {asset}`
- `Binance P2P sell {asset}`

The canonical title is localized using the active app language and persisted when consolidation occurs. Consolidation integration tests inject a deterministic English resolver and do not load the app i18n runtime.

All supported `.po` catalogs receive translations. `yarn i18n:sync` regenerates the compiled `.ts` catalogs.

## Performance Controls

Combination generation is bounded by:

- One Binance transaction at a time.
- One bank-account partition at a time.
- The one-hour candidate window.
- Positive amounts that cannot individually exceed the valid total range.
- A maximum combination size of three.

These constraints prevent repository-wide subset generation while preserving the confirmed split-payment use case.

## Failure Handling

- Missing exchange rates produce no candidate.
- Out-of-tolerance groups produce no candidate.
- Mixed-account groups produce no candidate.
- Equal-best or overlapping ambiguous groups produce no candidate.
- Sources that become ineligible before execution cause the atomic consolidation to return without mutation.
- A P2P pass that makes no successful mutation ends fixed-point processing.

## Verification

Consolidation integration scenarios cover:

- Existing one-to-one P2P buy and sell behavior.
- Two bank expenses funding one Binance income.
- Three bank expenses funding one Binance income.
- Individual expenses failing the rate check while their sum passes.
- Four-expense grouping rejection.
- Mixed-account grouping rejection.
- Acceptance at exactly one hour and rejection beyond one hour.
- Missing and out-of-tolerance exchange rates.
- Equal-best and overlapping ambiguity rejection.
- Same-run discovery of a pair exposed by an earlier consolidation.
- Unconsolidation restoring all original sources.

App and sync integration coverage verifies that Binance-triggered consolidation receives the Lingui-backed title resolver.

Implementation follows test-driven development: add failing integration scenarios, implement the smallest matching and execution changes, then run targeted suites. Final verification runs `yarn i18n:sync` followed by `yarn format`, `yarn ts`, `yarn lint`, `yarn deadcode`, and `yarn cpd`.
