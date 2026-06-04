# Crypto Accounts Design

Date: 2026-06-04

## Goal

Budgie should support manual crypto accounts in the mobile app. A user can create separate crypto accounts for each place they hold an asset, such as `BTC Cold Wallet`, `BTC Binance`, and `BTC WhiteBIT`, even when those accounts share the same `BTC` instrument.

Each crypto account is manual in v1. Budgie tracks the native asset balance entered by the user, values that balance in the user's default fiat instrument using real exchange rates, includes the valued amount in total net worth, and keeps the existing main-screen account layout intact.

## Non-Goals

- Do not implement exchange imports from Binance, WhiteBIT, wallets, or chains.
- Do not implement buy, sell, or crypto transfer transaction screens in this phase.
- Do not redesign the main screen beyond the approved summary chips and crypto account secondary amount.
- Do not introduce instrument-specific decimal precision in this phase.
- Do not add Jest, Vitest, or other unit-test workspaces.

## Existing Context

The repo already has most of the domain shape needed for crypto:

- `AccountTypeEnum.CRYPTO` exists in `@budgie/contracts`.
- `InstrumentTypeEnum.CRYPTO` exists in `@budgie/contracts`.
- Accounts already reference `instrumentId`, so multiple accounts can share one instrument.
- The home page already groups account cards by account type.
- Account labels, colors, and icons already include crypto.
- Net worth and account-type totals already convert account balances through the `exchange_rates` and `historical_exchange_rates` tables.

The current gaps are:

- The create-account route does not expose `AccountTypeEnum.CRYPTO`.
- `CreateLiabilityAccount` only accepts `BANK | CASH`.
- `accountService.create` creates accounts as `AccountNatureEnum.LIABILITY`, so crypto needs its own asset-account creation path.
- `CurrencySelector` is hard-coded to `InstrumentTypeEnum.FIAT`.
- Initial migrations seed fiat instruments only.
- The existing exchange-rate sync is fiat-oriented and uses a fiat rate provider.

## Product Behavior

### Create Crypto Account

The create-account type screen gets a `Crypto Account` option.

The crypto account form collects:

- account name and icon
- crypto instrument
- current native balance
- include in net worth

The default title is `Crypto Account`. The default icon uses the existing crypto account icon. The default crypto instrument should be `BTC` when available. If `BTC` is not available, the first crypto instrument sorted by code is selected.

The form must use a crypto instrument selector, not the fiat currency selector. User-facing strings must use Lingui macros following the repo rules.

### Main Screen

The existing layout, account cards, section headers, colors, spacing, typography, and navigation remain unchanged.

Budgie adds only the approved summary-chip behavior below net worth:

- Show no chips for fiat-only users.
- Show no chips for crypto-only users.
- Show two chips only when the user has at least one active fiat account and at least one active crypto account that are both included in net worth.
- The chips are summaries, not filters.
- The chips use icon plus amount only. No label text appears inside the chip.
- The fiat chip uses a fiat-style icon and the fiat total valued in the default instrument.
- The crypto chip uses a crypto-style icon and the crypto total valued in the default instrument.

Net worth remains the single total across all included accounts.

### Crypto Account Cards

Crypto cards continue to use the existing account-card layout.

The primary amount is the valued balance in the default fiat instrument. The secondary amount shows the native balance and instrument code, for example:

```text
$8,930
0.094 BTC
```

Crypto cards are account-specific. Budgie does not merge accounts with the same crypto instrument on the main screen.

## Data Model

### Instruments

Seed a small, explicit v1 crypto instrument list:

- `BTC`, name `Bitcoin`, symbol `₿`, provider id `bitcoin`
- `ETH`, name `Ethereum`, symbol `Ξ`, provider id `ethereum`
- `USDT`, name `Tether`, symbol `₮`, provider id `tether`
- `USDC`, name `USD Coin`, symbol `USDC`, provider id `usd-coin`
- `SOL`, name `Solana`, symbol `◎`, provider id `solana`
- `BNB`, name `BNB`, symbol `BNB`, provider id `binancecoin`
- `TON`, name `Toncoin`, symbol `TON`, provider id `the-open-network`

The existing `instruments` table has `type`, `code`, `name`, and `symbol`, but no provider-specific external id. The implementation should add a crypto-provider mapping in the app layer as a module constant used by the crypto rate sync. This avoids a schema migration for provider metadata in v1 while keeping the mapping explicit and typed.

If the repo later needs user-added coins or multiple providers, a provider id column can be introduced then.

### Accounts

Add a crypto account create input in contracts. It should derive from `AccountEntitySchema` like the existing create inputs, but it must narrow the allowed shape:

