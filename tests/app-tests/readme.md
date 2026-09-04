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
the seed hook produce a SQLCipher database for lock-flag scenes. There is no
CSV import clip: the flow recorded the iOS Files picker, which both needs
E2EFixtures on the CI runner and exposes `01.db`…`09.db` fixture filenames.

## Future Test Coverage

- [ ] Multiple account types (Savings, Debt)
- [ ] Income transactions
- [ ] Transfer transactions
- [ ] Transaction editing and deletion
- [ ] Category and tag management
- [ ] Analytics screen verification
- [ ] Settings and preferences
