# Binance P2P Authoritative Fiat Matching Design

## Goal

Use Binance C2C order data to consolidate high-confidence one-to-one bank and Binance transactions before considering heuristic grouped-expense matches.

Binance reports both sides of each C2C order: the crypto quantity, fiat currency, total fiat price, and unit price. Budgie currently persists only the crypto quantity. Preserving the quoted fiat values allows the consolidation service to reserve obvious pairs such as `25,842 UAH -> 585.98 USDT` and `524 UAH -> 11.87 USDT` before grouped matching can combine the two bank expenses.

## Scope

This design covers:

- Persisting provider-reported quote data for Binance C2C orders.
- Backfilling quote data when an existing Binance C2C transaction is encountered during resync.
- An authoritative one-to-one matching phase for Binance P2P buys.
- Reserving unresolved authoritative candidates from heuristic grouping.
- Running the existing one-to-three-expense grouping phase only after authoritative matching reaches a fixed point.
- Repairing system-generated P2P groups whose sources conflict with newly available authoritative quote data.

This design does not change the Binance API history window, expand grouped matching beyond three bank expenses, or change one-to-one Binance P2P sell behavior.

## Provider Quote Data

Provider quote data belongs to the transaction entry representing the provider-side asset. Add nullable, provider-independent fields:

- `quotedInstrumentId`: the instrument of the provider-reported countervalue.
- `quotedAmount`: the provider-reported total countervalue in microunits.
- `quotedUnitPrice`: the provider-reported unit price in microunits.

These fields are distinct from `baseInstrumentId`, `baseAmount`, and `baseExchangeRate`. Base valuation is analytics state that may be recalculated; provider quote data is immutable source evidence.

The sync transaction contract gains optional quoted-currency code, quoted amount, and quoted unit price fields. The Binance C2C mapper populates them from:

- `fiat`
- `totalPrice`
- `unitPrice`

The existing crypto `amount` behavior remains unchanged in this change. Binance commission handling is outside this design.

The app sync layer resolves the quoted currency code to an instrument and persists the quote fields. If the instrument is unknown, the C2C transaction still imports normally but does not qualify for authoritative matching.

## Existing Transaction Reconciliation

Binance resync may encounter a C2C transaction that already exists by external ID. It must update missing or changed provider quote fields on the existing source entry instead of treating the transaction as a no-op duplicate.

Reconciliation is idempotent:

- Equal quote values produce no write.
- Missing values are backfilled.
- Changed Binance values replace the stored quote values.
- The transaction identity and user-visible crypto amount remain unchanged.

If a source entry has moved under a consolidation canonical, reconciliation locates it by its original transaction identity and updates the moved source entry.

## Authoritative Candidate Rules

An authoritative Binance P2P buy candidate contains exactly one unconsolidated bank expense and one Binance C2C crypto income.

It is eligible only when:

- The Binance entry has `quotedInstrumentId` and `quotedAmount`.
- The bank account instrument equals `quotedInstrumentId`.
- The absolute timestamp difference is at most 3,600 seconds.
- The bank expense amount is greater than or equal to the Binance quoted amount.
- The positive difference is no more than 2% of the Binance quoted amount.
- The positive difference is no more than 500 units of the quoted fiat currency.
- Both source transactions are otherwise eligible for consolidation.

The percentage and absolute limits must both pass. This permits a small bank-side fee without allowing a nearby unrelated expense to qualify.

## Ranking and Ambiguity

Authoritative candidates are ranked lexicographically by:

1. Smallest bank amount above the Binance quoted amount.
2. Smallest absolute timestamp difference.

A transaction ID is never used to break a score tie.

The candidate must be the unique best choice for both its Binance transaction and its bank transaction. Equal-best or conflicting ownership remains unresolved.

Every transaction participating in any eligible but unresolved authoritative candidate is reserved. Reserved transactions are excluded from heuristic grouping so ambiguity cannot silently fall through to a less reliable match.

## Matching Phases

