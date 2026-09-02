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
| iPad Pro 13-inch (M4) | `ipad-pro-13-inch-m4` | 2064x2752    | iPad 13"    |

| App locale | ASC folder | Regional OS locale |
| ---------- | ---------- | ------------------ |
| `en`       | `en-US`    | `en_US`            |
| `fr`       | `fr-FR`    | `fr_FR`            |
| `uk`       | `uk`       | `uk_UA`            |
| `de`       | `de-DE`    | `de_DE`            |
| `es`       | `es-ES`    | `es_ES`            |

Scenes, in store order: `01-home`, `02-transactions`, `03-analytics`,
`04-budget`, `05-add-expense`, `06-account`, `07-settings`. Appearances: `light`
and `dark`; `deployed-variant.json` records which one the store carries.

`00-prime` is the exception: a Maestro-backed scene that only grants the
deep-link trust (below) and is never composed or uploaded.

## Capture (macOS only)

Build the E2E app first — see `tests/app-tests/E2E-RUNBOOK.md` — then:

```bash
pnpm --filter @budgie-at/app-tests screenshots:capture --app <path/to/Budgie.app>
```

The runner mirrors mobile-ci's `capture-screenshots-ios` action in direct mode
exactly: it boots the manifest's simulator by name, installs the `.app`, applies
the 9:41 status bar override, primes the deep-link trust (below), and then for
every locale x appearance x scene terminates the app, runs the seed hook, sets
the appearance, launches with the locale arguments, opens the scene's deep link,
settles, and captures. A scene declared with a `flow` instead of a `deepLink`
runs through Maestro instead, from a scratch CWD with `-e APP_ID/LOCALE/
APPEARANCE` and the workspace `--config`, exactly as the action does.

Failed cells are retried once, exactly like the action; a failed seed hook and a
flow cell that emitted the wrong number of screenshots are terminal and are not
retried. Each device's simulator is shut down when it finishes, so a matrix run
does not leave a booted simulator — and its CoreSimulator worker processes —
behind for the next one. Pass `--keep-booted` to keep a simulator you are also
using for something else.

Useful flags: `--device`, `--udid`, `--locales`, `--appearances`, `--scenes`,
`--settle`, `--status-bar real|override`, `--output`, `--skip-install`,
`--skip-prime`, `--keep-booted`, `--dry-run`.

Like CI, a run clears `raw/ios/<device-slug>` before its first cell, so a
partial re-capture (`--scenes 03-analytics`, or a single `--locales`) leaves the
device directory holding only what that run captured. Re-run the whole device
before composing.

### Locale arguments

mobile-ci launches with the bare app locale
(`-AppleLanguages '("de")' -AppleLocale de`), so that is the default here too
and local captures match CI byte for byte. `--os-locale regional` swaps in the
regional identifiers from the table above; use it only to check region-specific
number and date formatting, never for a set that will be compared against CI.

### The deep-link confirmation alert

On a fresh install iOS raises `Open in "budgie (E2E)"?` for the first
custom-scheme open — **`simctl openurl` included**, verified on an erased iPad
simulator — and the alert stays up through the settle, so it lands in that PNG
and in every deep-link capture that follows. Only a UI driver can dismiss it.

Both runners therefore grant the trust once per install with
`tests/app-tests/flows/setup/prime-deep-links-scene.flow.yaml`, a thin wrapper
that runs the E2E suite's `prime-deep-links.flow.yaml` and adds the single
`takeScreenshot` mobile-ci requires of a flow-backed scene:

- **CI** runs it as the first `capture-scenes` entry, `00-prime`. Its PNG is
  deleted by the caller workflow's `post-capture-command` before the raw
  artifact is uploaded.
- **Locally** the runner runs the same flow once after install, seeded and themed
  like a real cell, and discards its screenshot. It needs `maestro` on `PATH`
  (`~/.maestro/bin`) and fails loudly without it. Pass `--skip-prime` on a
  simulator that has already granted the trust; `xcrun simctl erase` revokes it.

Every fresh simulator needs this, iPhone and iPad alike — the alert is not an
iPad-only quirk. The iPad additionally queues the alert across relaunch, so an
iPad already stranded on it stays stranded: `xcrun simctl erase` it, then let a
normal `--app` run reinstall and re-prime.

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
5. Commit `variants/**` and any caption edits; `raw/` and `variants/ci/` are
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
