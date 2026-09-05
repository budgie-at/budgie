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

## Regenerating

```bash
# rebuild showcase.db after editing showcase.sql or pulling new migrations
tests/app-tests/fixtures/screenshots/build-showcase.sh

# inspect one locale offline, without a simulator
LOCALE=de APPEARANCE=dark tests/app-tests/scripts/seed-screenshot-scene.sh --dry-run --output /tmp/de.db

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
