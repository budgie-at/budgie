# Store screenshots

Two stages: **capture** raw simulator screenshots, then **compose** them into
framed, captioned store images.

```text
raw/ios/<device-slug>/<app-locale>/<appearance>/<scene>.png   # gitignored
variants/<appearance>/ios/<asc-locale>/<NN>_<device>_<scene>.png
```

## Matrix

`.github/store-screenshots.config.json` is the single source of truth for
scenes, locales, appearances and devices — the local capture script reads it
with `jq` rather than keeping its own copy.

| Device                | Slug                  | Capture size | Store slot  |
| --------------------- | --------------------- | ------------ | ----------- |
| iPhone 17 Pro Max     | `iphone-17-pro-max`   | 1320x2868    | iPhone 6.9" |
| iPad Pro 13-inch (M5) | `ipad-pro-13-inch-m5` | 2064x2752    | iPad 13"    |

| App locale | ASC folder | Regional OS locale |
| ---------- | ---------- | ------------------ |
| `en`       | `en-US`    | `en_US`            |
| `fr`       | `fr-FR`    | `fr_FR`            |
| `uk`       | `uk`       | `uk_UA`            |
| `de`       | `de-DE`    | `de_DE`            |
| `es`       | `es-ES`    | `es_ES`            |

Scenes: `01-home`, `03-analytics`, `04-budget`, `05-add-expense`,
`06-account`, `07-settings` and `09-inbox`; the store order is set by
`compose-screenshots.sh` (see [design/README.md](design/README.md)).
Appearances: `light` and `dark`; `deployed-variant.json` records which one the store carries.
The deployed `dark` variant and the versioned `6.117.0-dark` recapture are committed.

## Capture

Build the E2E app first (or take a CI `ios-e2e-app-e2e` artifact) — see
`tests/app-tests/E2E-RUNBOOK.md` — then, from any host, with the e2e project's
dependencies installed (`npm ci` in `e2e/`):

```bash
SIMLOCK_URL=<gateway> SIMLOCK_TOKEN=<agent token> \
  pnpm --filter @budgie-at/app-tests screenshots:capture --app <path/to/Base.app>
```

The runner hands the e2e project's media capture (`e2e/media.config.ts`) the same
plan mobile-ci's `store-screenshots.yml` hands it in CI:
one cell per locale x appearance x scene, captured on simulators of the manifest's
model leased from the Mac Studio simlock farm. For every cell the capture builds
the scene's showcase database (`seed-screenshot-scene.sh --dry-run`), installs it
with the keychain reset, sets the appearance and the app's language, pins the
9:41 status bar, launches the app, then opens the scene's `deepLink` (waiting for
its `readySelector` and settling) or walks a `test` scene
(`e2e/support/media/scenes.ts`), and writes the device's own pixels. iOS's
one-per-install "Open in budgie (E2E)?" prompt is accepted once per leased
simulator before the first cell, so no scene captures it.

Useful flags: `--device`, `--locales`, `--appearances`, `--scenes`, `--settle`,
`--status-bar real|override`, `--workers`, `--output`, `--dry-run`.

The private Settings scene seeds a backup date and screenshot hiding, then creates
and confirms PIN `1234` through the app UI, encrypting the database, and unlocks it
before capture. Each seed resets the simulator keychain before replacing the
database. The showcase fixture includes the current database migrations. The
capture reads the simulator's framebuffer, which screenshot hiding does not blank.

Like CI, a run clears `raw/ios/<device-slug>` before its first cell, so a
partial re-capture (`--scenes 03-analytics`, or a single `--locales`) leaves the
device directory holding only what that run captured. Re-run the whole device
before composing.

## Compose

```bash
pnpm --filter @budgie-at/app-tests screenshots:compose all all
```

Or directly:

```bash
packages/app/fastlane/screenshots/design/compose-screenshots.sh <asc-locale|all> <light|dark|all> [--device iphone|ipad|all]
```

Needs ImageMagick 7 (`magick`) and the frameit frame assets:

```bash
fastlane frameit download_frames   # one time, caches to ~/.fastlane/frameit/latest
```

Each variant composes into a staging directory and only replaces the published
set once every scene of that variant succeeded, so a mid-run failure can never
leave a locale half-published. Composition detail and the design system live in
[design/README.md](design/README.md).

## Refresh procedure

1. Rebuild and reinstall the E2E app from the current branch.
2. Refresh date-sensitive fixtures so the seeded data reads as current.
3. `pnpm --filter @budgie-at/app-tests screenshots:capture --app <.app>` (both devices run by default).
4. `screenshots:compose all all` and review `variants/light` and `variants/dark`.
   `variants/dark` (the deployed variant) and `variants/6.117.0-dark` are committed; `variants/light` is gitignored.
5. Commit `variants/dark` and any caption edits; `raw/` and other variants are
   gitignored.
6. `cd packages/app && fastlane store_preflight`, then
   `fastlane ios ios_screenshots`.

## CI

`.github/store-screenshots.config.json` drives mobile-ci's reusable
`store-screenshots` workflow: it builds the app, runs one capture job per device,
uploads a `raw-screenshots-*` artifact per job, and — when dispatched with
uploading enabled — merges them into `fastlane/screenshots/raw` and runs
`SCREENSHOT_VARIANT=ci fastlane ios ios_screenshots`, which composes the
downloaded captures into `variants/ci/ios` before delivering. The capture jobs
post a gallery comment linking every artifact, so a dispatch can be reviewed
without uploading anything to App Store Connect.