- `type` is `AccountTypeEnum.CRYPTO`
- `nature` is not user-settable and is created as `AccountNatureEnum.ASSET`
- `debtType`, `deadline`, `contactId`, `externalSource`, `externalId`, `iban`, and `targetBalance` are not user-settable for crypto v1
- `currentBalance` is nonnegative
- `includeInNetWorth` is optional and defaults to `true`
- `isActive` is optional

Add an `accountService.createCrypto` path instead of reusing `accountService.create`, because the current shared path sets `nature: AccountNatureEnum.LIABILITY`.

### Precision

Use Budgie's existing micro-unit precision for v1. This means native crypto balances are stored with six decimal places.

This is acceptable for manual v1 holdings and keeps the ledger, balance cache, imports, and formatting model stable. A future `instrument.precision` migration can support satoshi-level precision if needed.

## Exchange Rates And Valuation

### Provider

Use CoinGecko's simple price endpoint for crypto prices. The endpoint supports querying prices for one or more coin ids in one or more target currencies:

- https://docs.coingecko.com/reference/simple-price

For v1, query only crypto instruments present in active accounts and only the user's default fiat code as `vs_currencies`.

### Sync Shape

Add a crypto exchange-rate sync service alongside the current fiat sync service.

The service:

- resolves the default instrument
- skips when the default instrument is not fiat
- finds active crypto accounts included in net worth
- deduplicates their crypto instrument ids
- maps instruments to CoinGecko ids through the explicit mapping constant
- fetches prices in one batched request
- writes crypto-to-default and default-to-crypto rates to `exchange_rates`

Store rates in the existing `exchange_rates` table so current net-worth conversion can reuse the same path.

The sync should run during app initialization and can share the existing background sync cadence if that is the least invasive implementation. Crypto sync failures should not block app startup.

### Offline And Failure Behavior

Budgie is offline-first:

- If sync succeeds, update current crypto valuations.
- If sync fails and previous rates exist, continue using the last stored rates.
- If no rate exists, still show the native crypto balance.
- If no rate exists, do not value crypto with the existing `1.0` SQL fallback. A missing crypto rate is an unavailable valuation, not a one-to-one exchange rate.
- If a crypto account has no available rate, its primary valued amount displays an unavailable state and its native balance remains visible.
- Net worth and crypto chip totals include only crypto balances that have a direct or inverse stored rate to the default fiat instrument. They continue to include the last stored rate while offline.

Manual account creation must not be blocked by rate availability.

## Query Design

Add a home-summary totals query that returns enough information for the chip row:

- fiat included account count
- fiat total valued in default instrument
- crypto valued account count
- crypto total valued in default instrument

The query should count only active, non-deleted, included-in-net-worth accounts.

For v1, crypto totals include accounts with `AccountTypeEnum.CRYPTO` only when a direct or inverse stored rate exists for that account's instrument and the default fiat instrument. The implementation may join instruments and compute by `InstrumentTypeEnum.CRYPTO` internally if that keeps future non-fiat asset support cleaner, but visible behavior is crypto-only for this phase.

The chip row renders only when both counts are positive.

## Component Boundaries

Expected implementation areas:

- `packages/contracts/src/account`: crypto create schema and input type
- `packages/app/drizzle`: migration to seed crypto instruments
- `packages/app/src/account`: create crypto account component, route handling, service method, account-card secondary crypto amount
- `packages/app/src/@generic/component`: selector generalization from fiat-only to instrument-type-aware selection if needed
- `packages/app/src/instrument`: queries for crypto instruments by type
- `packages/app/src/exchange-rate`: crypto provider API, service, and sync integration
- `packages/app/src/account/query`: home summary totals query for fiat and crypto chips

Do not add single-use utility files to satisfy lint. Keep helpers private to the owning class or component unless two or more consumers need the same logic.

## Validation

Implementation must run the repo validation sequence unless the user explicitly narrows it:

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```

If user-facing strings change, run:

```bash
yarn i18n:sync
```

Manual verification should include:

- fiat-only account set shows the existing main screen with no chips
- crypto-only account set shows no chips and includes crypto accounts in net worth
- mixed fiat and crypto account set shows two icon-only chips under net worth
- multiple `BTC` accounts remain separate cards
- crypto account card shows default-currency value and native balance
- app remains usable with network disabled after rates have been cached
- app remains usable when no crypto rate exists yet

## Approved Direction

The approved v1 is manual crypto accounts with real valuation and total net worth integration. The only main-screen UX addition is conditional icon-plus-amount chips below net worth. All other app styles remain the current Budgie styles.
