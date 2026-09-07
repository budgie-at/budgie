# Budgie App Tests

End-to-end tests for the Budgie expense tracking app using [Maestro](https://maestro.mobile.dev/).

## Running Tests Locally

### Prerequisites

- Install Maestro CLI 2.6.0: `export MAESTRO_VERSION=2.6.0; curl -fsSL "https://get.maestro.mobile.dev" | bash`
- iOS Simulator or Android Emulator running
- App installed on the simulator/emulator

### Commands

iOS:

```bash
sh ./scripts/run-maestro-suite.sh com.vitalyiegorov.budgie.e2e
```

Local bank statement import flows:

```bash
sh ./scripts/setup-ios-e2e-fixtures.sh
maestro test ./flows/16.erste-pdf-import.flow.yaml \
  -e APP_ID=com.vitalyiegorov.budgie.e2e
maestro test ./flows/23.privatbank-xlsx-import.flow.yaml \
  -e APP_ID=com.vitalyiegorov.budgie.e2e
```

Bank import flows use committed sanitized statement fixtures from `tests/app-tests/fixtures/erste/` and `tests/app-tests/fixtures/privatbank/`.

Android:

```bash
sh ./scripts/run-maestro-suite.sh com.vitaliiyehorov.budgie.e2e
```

## CI/CD

E2E tests run automatically on pull requests via the GitHub Actions workflow (`.github/workflows/pr.yml`).
Tests execute on both iOS (macos-latest) and Android (ubuntu-latest) after code quality checks pass.

## Landing media pipeline

Captures the App Store screenshot set a second time for the landing site's
own stills and clips, driven by `.github/landing-media.config.json` (the same
mobile-ci schema as the store config, iPhone 17 Pro Max only).

```bash
pnpm media:capture   # Mac, packages/app built with APP_VARIANT=e2e
pnpm media:compose
pnpm media:manifest
```

`media:capture` runs `capture-store-screenshots.sh` against that config, raw
output under `packages/app/fastlane/screenshots/landing-raw/` (gitignored).
`media:compose` frames stills and encodes clips into
`packages/landing/public/media/<slug>/<locale>/<theme>/`: a still is
`<scene>@2x.{avif,webp}`, a clip is `<scene>.{webm,mp4}` plus
`<scene>-poster.webp`. `<slug>` drops the scene name's trailing `-<n>` (and,
for clips, the `-clip` before it), so `voice-transaction-entry-clip-1` and
`voice-transaction-entry-1` share the `voice-transaction-entry` route.
`media:manifest` validates the encoded variants and slugs the pages reference.

A scene may carry a state overlay on top of the showcase database:
`fixtures/screenshots/scenes/<scene-id>.sql`, falling back to `<slug>.sql`,
usually just `.read shared/<state>.sql`.

To add a scene: one `capture-scenes` entry (`deepLink` for a still, `flow`
when the state needs interaction) plus an overlay `.sql` file only if the
default data isn't enough. A flow takes exactly one `takeScreenshot`; a clip
adds one `startRecording`/`stopRecording` pair after it and is named
`<slug>-clip-<n>`. Flows reach their state by `runFlow`ing the E2E subflows
under `flows/subflows/`, never by re-implementing navigation.

`.github/workflows/media-smoke.yml` runs every `flows/media/*.flow.yaml` once
per PR touching them and nightly, on one shard, seeding each flow's scene
(`en`/`dark`) through `seed-screenshot-scene.sh` as mobile-ci's
`pre-flow-command`. `pr.yml`'s `detect-mobile-impact` keeps those same paths
out of the full iOS suite. `pin-app-lock-clip-1` is excluded until #697 makes
the seed hook produce a SQLCipher database for lock-flag scenes. `ai-auto-categorization-clip-1`
is excluded because the smoke job's e2e build sets `EXPO_PUBLIC_AI_DISABLE=true`
(see #700), which cannot exercise the on-device AI categorization the clip
records; it stays in `landing-media.config.json` for local capture against an
AI-enabled build (see #718). There is no
CSV import clip: the flow recorded the iOS Files picker, which both needs
E2EFixtures on the CI runner and exposes `01.db`…`09.db` fixture filenames.

Screenshot protection blanks Maestro's `takeScreenshot`, not `simctl io
screenshot`. A `deepLink` scene seeded with `is_screenshot_protection_enabled = 1`
captures normally, so `screenshot-protection-1` shows the switch in its enabled
state; a `flow` scene under the same flag returns an all-black frame. That is why
`pin-app-lock-1` carries its own `scenes/pin-app-lock-1.sql` overlay, which turns
the PIN and biometric flags on and leaves screenshot protection off, instead of
reusing `shared/security-locked.sql`.

Two scene overlays exist only because a picker's option ids are localized.
`shared/recurring.sql` pins three subscriptions to the 15th of every month so
`recurring-payments-calendar-2` can tap `RecurringCalendar.Day.CurrentMonth.15`
in every locale, and `mcc-auto-category-2` searches the category picker for
`restaurants`, which matches `categories.title_search` — the English title kept
on the row while `default_category_translations` supplies the displayed one.

A seeded database is plain SQLite and the PIN lives in SecureStore, so no PIN
unlocks a seeded lock screen. Every scene behind the lock — the Settings security
card with App Lock active, `biometric-authentication-1` — stays unreachable until
the seed hook can produce a SQLCipher database with a known key; the simulator
also has no enrolled Face ID, which the biometric rows are gated on.

## Future Test Coverage

- [ ] Multiple account types (Savings, Debt)
- [ ] Income transactions
- [ ] Transfer transactions
- [ ] Transaction editing and deletion
- [ ] Category and tag management
- [ ] Analytics screen verification
- [ ] Settings and preferences