The P2P consolidation family runs in two ordered phases.

### Phase 1: Authoritative One-to-One

Discover, rank, and execute authoritative candidates. Repeat candidate discovery after every successful pass until no further authoritative pair can be consolidated.

Only the authoritative phase runs while authoritative candidates remain executable.

### Phase 2: Heuristic and Grouped Matching

After the authoritative phase reaches a fixed point, run the existing rate-based one-to-one and one-to-three-expense matching.

This phase uses only:

- Transactions that remain unconsolidated.
- Transactions that are not reserved by unresolved authoritative candidates.
- Legacy Binance C2C transactions that do not have usable quote data.

Existing one-hour, same-bank-account, rate-tolerance, group-size, ranking, and ambiguity rules remain in effect.

## Existing Incorrect Group Repair

Backfilled quote data may reveal that a system-generated P2P canonical grouped sources incorrectly.

Before normal authoritative matching, reconciliation examines P2P canonicals containing a Binance source whose quote data was newly added or changed. A canonical is eligible for automatic repair only when:

- Its consolidation type is `P2P_FIAT_TRANSFER`.
- Its `updatedBy` value is null, identifying a consolidation-generated canonical that has not been explicitly edited by the user.
- Its bank source set is not exactly the single bank source selected by authoritative matching. A canonical with the correct bank source plus one or more unrelated bank sources is therefore repaired.

An eligible canonical is unconsolidated atomically, restoring every original source. Normal authoritative-first consolidation then rebuilds the correct pairs.

User-edited canonicals are never automatically unconsolidated. They remain unchanged and are reported as unresolved diagnostic state.

## Data Flow

1. Binance returns a C2C order with crypto and fiat values.
2. The Binance mapper converts all monetary strings to microunits.
3. Sync creates or reconciles the Binance transaction and provider quote fields.
4. Newly quoted sources trigger narrowly scoped P2P repair checks.
5. The consolidation coordinator runs authoritative one-to-one matching to a fixed point.
6. Unresolved authoritative candidates reserve their sources.
7. Heuristic and grouped matching runs on the remaining unreserved sources.
8. Canonical transfer creation and unconsolidation continue using the existing atomic executor.

## Failure Handling

- Invalid Binance quote values are rejected at the mapping boundary and logged without preventing other Binance sources from syncing.
- Unknown fiat instruments preserve the crypto transaction but skip authoritative matching.
- Ambiguous authoritative ownership causes no mutation and reserves the affected sources.
- A failed repair transaction leaves the existing canonical unchanged.
- A source that becomes ineligible before execution causes the atomic consolidation to return without mutation.
- Heuristic matching remains available for legacy C2C rows without quote data.

## Verification

Sync integration scenarios cover:

- Mapping Binance `fiat`, `totalPrice`, and `unitPrice`.
- Persisting quote fields on a new C2C transaction.
- Backfilling quote fields on an existing unconsolidated C2C transaction.
- Backfilling a moved source entry under a P2P canonical.
- Idempotent resync with unchanged quote data.

Consolidation integration scenarios cover:

- Exact quoted fiat amount matching.
- A bank expense slightly above the quote within both fee limits.
- Rejection below the quoted fiat amount.
- Rejection above either the 2% or 500-unit limit.
- Rejection for the wrong fiat instrument.
- Acceptance at exactly one hour and rejection beyond one hour.
- Unique-best ownership and equal-best ambiguity.
- Reservation of unresolved authoritative candidates from grouping.
- Authoritative pairs being consolidated before an otherwise better-scoring grouped candidate.
- The `25,842 UAH`, `524 UAH`, `585.98 USDT`, and `11.87 USDT` regression.
- Repair and correct reconsolidation of a system-generated incorrect group.
- Preservation of user-edited P2P canonicals.
- Legacy grouping behavior when provider quote data is unavailable.

Final verification runs targeted sync and consolidation integration suites followed by `yarn format`, `yarn ts`, `yarn lint`, `yarn deadcode`, and `yarn cpd`.
