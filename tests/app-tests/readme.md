# Budgie App Tests

Fixtures and scripts for Budgie's end-to-end tests. The tests live in
[`e2e/`](../../e2e): a [tester-army e2e](https://github.com/tester-army/e2e)
project that drives iOS simulators leased from the Mac Studio simlock farm, from
Linux. See [E2E-RUNBOOK.md](./E2E-RUNBOOK.md) to run it and [AGENTS.md](./AGENTS.md)
for the conventions.

## CI/CD

`pr.yml` runs the e2e suite (`e2e/tests`) on every pull request that touches the
app, through rnw-community/mobile-ci's `ios-maestro.yml` with `test-framework: e2e`:
the repacked or built app goes to a Linux runner that leases simulators from the farm.

Bank import tests use committed sanitized statement fixtures from
`tests/app-tests/fixtures/erste/` and `tests/app-tests/fixtures/privatbank/`.

## Landing media pipeline

Captures the App Store screenshot set a second time for the landing site's
own stills, driven by `.github/landing-media.config.json` (the same
mobile-ci schema as the store config, iPhone 17 Pro Max only).

```bash
SIMLOCK_URL=... SIMLOCK_TOKEN=... pnpm media:capture --app <Base.app>   # any host; e2e/ needs `npm ci`
pnpm media:compose
pnpm media:manifest
```

`media:capture` runs `capture-store-screenshots.sh` against that config, which
captures through the e2e project's media capture (`e2e/media.config.ts`) on
simulators leased from the farm, raw
output under `packages/app/fastlane/screenshots/landing-raw/` (gitignored).
`media:compose` frames stills into
`packages/landing/public/media/<slug>/<locale>/<theme>/`: a still is
`<scene>@2x.{avif,webp}`. `<slug>` drops the scene name's trailing `-<n>`, so
`voice-transaction-entry-1` lives under the `voice-transaction-entry` route.
`media:manifest` validates the encoded variants and slugs the pages reference.

A scene may carry a state overlay on top of the showcase database:
`fixtures/screenshots/scenes/<scene-id>.sql`, falling back to `<slug>.sql`,
usually just `.read shared/<state>.sql`.

To add a scene: one `capture-scenes` entry (`deepLink` for a still, `test`
when the state needs interaction) plus an overlay `.sql` file only if the
default data isn't enough. A `test` names an entry of `SCENES` in
`e2e/support/media/scenes.ts`: the walk from a freshly launched, seeded app to
the screen, built from the e2e suite's own steps (`e2e/support/budgie/`), never by
re-implementing navigation. The capture writes exactly one PNG per cell (and a
`<scene>.mp4` beside it for a scene that records).

`.github/workflows/media-smoke.yml` runs every scene in `SCENES` the e2e build
can drive once per PR touching them and nightly, seeding each scene (`en`/`dark`)
through `seed-screenshot-scene.sh`; the captures ship in the run's e2e report
artifact under `media/raw/ios/iphone-17-pro/en/dark/`. `pr.yml`'s
`detect-mobile-impact` keeps those same paths out of the full iOS suite.
`store-screenshots.yml` captures the store set the same way, through
mobile-ci's `store-screenshots.yml` with `test-framework: e2e`.

The capture reads the device's own pixels (`simctl io screenshot`'s bytes), which
screenshot protection does not blank, so a scene seeded with
`is_screenshot_protection_enabled = 1` still captures normally.
`pin-app-lock-1` carries its own `scenes/pin-app-lock-1.sql` overlay, which turns
the PIN and biometric flags on and leaves screenshot protection off, so the lock
screen it shows is the plain one.

The consolidation-source modal lists `transaction_entries` whose
`original_transaction_id` points at a source transaction, so a seed that only
sets `consolidation_parent_transaction_id` renders its empty state. That is what
`scenes/transfer-pair-detection-2.sql` fixes: it moves the paired legs onto the
canonical transfer the way `moveToConsolidatedTransaction` does, leaving
`shared/transfer-pair.sql` untouched for the scenes that want the loose pair.

Two scene overlays exist only because a picker's option ids are localized.
`shared/recurring.sql` pins three subscriptions to the 15th of every month so
`recurring-payments-calendar-2` can tap `RecurringCalendar.Day.CurrentMonth.15`
in every locale, and `mcc-auto-category-2` searches the category picker for
`restaurants`, which matches `categories.title_search` — the English title kept
on the row while `default_category_translations` supplies the displayed one.

A seeded database is plain SQLite and the PIN lives in SecureStore, so no PIN
unlocks a seeded lock screen. Every scene behind the lock — the Settings security
card with App Lock active — stays unreachable until
the seed hook can produce a SQLCipher database with a known key; the simulator
also has no enrolled Face ID, which the biometric rows are gated on.
