# Crypto Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add crypto accounts to Budgie as first-class offline-first portfolio accounts with exact asset quantities, fiat valuation, manual entry/import first, and a path toward exchange and wallet sync.

**Architecture:** Reuse Budgie's existing `AccountTypeEnum.CRYPTO` and `InstrumentTypeEnum.CRYPTO` concepts, but do not force crypto through the current fixed `PRECISION = 1_000_000` amount model. Split asset quantity from fiat valuation, store exact quantities with per-instrument precision, and derive default-currency net worth from cached market prices that refresh opportunistically.

**Tech Stack:** Expo 54, React Native, Expo Router, Drizzle SQLite, `@budgie/contracts`, `packages/app` offline repositories/services, optional market-data API adapter in `packages/bank-sync` or a new source-specific module.

---

## Current Budgie Context

Budgie already has several foundations for crypto:

- `packages/contracts/src/account/enum/account-type.enum.ts` already includes `CRYPTO`.
- `packages/contracts/src/instrument/enum/instrument-type.enum.ts` already includes `CRYPTO`.
- `packages/app/src/account/constant/account-icon.constant.ts`, `account-color.constant.ts`, and `account-type.constant.ts` already contain crypto presentation mappings.
- The account creation route does not expose crypto yet. `packages/app/src/app/(main)/create-account/index.tsx` only shows checking, savings, debt, and bank sync providers.
- `packages/app/src/app/(main)/create-account/[type].tsx` does not route `AccountTypeEnum.CRYPTO`.
- Existing balances and transaction entries use integer micro-units through `PRECISION = 1_000_000`, `convertToMicroUnits()`, and `convertFromMicroUnits()`.
- Account totals and net worth use `exchange_rates` for conversion into the user's default instrument.
- Seed data currently inserts common fiat instruments only in `packages/app/drizzle/0000_normal_dragon_man.sql`.

The key implication: crypto should be integrated into the current account, instrument, transaction, balance, and exchange-rate layers, but amount precision must be upgraded before claiming real crypto support.

## Research Summary

### Market Data

CoinGecko is a strong default candidate for market data because it covers real-time and historical prices, metadata, centralized exchanges, on-chain data, and broad network/token coverage. Its API page lists coverage across coins, networks, exchanges, historical charts, OHLC data, search, token metadata, and on-chain DEX data. The historical-data guide supports coin IDs and contract addresses, with `/coins/{id}/history`, `/market_chart`, and `/market_chart/range` endpoints and automatic granularity based on range.

Sources:

