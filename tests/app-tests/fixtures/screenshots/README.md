# Store screenshot fixtures

Seeded app state for App Store / Play Store screenshot capture. Consumed by
`tests/app-tests/scripts/seed-screenshot-scene.sh`, which mobile-ci's
`store-screenshots.yml` runs as its `seed-command` once per
`locale x appearance x scene` cell.

## Files

| File | Purpose |
| --- | --- |
| `showcase.db` | The curated dataset. Committed, fully migrated, anchored on 2026-09-01. |
| `showcase.sql` | The SQL that produces `showcase.db` from the base fixture. |
| `build-showcase.sh` | Regenerates `showcase.db`: base fixture -> pending migrations -> `showcase.sql` -> `VACUUM`. |
| `shift-dates.sql` | Re-anchors every date on the capture day and re-points the monthly budget periods. |
| `en.sql` `fr.sql` `de.sql` `es.sql` `uk.sql` | Locale overlays: user-visible strings and display currency. |
| `scenes/scene-overlays.json` | Scene id -> overlay names. The only place a scene is bound to extra state. |
| `scenes/<overlay>.sql` | Scene overlays: the app states the store fixture deliberately does not cover. |

## Dataset

Single-currency, single-user, no debt or sync noise:

- **4 accounts** — `Main Checking` (id 1, `BANK`, the account
  `budgie://account/1/details` opens), `Cash Wallet` (`CASH`),
  `Emergency Savings` (`SAVINGS`) and `Travel Card` (`BANK`, ends negative).
  Visible balances are ~4 862 / 186 / 12 450 / -643 in the base currency and
  are produced by an `account_balances` opening snapshot dated before the
  ledger, so they stay correct as transactions shift.
- **81 transactions** over the last 45 days — 75 expenses across 18
  categories, 3 incomes (two payrolls, one freelance invoice) and 3 transfers.
  Roughly two per day for the most recent 30 days so the transaction list and
  the account detail screen are dense.
- **39 categories** — the app's own default set. Their titles are **not**
  translated in the overlays: the app resolves them through
  `default_category_translations`, which already ships all five locales.
- **5 tags** on 25 transactions.
- **2 monthly budgets** — one lands at ~89-95 % of its overall limit, the other
  at ~60-65 %. Both are exactly fully allocated
  (`overall_limit = sum(category limits) + other_limit`), so the app never
  renders the over-allocation warning.

Amounts are micro-units (`PRECISION = 1_000_000`); dates are epoch seconds.

## Dates

The dataset is authored against a fixed anchor and `shift-dates.sql` moves it
by whole days so the newest transaction lands on the capture day. That keeps
"today", "this month" and the budget periods populated whenever capture runs,
and preserves each row's time of day. Running the shift twice is a no-op.

`shift-dates.sql` also rewrites `budgets.period_start_day` so the current
monthly period is always 20-23 days old. Without it, a capture on the 1st of a
month would show every budget reset to zero.

## Locale overlays

| Locale | Currency | Instrument | Amount scale | Sample merchants |
| --- | --- | --- | --- | --- |
| `en` | USD | 1 | 1x (base) | Whole Foods Market, Uber, Trader Joe's |
| `fr` | EUR | 2 | 0.92x | Carrefour Market, Navigo RATP, Monoprix |
| `de` | EUR | 2 | 0.92x | REWE, Deutsche Bahn, EDEKA |
| `es` | EUR | 2 | 0.92x | Mercadona, Renfe Cercanias, Cabify |
| `uk` | UAH | 33 | 15x, rounded to whole hryvnia | Silpo, Nova Poshta, Uklon |

Each overlay rewrites account titles, tag titles, budget names and every
transaction title, and repoints `accounts`, `budgets` and
`settings.default_instrument_id` at that locale's instrument. `uk` also turns
`show_cents` off because hryvnia amounts read better without them.

Overlays deliberately do **not** set `settings.language` or `settings.theme` —
the seed hook owns both, because the same overlay is reused for the `light` and
`dark` cells.

## Scene overlays

The store pipeline needs one dataset. The landing media pipeline needs about
twenty, because a feature page about debt tracking cannot be screenshotted
against a fixture with no debt. Scene overlays are how a scene asks for extra
state without forking `showcase.db`.

### The contract

1. `seed-screenshot-scene.sh` reads `scenes/scene-overlays.json`, a committed
   map of scene id to overlay names:

   ```json
   {
       "debt-tracking-1": ["debt"],
       "home-hero-1": ["multi-currency", "deposit", "crypto", "debt", "net-worth-full"]
   }
   ```

   The map lives here, not in `.github/store-screenshots.config.json` or
   `.github/landing-media.config.json`, so those files stay in mobile-ci's own
   schema and carry no Budgie-specific keys. The lookup key is the `SCENE`
   environment variable mobile-ci already passes, so nothing else changes.

2. A scene with **no entry** behaves exactly as it did before overlays existed.
   All seven store scenes are in that bucket and their seeded database is
   asserted byte-identical to the pre-overlay pipeline by
   `test-seed-screenshot-scene.sh`.

