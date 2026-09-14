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

### AI scenes need the AI capture build

Every flow under `flows/media/ai-build/` needs a binary built **without**
`EXPO_PUBLIC_AI_DISABLE`. On the store/e2e build `app.config.js` drops the
`llama.rn` and `react-native-audio-api` plugins and sets
`extra.aiEnabled = false`, which unmounts the Settings → AI group, the voice
entry button and every suggestion pill, so those flows can only fail there.
Run `.github/workflows/ios-e2e-ai-build.yml` (`workflow_dispatch`) and install
its `ios-e2e-app-e2e-ai` artifact; the Mac Studio cannot build Release locally
(#961).

`on-device-ai-budget-app-1` captures on that build with AI consent left off:
the group mounts from the build flag alone, so it needs no models and the app
stays stable. It carries its own `settleSeconds` because the AI build's first
paint is well past the 6 s default.

The five scenes that need live inference — `voice-transaction-entry-1`/`-2`,
`ai-auto-categorization-1`, `ai-transaction-suggestions-1` and
`ai-tag-suggestions-1` — are parked with `"locales": []`, which keeps their
flows covered by `test-landing-media-config.sh` while capturing nothing. They
stay blocked on #1037: granting consent makes `bootModels()` load Qwen3,
nomic-embed and Whisper concurrently under `use_mlock`, and the simulator
force-quits the app at ~3.5 GB RSS (also at ~2.7 GB with Whisper stubbed out)
before any cell can settle. Unpark them once #1037 lands, staging the models
first so no run waits on the ~2.5 GB download:

```bash
xcrun simctl install <udid> Base.app
xcrun simctl privacy <udid> grant microphone com.vitalyiegorov.budgie.e2e
bash tests/app-tests/scripts/stage-ai-models.sh <udid> com.vitalyiegorov.budgie.e2e
```

`stage-ai-models.sh` clones Qwen3 1.7B Q4_K_M (1.11 GB), nomic-embed-text-v2-moe
Q8_0 (0.51 GB) and Whisper large-v3-turbo Q8_0 (0.87 GB) from a local cache into
the container's `Documents/` (Whisper into `Documents/ai-models/`), which is
exactly where `download-model.util.ts` and `whisper-model.service.ts` look before
downloading. Fetch that cache once from the URLs in
`packages/app/src/ai/util/ai-constants.util.ts` and
`packages/app/src/ai/constant/whisper-model.constant.ts`. Staging must follow
`simctl install`: installing a different build creates a new data container and
drops anything staged into the old one.

`.github/workflows/media-smoke.yml` runs every `flows/media/*.flow.yaml` once
per PR touching them and nightly, on one shard, seeding each flow's scene
(`en`/`dark`) through `seed-screenshot-scene.sh` as mobile-ci's
`pre-flow-command`. `pr.yml`'s `detect-mobile-impact` keeps those same paths
out of the full iOS suite. `pin-app-lock-clip-1` is excluded until #697 makes
the seed hook produce a SQLCipher database for lock-flag scenes. The
`flows/media/ai-build/` flows need no exclude pattern: the smoke job's
`flows-max-depth` of 1 already keeps subdirectories out of the shard, and they
cannot run on its AI-disabled build anyway. There is no
CSV import clip: the flow recorded the iOS Files picker, which both needs
E2EFixtures on the CI runner and exposes `01.db`…`09.db` fixture filenames.

Screenshot protection blanks Maestro's `takeScreenshot`, not `simctl io
screenshot`. A `deepLink` scene seeded with `is_screenshot_protection_enabled = 1`
captures normally, so `screenshot-protection-1` shows the switch in its enabled
state; a `flow` scene under the same flag returns an all-black frame. That is why
`pin-app-lock-1` carries its own `scenes/pin-app-lock-1.sql` overlay, which turns
the PIN and biometric flags on and leaves screenshot protection off, instead of
reusing `shared/security-locked.sql`.

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