- [CoinGecko API](https://www.coingecko.com/en/api)
- [CoinGecko historical data guide](https://docs.coingecko.com/docs/2-get-historical-data)

### Competitor Patterns

Delta focuses on broad investment tracking: connect wallets, exchanges, and accounts; view portfolio allocation; monitor live performance; receive notifications; and track across devices.

Kubera positions crypto as part of a full net-worth balance sheet. It emphasizes multi-currency wealth, nested portfolios/entities, real-time reporting, exchanges, wallets, DeFi, NFTs, and stablecoins as cash-equivalent assets.

Monarch treats Coinbase crypto as an investment asset class, includes crypto in net worth, updates prices frequently, and classifies coins across brokerages and Coinbase under a unified cryptocurrency asset type.

Koinly is the closest model for transaction correctness. It advertises API sync, CSV import, EVM and Solana/Cardano support, xPub imports, smart transfer matching, spam detection, exchange and transaction fee tracking, balance verification, negative balance warnings, double-entry ledger per asset, advanced filtering, and cost analysis.

CoinTracker and CoinLedger show the transaction taxonomy needed for serious crypto: buys, sells, crypto-to-crypto trades, swaps, NFT mints, liquidity add/remove, income, staking, lending, and DeFi-specific auto-categorization. CoinTracker's tax-lot docs also show why purchase lots, cost basis, holding period, FIFO, HIFO, LIFO, and specific identification must be considered even if Budgie does not ship tax filing in the MVP.

Sources:

- [Delta](https://delta.app/en)
- [Kubera](https://www.kubera.com/)
- [Monarch Coinbase account organization](https://www.monarch.com/coinbase-organizing-accounts-rules)
- [Koinly pricing and features](https://koinly.io/pricing/)
- [CoinTracker tax lots](https://support.cointracker.io/hc/en-us/articles/21905991246097-Understand-tax-lots)
- [CoinTracker cost basis methods](https://support.cointracker.io/hc/en-us/articles/4413071356177-Cost-basis-methods-for-US-customers)
- [CoinLedger transaction types](https://help.coinledger.io/en/articles/8546372-what-transaction-types-does-coinledger-support)
- [CoinTracker DeFi categorization](https://support.cointracker.io/hc/en-us/articles/20959079941265-How-automatic-categorization-for-DeFi-transactions-works)

### Compliance and Safety

Crypto accounting creates tax and regulatory expectations quickly. The IRS treats income from digital assets as taxable and has broker reporting and basis-allocation guidance for digital assets. The European Commission's MiCA overview highlights risks around customer disclosures, fraud, operational requirements, cyber risk, AML, and market abuse.

Budgie should not present MVP crypto as tax advice, trading advice, custody, or exchange execution. It should record facts, show valuations, support export, and make stale/estimated prices explicit.

Sources:

- [IRS digital assets](https://www.irs.gov/filing/digital-assets)
- [European Commission crypto-assets and MiCA](https://finance.ec.europa.eu/digital-finance/crypto-assets_en)

## Product Positioning

Budgie should not try to become Koinly or Delta immediately. The strongest fit is:

1. Offline-first crypto net-worth tracking inside an expense tracker.
2. Manual and CSV-first account setup so users can track holdings without sharing exchange credentials.
3. Optional market price refresh so net worth reflects current default-currency value.
4. Transaction history detailed enough to support future tax-lot and sync features.
5. No custody, no private keys, no trading, no tax filing in MVP.

This keeps Budgie aligned with its privacy and offline-first identity while avoiding a brittle exchange-sync launch.

## Recommended Approach

### Approach A: Treat Crypto Like Fiat

Use current `AccountTypeEnum.CRYPTO`, seed a few crypto instruments, create crypto accounts through the existing liability account form, and store amounts with current micro-units.

Pros:

- Fastest to ship.
- Minimal schema change.
- Reuses account screens and balance calculations.

Cons:

- Incorrect precision for BTC and many tokens.
- Cannot represent small balances or gas fees accurately.
- Creates migration debt in core ledger tables.
- Makes future tax lots and DeFi categorization harder.

Verdict: Reject except for a throwaway prototype.

### Approach B: Exact Asset Quantity Plus Fiat Valuation

Add per-instrument precision and exact quantity storage while keeping current fiat flows compatible. Crypto entries store asset quantity exactly. Valuation is derived from exchange rates or price snapshots into the user's default fiat instrument.

Pros:

- Correct enough for BTC, ETH, tokens, staking rewards, fees, and future imports.
- Fits existing account/instrument/exchange-rate architecture.
- Enables offline-first cached valuations.
- Keeps Budgie out of custody and trading.

Cons:

- Requires schema and conversion refactor.
- Requires careful query migration because current SQL sums assume numeric micro-units.
- Needs UI changes for variable decimal places.

Verdict: Recommended.

### Approach C: External Portfolio Mirror Only

Keep Budgie ledger untouched and create a separate `crypto_holdings` module with balances, no transaction ledger.

Pros:

- Lower risk to expense ledger.
- Good for read-only portfolio display.

Cons:

- Does not integrate with transfers, net worth, account filters, exports, or future tax lots.
- Creates a parallel financial model.
- Hard to reconcile fiat buys/sells with existing bank transactions.

Verdict: Useful only if crypto must be shipped as a passive widget. Not recommended for platform integration.

## Target MVP

The MVP should ship the following:

- Crypto account creation from the existing new-account flow.
- Seeded crypto instruments for BTC, ETH, SOL, USDC, USDT, and BNB.
- Instrument metadata that includes `precision`, `displayPrecision`, `marketDataId`, and optional `contractAddress` and `network`.
- Exact quantity input and display based on the selected instrument.
- Manual balance adjustment for a crypto account.
- Manual crypto buy, sell, receive, send, fee, and transfer entries using existing transaction screens where practical.
- Default-currency valuation from cached market prices.
- Net-worth inclusion controlled by the existing `includeInNetWorth` flag.
- Stale price indicator when market prices are older than the configured threshold.
- CSV import/export extension for crypto quantities and native fiat values.
- Clear in-app wording that values are estimates and Budgie is not providing tax or investment advice.

The MVP should intentionally defer:

- Exchange OAuth/API sync.
- Public wallet address sync.
- DeFi protocol decoding.
- NFT support.
- Tax forms.
- Tax-lot sale optimization.
- Trading execution.
- Custody or private key handling.

## Data Model Plan

### Instruments

Modify:

- `packages/contracts/src/instrument/table/instrument-entity.table.ts`
- `packages/contracts/src/instrument/entity/instrument-create-entity.interface.ts`
- `packages/contracts/src/instrument/entity/instrument-entity.interface.ts`
- `packages/contracts/src/instrument/schema/instrument-create-entity.schema.ts`
- `packages/contracts/src/instrument/schema/instrument-entity.schema.ts`
- `packages/app/drizzle/*`

Add fields:

- `precision`: integer. Existing fiat defaults to `6` to preserve current micro-unit semantics.
- `displayPrecision`: integer. Fiat defaults to `2`; BTC defaults to `8`; ETH defaults to `6` or `8` in UI; stablecoins default to `2` or `4`.
- `marketDataSource`: enum, initially `COINGECKO`.
- `marketDataId`: text, such as `bitcoin`, `ethereum`, `solana`, `usd-coin`, `tether`.
- `network`: nullable text for token-specific assets.
- `contractAddress`: nullable text for token-specific assets.
- `isStablecoin`: boolean default false.

Add enum:

- `packages/contracts/src/instrument/enum/market-data-source.enum.ts`

Seed crypto instruments:

- BTC: precision 8, displayPrecision 8, marketDataId `bitcoin`
- ETH: precision 18 if the exact-quantity layer supports it, otherwise precision 8 for MVP with a documented import limitation
- SOL: precision 9 if supported, otherwise precision 8
- USDC: precision 6, displayPrecision 2, marketDataId `usd-coin`, stablecoin true
- USDT: precision 6, displayPrecision 2, marketDataId `tether`, stablecoin true
- BNB: precision 8, displayPrecision 6, marketDataId `binancecoin`

### Exact Amounts

Modify:

- `packages/contracts/src/transaction-entry/table/transaction-entry-entity.table.ts`
- `packages/contracts/src/account-balance/table/account-balance-entity.table.ts`
- `packages/app/src/@generic/utils/convert-to-micro-units.util.ts`
- `packages/app/src/@generic/utils/convert-from-micro-units.util.ts`
- account and transaction repositories that sum amounts

Recommended storage:

- Add `amountAtomic` as text for transaction entries and account balances.
- Backfill `amountAtomic = String(amount)` for existing rows because current `amount` already uses six-decimal atomic micro-units.
- Keep `amount` during migration for compatibility.
- Move all new amount code toward `amountAtomic` plus instrument precision.
- Use `Decimal`-style exact arithmetic in app/services for parsing and display.

Rationale:

- SQLite integer and JavaScript number arithmetic are not safe for all 18-decimal token balances.
- Text atomic values allow exact persistence.
- Existing SQL aggregations can remain for fiat while crypto balances move through cached balance recomputation until the repository supports exact decimal aggregation safely.

### Price and Valuation

Modify:

- `packages/contracts/src/exchange-rate/table/exchange-rate-entity.table.ts`
- `packages/contracts/src/exchange-rate/repository/exchange-rate.repository.ts`
- `packages/app/src/exchange-rate/service/exchange-rates.service.ts`

Add:

- `observedAt`: timestamp for market price time.
- `expiresAt`: timestamp or compute staleness from `observedAt`.
- `source`: keep existing source field, but constrain new values through an enum.
- `confidence`: enum or text for `LIVE`, `STALE`, `MANUAL`.

Recommended behavior:

- Use `exchange_rates` as latest price cache, not a complete historical market database.
- Add optional `market_price_snapshots` only when charts or historical valuation are implemented.
- Store crypto-to-default-fiat rates and stablecoin-to-default-fiat rates.
- For stablecoins, do not hardcode 1.00 unless the default fiat is the pegged fiat and the source price is unavailable; mark such fallback as `MANUAL` or `STALE`.

### Transaction Taxonomy

Add enum:

- `packages/contracts/src/crypto/enum/crypto-transaction-kind.enum.ts`

Initial values:

- `BUY`
- `SELL`
- `TRADE`
- `TRANSFER`
- `RECEIVE`
- `SEND`
- `FEE`
- `REWARD`
- `STAKE`
- `UNSTAKE`
- `ADD_LIQUIDITY`
- `REMOVE_LIQUIDITY`
- `NFT_MINT`

For MVP screens, expose only:

- `BUY`
- `SELL`
- `TRANSFER`
- `RECEIVE`
- `SEND`
- `FEE`
- `REWARD`

Keep advanced kinds import-only or hidden until DeFi support exists.

### Cost Basis

Do not ship a tax engine in MVP. Do store data needed later:

- acquisition timestamp
- source account
- destination account
- quantity
- fee quantity
- fiat value at transaction time
- market price source
- external transaction ID
- network/hash when imported

Future table:

- `crypto_lots`

Fields:

- `instrumentId`
- `accountId`
- `openedTransactionEntryId`
- `remainingAmountAtomic`
- `costBasisInstrumentId`
- `costBasisAmountAtomic`
- `acquiredAt`
- `methodSource`

The plan should leave tax-lot calculation off by default and add export/reporting before any in-app tax recommendations.

## Sync and Import Strategy

### Phase 1: Manual and CSV

Manual entry is the default path. CSV import is privacy-preserving and matches Budgie's existing importer.

Extend CSV columns:

- `crypto_asset`
- `crypto_quantity`
- `crypto_fee_asset`
- `crypto_fee_quantity`
- `native_amount`
- `native_currency`
- `network`
- `transaction_hash`
- `crypto_kind`

### Phase 2: Market Prices

Add a read-only market data service:

- Fetch by `marketDataId` for seeded assets.
- Fetch by contract address for token-specific assets later.
- Cache latest rates offline.
- Rate-limit refreshes.
- Never block app startup on price refresh.
- Show stale state in account details and net worth surfaces.

### Phase 3: Exchange Sync

Start with Coinbase because official APIs expose account transactions and read scopes. Coinbase transaction resources include account events, positive/negative amounts, native fiat amounts, buy/send types, network data, fees, and transaction IDs.

Do not use write/send scopes. Use read/view scopes only.

### Phase 4: Wallet Sync

Add public-address tracking by chain after exchange sync is stable.

Start with:

- Bitcoin address/xpub import only if the app can safely explain privacy implications.
- EVM public address import for ETH/ERC-20 balances and transactions.
- Solana public address import.

Do not collect seed phrases or private keys.

## UX Plan

### Account Creation

Modify:

- `packages/app/src/app/(main)/create-account/index.tsx`
- `packages/app/src/app/(main)/create-account/[type].tsx`
- `packages/app/src/account/component/create-crypto-account/create-crypto-account.tsx`
- `packages/app/src/account/component/create-liability-account/create-liability-account.tsx`
- `packages/app/src/@generic/component/create-account-currency-field/create-account-currency-field.tsx`

Behavior:

- Add "Crypto Wallet" to the account type list.
- Route `AccountTypeEnum.CRYPTO` to a crypto-specific create component.
- Limit the instrument selector to `InstrumentTypeEnum.CRYPTO`.
- Use "asset" wording instead of "currency" on crypto screens.
- Display quantity and estimated fiat value separately.
- Keep `includeInNetWorth` enabled by default.

### Account Details

Modify:

- `packages/app/src/app/(main)/account/[id]/details.tsx`
- `packages/app/src/account/component/account-balance/account-balance.tsx`
- `packages/app/src/account/component/account-card/account-card.tsx`
- `packages/app/src/account/component/account-card-base/account-card-base.tsx`

Behavior:

- Primary balance: asset quantity, such as `0.125 BTC`.
- Secondary value: estimated default-currency value, such as `$8,412.33`.
- Show price timestamp: `Price updated 14 min ago`.
- Show stale warning if price is old.

### Transactions

Modify transaction create/edit flows after the amount foundation is ready.

Behavior:

- For buys: debit crypto account quantity and credit fiat/bank account amount, with optional fee.
- For sells: credit crypto quantity and debit fiat/bank account amount, with optional fee.
- For transfers: move crypto quantity between crypto accounts without creating income/expense.
- For rewards: receive quantity and record fiat value at receipt time.
- For fees: reduce crypto quantity and attach the fee to the related transaction when possible.

## Implementation Tasks

### Task 1: Add Crypto Account Creation Surface

Files:

- Modify `packages/app/src/app/(main)/create-account/index.tsx`
- Modify `packages/app/src/app/(main)/create-account/[type].tsx`
- Create `packages/app/src/account/component/create-crypto-account/create-crypto-account.tsx`
- Modify `packages/app/src/account/component/create-liability-account/create-liability-account.tsx`

Steps:

- [ ] Add a crypto card to the account type list using `ACCOUNT_ICON.CRYPTO` and `AccountTypeEnum.CRYPTO`.
- [ ] Add a route case for `AccountTypeEnum.CRYPTO`.
- [ ] Create `CreateCryptoAccount` as one top-level component in its own folder.
- [ ] Pass `AccountTypeEnum.CRYPTO` into the existing liability account creation flow only after the instrument selector can filter to crypto assets.
- [ ] Run `yarn i18n:sync` because this introduces user-facing text.

### Task 2: Add Instrument Metadata and Crypto Seeds

Files:

- Modify `packages/contracts/src/instrument/table/instrument-entity.table.ts`
- Modify instrument interfaces and schemas under `packages/contracts/src/instrument/`
- Create `packages/contracts/src/instrument/enum/market-data-source.enum.ts`
- Modify `packages/contracts/src/index.ts`
- Add a Drizzle migration under `packages/app/drizzle/`

Steps:

- [ ] Add precision and market-data metadata to instruments.
- [ ] Backfill fiat instruments with precision 6 and display precision 2.
- [ ] Seed BTC, ETH, SOL, USDC, USDT, and BNB.
- [ ] Keep instrument codes unique.
- [ ] Add schema validation for crypto metadata only when `type === InstrumentTypeEnum.CRYPTO`.

### Task 3: Replace Fixed Micro-Unit Assumptions for Crypto Paths

Files:

- Modify `packages/app/src/@generic/utils/convert-to-micro-units.util.ts`
- Modify `packages/app/src/@generic/utils/convert-from-micro-units.util.ts`
- Create amount parsing and formatting utilities in the existing generic utility area only if they will have multiple consumers.
- Modify amount inputs that create crypto balances or crypto transaction entries.

Steps:

- [ ] Keep current fiat conversion behavior stable.
- [ ] Add exact quantity parsing for crypto based on selected instrument precision.
- [ ] Store crypto quantities without rounding to six decimals.
- [ ] Reject input with more decimals than the instrument supports.
- [ ] Format crypto quantities with instrument display precision.

### Task 4: Add Market Price Cache

Files:

- Modify `packages/contracts/src/exchange-rate/table/exchange-rate-entity.table.ts`
- Modify `packages/contracts/src/exchange-rate/repository/exchange-rate.repository.ts`
- Modify `packages/app/src/exchange-rate/service/exchange-rates.service.ts`
- Add a market data client/service in `packages/app/src/exchange-rate/` or a source-specific package if the codebase already has a clearer boundary at implementation time.

Steps:

- [ ] Add source, observed time, and stale-price semantics to exchange rates.
- [ ] Add a CoinGecko-backed price refresh service for seeded crypto assets.
- [ ] Cache prices locally and never require network for account rendering.
- [ ] Convert crypto balances into the default instrument using cached prices.
- [ ] Surface stale prices in UI.

### Task 5: Add Crypto Transaction Kinds

Files:

- Create `packages/contracts/src/crypto/enum/crypto-transaction-kind.enum.ts`
- Add associated schema/interface files only if the kind is persisted separately from existing transaction type.
- Modify transaction forms and services after Task 3 has landed.

Steps:

- [ ] Introduce crypto transaction kind values with uppercase enum keys and values.
- [ ] Map MVP kinds to existing transaction entry behavior.
- [ ] Store enough data for future tax lots and exports.
- [ ] Keep advanced DeFi kinds import-only until there is a UI design for them.

### Task 6: Extend Import and Export

Files:

- Modify `packages/app/src/import/service/importer.service.ts`
- Modify import interfaces under `packages/app/src/import/interface/`
- Modify export service under `packages/app/src/export/service/`

Steps:

- [ ] Add crypto CSV columns for asset, quantity, fee asset, fee quantity, native fiat amount, native fiat currency, network, transaction hash, and crypto kind.
- [ ] Import known assets by code and reject unknown assets with row-level errors.
- [ ] Preserve external IDs and transaction hashes.
- [ ] Export crypto entries with both quantity and fiat valuation fields.

### Task 7: Add Validation and E2E Coverage

Files:

- Add Maestro coverage under `tests/app-tests/` if the flows are user-visible and stable.
- Modify app selectors only where stable selectors are needed.

Steps:

- [ ] Verify creating a crypto account.
- [ ] Verify entering a crypto balance with eight decimal places.
- [ ] Verify net worth includes the estimated fiat value.
- [ ] Verify stale price messaging when cached prices are old.
- [ ] Run `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`.

## Testing Strategy

Code-level validation:

- Run `yarn format`.
- Run `yarn ts`.
- Run `yarn lint`.
- Run `yarn deadcode`.
- Run `yarn cpd`.

Manual app validation:

- Create BTC account with `0.00000001 BTC`.
- Create ETH account with a value below six decimals if high precision is supported.
- Confirm account card shows quantity and fiat estimate.
- Disable network and confirm cached balances still render.
- Refresh prices and confirm `exchange_rates` updates without blocking the app.
- Export and re-import a crypto CSV with fee and hash fields.

SQL validation:

- Use `EXPLAIN QUERY PLAN` for updated net-worth and account-total queries if repository SQL changes.
- Use the existing bench harness under `packages/app/scripts/` if account-balance queries are modified.

## Open Product Decisions

These are the only decisions that should be confirmed before implementation:

1. MVP source: manual plus CSV only, or manual plus CoinGecko prices in the first PR.
2. Precision scope: support BTC-style 8 decimals first, or implement full arbitrary precision for 18-decimal tokens immediately.
3. Tax posture: export factual transaction data only, or add an informational lots view without tax filing.
4. Sync posture: Coinbase first, or keep all exchange sync out of the first milestone.

## Recommended Milestone Split

### Milestone 1: Foundation

- Instrument metadata.
- Crypto seeds.
- Crypto account creation.
- Exact quantity parsing/formatting for account balances.
- No network dependency.

### Milestone 2: Valuation

- CoinGecko latest price cache.
- Default-currency valuation.
- Stale price UI.
- Net-worth integration.

### Milestone 3: Transactions

- Buy, sell, send, receive, transfer, fee, and reward kinds.
- CSV import/export.
- Fiat value snapshots at transaction time.

### Milestone 4: Sync

- Coinbase read-only sync.
- Balance reconciliation.
- Negative balance warnings.
- Transfer matching.

### Milestone 5: Advanced Portfolio

- Wallet address sync.
- DeFi classification.
- Cost-basis lots.
- Tax data export.
- Portfolio allocation analytics.

## Recommendation

Implement Approach B in milestones. The first implementation PR should stop after Milestone 1 unless the team accepts the extra scope of market prices. Shipping crypto account creation without exact quantity support would look fast but would be technically misleading, because the current six-decimal amount model cannot accurately represent important crypto balances and fees.