3. A scene that names an overlay whose `scenes/<name>.sql` is missing is a
   **hard failure**, not a silent skip. A blank screenshot discovered three
   hours into a capture run is much more expensive than a failed seed.

4. Overlays listed for a scene are applied **in order**, so a stack composes:
   `net-worth-full` finishes what `multi-currency`, `deposit`, `crypto` and
   `debt` started.

Scene ids are the storyboard's own names, because the landing capture config
looks scenes up by them. The one exception is `rules-1`: the rules engine has
no landing feature page yet (tracked separately), so `rules.sql` is parked
under a provisional scene id until that page and its storyboard row land.
Rename it together with the config when they do.

### Ordering: overlays run last

Overlays are applied **after** `shift-dates.sql` and after the hook's own
`settings` write. Two reasons:

- `shift-dates.sql` computes its delta from `MAX(operated_at)`. An overlay that
  inserted a row dated "today" *before* the shift would collapse the delta to
  zero and freeze the whole base dataset at its 2026-09-01 anchor.
- Running after the settings write is what lets `security-locked.sql` turn the
  lock flags back on (see below).

Because they run last, overlays are authored **relative to `now`**
(`unixepoch(date('now')) - N * 86400 + M * 60`, or `date('now', '-N months')`),
never against the fixture's anchor. That makes the ordering irrelevant in
practice: an overlay produces the same rows whenever it runs.

Every overlay is **idempotent**. Each one deletes its own id range before
inserting, so running it twice — or listing it twice in a stack — is a no-op,
matching `shift-dates.sql`'s existing guarantee. The self-test asserts this for
every overlay in every locale.

### Locale awareness

Overlays read `settings.language` (already written by the hook at that point)
and branch on it, exactly like the `<locale>.sql` files do:

- **User-visible text** is carried as a per-locale `CASE`, with native-quality
  fr / uk / de / es copy, not machine translation of the English.
- **Fiat amounts** are scaled with the same factors the locale overlays use —
  `1x` for `en`, `0.92x` for `fr`/`de`/`es`, `15x` for `uk` — and rounded to
  the same unit (whole cents, or whole hryvnia for `uk`).
- **Amounts already denominated in another unit** are *not* scaled: crypto
  holdings are coin micro-units, and the foreign-currency accounts in
  `multi-currency.sql` are already in their own currency.
- **Category titles** are never translated here. The app resolves them through
  `default_category_translations`, which already ships all five locales.

### Reserved id ranges

Overlays own fixed id ranges so they compose without colliding, and so capture
flows and deep links can address a seeded row by id.

| Overlay | Accounts | Transactions | Other |
| --- | --- | --- | --- |
| `budget-near-limit` | — | 1000-1099 | rewrites budget 1 |
| `multi-currency` | 5, 6 | 1100-1199 | `exchange_rates` 101-102 |
| `debt` | **7** (lent), 11 (borrowed) | 1200-1299 | `debt_events` 1-9 |
| `deposit` | **8** | 1300-1399 | — |
| `crypto` | **9** (BTC), 10 (XMR) | 1400-1499 | `exchange_rates` 103-106, daily prices |
| `bank-sync-connected` | 12-14 | **9000-9099** | `bank_integrations` 1, `bank_syncs` 1-3 |
| `uncategorized` | — | 1600-1699 | — |
| `tags-rich` | — | 1700-1799 | `tags` 10-15 |
| `split-transaction` | — | 1800-1899 | — |
| `recurring` | — | 1900-1999 | — |
| `refund` | — | 2000-2099 | — |
| `transfer-pair` | — | 2100-2199 | — |
| `archived` | 16-18 | 2200-2299 | — |
| `bank-fees` | — | 2300-2399 | — |
| `import-presets` | 19 | 2400-2499 | `bank_integrations` 2 |
| `long-history` | — | 3000-6999 | — |
| `cyrillic-taxonomy` | — | — | `categories` 100-104, `tags` 20-23 |
| `rules` | — | — | `rules` 1-5 |
| `security-locked` | — | — | `settings` only |
| `net-worth-full` | — | — | updates only |

`account_balances` ids are `100 + account_id`; `transaction_entries` ids are
`transaction_id * 10 (+ n)`, which keeps them disjoint by construction.

Bold ids are addressed directly by the landing capture config: debt account 7,
deposit account 8, crypto account 9, and the MCC-categorised transaction 9001.
Do not renumber them without updating `.github/landing-media.config.json`.

### What each overlay seeds

| Overlay | State it produces |
| --- | --- |
| `budget-near-limit` | Budget 1 pinned active at exactly 95% of its overall limit with Groceries at ~114% of its category limit, period ~28 days in. Limits are derived from real in-period spend, so the ratio holds in every locale and on every capture day. |
| `multi-currency` | Two accounts in the two currencies the locale does not use, so every locale has three live currencies, plus the EUR<->UAH rate pair the base fixture never carried and one cross-currency transfer with both legs. |
| `debt` | A lent debt (account 7) and a borrowed debt (11), each with `debt_events`, and a partial settlement against the lent one. |
| `deposit` | A 12-month term deposit (account 8) with maturity date, 4.35% rate, target balance and eight monthly interest credits. |
| `crypto` | BTC and XMR wallets (accounts 9, 10) with CoinGecko-style instruments, `exchange_rates` into the display currency and a 90-day daily price series ending today. |
| `bank-sync-connected` | A connected Monobank integration: token row, two synced cards plus a jar, per-account `bank_syncs` with a four-minute-old `forward_synced_at` and a resync window, and seven imported transactions carrying `external_id` + MCC with `category_source = 'MCC_DEFAULT'`, one of them with a fee. |
| `uncategorized` | Nine recent transactions whose entries have `category_id IS NULL`. |
| `tags-rich` | Six extra tags, a multi-tagged recent week, and the new tags spread across the existing ledger so the Tags analytics tab has a full month of volume. Every tagged transaction keeps exactly one primary tag. |
| `split-transaction` | A supermarket receipt split three ways and a household purchase split two ways. |
| `recurring` | Eight monthly subscription series, seven months deep on a fixed day of month, shaped to satisfy the recurring detector's month-count, amount-variance and day-concentration rules. |
| `rules` | Five categorisation rules with conditions and action pills, including a deliberate conflict (two rules matching the same merchant, setting different categories) and one disabled rule. |
| `security-locked` | `is_pin_enabled`, `is_biometric_enabled` and `is_screenshot_protection_enabled` all on. |
| `refund` | An unconsolidated purchase/partial-refund pair for the convert-to-refund flow, plus an already-consolidated `REFUND` transaction with its two sources for the consolidation-source sheet. |
| `transfer-pair` | An unconsolidated expense/income pair for the convert-to-transfer flow, plus a canonical `TRANSFER_PAIR` transaction with its two sources. |
| `archived` | Two archived accounts (`deleted_at IS NOT NULL`) and one inactive one (`is_active = 0`), each with a balance and a short history. |
| `long-history` | 18 months of ledger: the newest 40 base rows replayed once per month for 17 months with a deterministic drift, so date presets, monthly trends and pattern detection all have data. |
| `net-worth-full` | Finishes the hero stack: every live account in net worth, section-ordered Bank / Cash / Savings / Deposit / Crypto / Debt, fresh rate timestamps. |
| `bank-fees` | `FEE` entries on an expense, an income and — the point of the page — a transfer, all under Bank Fees & Charges. |
| `cyrillic-taxonomy` | Custom categories and tags in the user's own language with `title_en` and `title_tags` already populated, so the AI-translation fields render the finished state with no inference and no AI build. |
| `import-presets` | A file-import `CSV` integration, a linked account and previously imported rows carrying `external_id`. The preset chips themselves are app constants (`import/constant/import-presets.constant.ts`), not database rows — this overlay seeds the surrounding state a repeat import needs. |

### Capture contract for `security-locked`

The seed hook zeroes the three lock flags for every scene that declares no
overlay, and `verify_database` asserts that. Once a scene declares any overlay
the assertion is dropped, because `security-locked.sql` deliberately turns them
on.

Turning them on has a consequence the capture flow must handle. The PIN is not
a database row: `auth.service.ts` keeps it in the iOS keychain and `db.ts` feeds
it to `PRAGMA key`, so the PIN also **encrypts the database**. The seeded
database is plaintext and the keychain is empty, so `verifyPin` can never match
and no deep link walks past the lock screen. A scene using this overlay must
either capture the lock screen itself, or run a flow that creates the PIN
through the app (`budgie://settings/pin?mode=CREATE`) — which rekeys the
database — before navigating to the screen being captured.

## Regenerating

```bash
# rebuild showcase.db after editing showcase.sql or pulling new migrations
tests/app-tests/fixtures/screenshots/build-showcase.sh

# inspect one locale offline, without a simulator
LOCALE=de APPEARANCE=dark tests/app-tests/scripts/seed-screenshot-scene.sh --dry-run --output /tmp/de.db

# inspect a scene's overlay stack offline
SCENE=home-hero-1 LOCALE=uk APPEARANCE=light tests/app-tests/scripts/seed-screenshot-scene.sh --dry-run --output /tmp/hero.db

# self-test every locale and appearance (also runs in CI via pr.yml)
tests/app-tests/scripts/test-seed-screenshot-scene.sh
```

`build-showcase.sh` starts from `../29.db` — the largest committed E2E fixture
and the one with the most complete schema (all 233 instruments, 1 088 MCC
categories, 39 default categories with their five-language translations, the
`sqlite-vec` embedding tables). It then applies every Drizzle migration the
base fixture has not run yet, straight from `packages/app/drizzle`, and records
them in `__drizzle_migrations`, so the app boots with nothing left to migrate.
That matters: `0036`-`0044` include data-repair migrations that would otherwise
run over the curated rows.

`showcase.sql` also drops all but the last anchor year of
`historical_exchange_rates` for USD/EUR/UAH. The dataset is single-currency in
every locale, so the base fixture's 15 years of FX history was 10 MB of the
12 MB file and nothing rendered it.
