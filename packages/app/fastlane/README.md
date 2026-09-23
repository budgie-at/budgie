# Fastlane store automation

App Store Connect and Google Play listing delivery for Budgie. Text metadata and
screenshots are pushed by `deliver`/`supply`, and `store_preflight` validates the
committed trees before anything reaches a store.

## Layout

```text
fastlane/
├── Appfile                    # app_identifier, package_name, credentials
├── Fastfile                   # store_preflight, metadata and screenshot lanes
├── metadata/
│   ├── ios/
│   │   ├── copyright.txt
│   │   └── <asc-locale>/{name,subtitle,keywords,promotional_text,description,release_notes,support_url}.txt
│   ├── release-notes-state.json  # base tag/commit the committed notes were generated from
│   └── android/
│       └── <locale>/
│           ├── title.txt
│           ├── short_description.txt
│           ├── full_description.txt
│           ├── changelogs/default.txt
│           └── images/
│               ├── phoneScreenshots/*.png
│               ├── featureGraphic.png   # en-US only, see "Play asset list"
│               └── icon.png             # en-US only, see "Play asset list"
└── screenshots/
    ├── deployed-variant.json  # which appearance the store currently carries
    ├── design/                # captions, palette and the composition script
    ├── raw/                   # gitignored capture output
    └── variants/<appearance>/ios/<asc-locale>/*.png
```

`Appfile` carries the **production** bundle id `com.vitalyiegorov.budgie` and
Play package `com.vitaliiyehorov.budgie` — the listings the lanes write to.
Screenshots are captured against the E2E build
(`com.vitalyiegorov.budgie.e2e`), which is a different binary with the same UI.
`team_id` defaults to the team id in `eas.json` and can be overridden with
`FASTLANE_TEAM_ID`.

Both the iOS and Android `metadata/` trees carry real ASO copy for all five
locales. Play screenshots are a separate sub-issue.

### Play asset list

`supply`'s fixed image slots, both under `metadata/android/en-US/images/`:

- `featureGraphic.png` — exactly `1024x500`, 24-bit PNG, no alpha.
- `icon.png` — exactly `512x512`, 32-bit PNG (with alpha channel), within
  1024 KB.

Neither asset carries locale text, so `en-US` is the only copy `supply`
needs. Regenerate both from the app's own icon mark with:

```bash
packages/app/fastlane/screenshots/design/compose-play-store-assets.sh
```

`store_preflight` fails if either file is missing or its dimensions drift
from the spec above.

## Lanes

```bash
fastlane store_preflight        # no credentials needed
fastlane ios ios_metadata       # deliver App Store text metadata
fastlane ios ios_screenshots    # deliver the composed screenshot set
fastlane android android_metadata     # supply Play text metadata + changelogs
fastlane android android_screenshots  # supply Play screenshots
```

Lanes are addressed as `fastlane <platform> <lane>`. Bare `fastlane
store_preflight` works because it is platform-free, but bare
`fastlane android_metadata` resolves against `default_platform(:ios)` and fails
with "Could not find lane 'ios android_metadata'". Always pass the platform for
the iOS and Android lanes.

`store_preflight` resolves the active variant, prints the app store version, the
Play track, the copyright line, per-locale screenshot counts, each metadata tree
path and its locales, and warns (not fails) while the Play image directory is
empty. It fails when a screenshot locale folder is missing, when any PNG's pixel
size matches no App Store slot, when `metadata/ios/copyright.txt` carries a stale
year, when either metadata tree is missing a locale or is missing entirely, or
when `featureGraphic.png`/`icon.png` under `metadata/android/en-US/images` is
missing or the wrong size (see "Play asset list"). Run it after touching the
Fastfile, the compose script, or the metadata trees.

`verify_field_budgets` is the per-file budget gate `store_preflight` runs after
`verify_store_tree`: for every `ASC_LOCALES` entry it checks that every required
metadata file exists and its stripped character length (codepoints, not bytes)
is within budget, and that `keywords.txt` carries no space after a comma. An
empty locale folder — which passes the directory-only `verify_store_tree` check
— still fails here, so `deliver`/`supply` can never upload a blank listing for a
locale. The budget table per field is `IOS_FIELD_BUDGETS` and
`ANDROID_FIELD_BUDGETS` in the Fastfile; each locale's Play
`full_description.txt` is kept byte-identical to its iOS `description.txt`,
and `changelogs/default.txt` carries the same release notes as iOS
`release_notes.txt`, trimmed to the 500-character Play changelog budget.

`ios_metadata` runs `deliver` with `skip_binary_upload` and `skip_screenshots`,
so it only pushes text metadata to the editable version and leaves the binary
and the current store images alone.

`ios_screenshots` re-runs the screenshot gates against the set it is about to
upload, so a variant missing a locale can never reach `deliver`. It then runs
`deliver` with `skip_binary_upload`, `skip_metadata`,
`overwrite_screenshots`, `run_precheck_before_submit: false` and
`submit_for_review: false`, so it only replaces the screenshot set on the
editable version and never touches copy, the binary, or review state.

`android_metadata` and `android_screenshots` run `supply` against the release
`eas submit` just created. `supply` normally derives version codes from the
binary it uploads, and these lanes upload none, so they read the version code
with `google_play_track_version_codes` first; without it `supply` aborts with
"Cannot find changelog because no version code given". The track comes from
`submit.production.android.track` in `packages/app/eas.json` (currently
`internal`) rather than `supply`'s `production` default. `android_screenshots`
hard-fails when `metadata/android/<locale>/images` carries no images, because
`supply` reports success even when it uploads nothing.

### Variant selection

The uploaded set is `screenshots/variants/<variant>/ios`. The variant is
`SCREENSHOT_VARIANT` when set, otherwise the `ios` key of
`screenshots/deployed-variant.json` (currently `dark`, matching the app's own
default theme).

`SCREENSHOT_VARIANT=ci` is the CI path: instead of reading a committed set, the
lane composes `screenshots/raw/ios` — which is where mobile-ci's
`store-screenshots` workflow downloads every capture job's artifact — into
`variants/ci/ios` first, so CI ships the same framed, captioned set a local run
produces rather than bare captures. It composes the single appearance from
`deployed-variant.json`: `PUBLISH_VARIANT_NAME` pins one output directory, so the
compose script rejects it together with the `all` appearance argument, which
would otherwise publish light and dark over each other.

Only the scenes listed in the compose script's own scene table are composed, so
capture-only raw scenes (`00-prime`, which grants the deep-link trust) never
reach `variants/`, the PR gallery, or `deliver`.

### Credentials

**iOS.** The lane resolves the key **path** from the first of:

1. `ASC_API_KEY_PATH`, then `EXPO_ASC_API_KEY_PATH`
2. `$RUNNER_TEMP/store-screenshots/asc-api-key.p8` — where mobile-ci's upload
   job writes the `ASC_API_KEY` secret when the config sets no `asc-key-path`
3. `submit.production.ios.ascApiKeyPath` in `packages/app/eas.json`

and the key **id** / **issuer id** from `ASC_KEY_ID` / `ASC_ISSUER_ID`, then
`EXPO_ASC_KEY_ID` / `EXPO_ASC_ISSUER_ID`, then eas.json's `ascApiKeyId` /
`ascApiKeyIssuerId`. Relative paths resolve against `packages/app`, so a local
run needs only the `.p8` file itself:

```bash
cd packages/app
fastlane ios ios_metadata
fastlane ios ios_screenshots
```

**CI contract.** mobile-ci's upload job hands `upload-command` only
`SCREENSHOTS_DIR` and `EXPO_TOKEN` — the resolved key path is not exported and
the `ASC_KEY_ID`/`ASC_ISSUER_ID` secrets never reach it. Rule 2 above closes the
path gap by reconstructing the documented `$RUNNER_TEMP` location, and eas.json
supplies the ids, so the lane works with the config as it stands. Setting
`asc-key-path` in `.github/store-screenshots.config.json` (or passing the ids
through the `EAS_EXTRA_ENV` secret) overrides either half if the credentials
ever diverge from eas.json.

**Android.** The Play service account key is read from the
`GOOGLE_SERVICE_ACCOUNT_KEY_PATH` environment variable (wired into `Appfile`'s
`for_platform :android` block). The key and the `GOOGLE_SERVICE_ACCOUNT_JSON`
repo secret do not exist for Budgie yet, so Android upload stays disabled until
they are created:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=... fastlane android android_metadata
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=... fastlane android android_screenshots
```

## Locale mapping

The app's supported locales are `en`, `fr`, `uk`, `de`, `es`. Both stores use
the same folder names:

| App locale | iOS metadata folder | Android metadata folder |
| ---------- | ------------------- | ----------------------- |
| `en`       | `en-US`             | `en-US`                 |
| `fr`       | `fr-FR`             | `fr-FR`                 |
| `uk`       | `uk`                | `uk`                    |
| `de`       | `de-DE`             | `de-DE`                 |
| `es`       | `es-ES`             | `es-ES`                 |

Every locale must exist in both trees. `store_preflight` fails when any is
missing from either.

## Character limits

| Field                        | App Store | Play Store |
| ---------------------------- | --------- | ---------- |
| Name / title                 | 30        | 30         |
| Subtitle                     | 30        | n/a        |
| Short description            | n/a       | 80         |
| Keywords                     | 100       | n/a        |
| Promotional text             | 170       | n/a        |
| Description / full description | 4000    | 4000       |
| Release notes / changelog    | 4000      | 500        |

Keywords are comma-separated with no spaces after the commas.

## CI contract

`native-publish.yml` runs `fastlane store_preflight` as the pre-submit command
on both platforms, so a broken tree fails in seconds instead of after the build
and submission, then `pnpm store:notes -- --check` (warn-only, never blocks the
publish) followed by `fastlane <platform> <platform>_metadata` after submit,
adding `<platform>_screenshots` when the `push_screenshots` dispatch input is
`true`. The Android half stays inert until `enable-android: true`
(budgie-at/budgie#1148).

`.github/scripts/check-store-metadata.sh` mirrors the field budgets and the
keywords rule on every pull request, without fastlane or Ruby.
`store_preflight` stays the release-time authority: only it checks the resolved
screenshot variant and the PNG slot sizes.

## Release notes workflow (local-first)

Release notes are generated locally, never in CI, and the committed files are
the source of truth. Run `pnpm store:notes` from `packages/app` before cutting
a release, then commit `metadata/ios/**/release_notes.txt`,
`metadata/android/**/changelogs/default.txt`, and
`metadata/release-notes-state.json`.

`scripts/generate-store-release-notes.ts` collects the user-facing commits
since the latest `v*` tag (types `feat`, `fix`, `perf`, unscoped or scoped
`app`) and reads the version from `packages/app/package.json`.

- With `ANTHROPIC_API_KEY` set it asks Claude (`STORE_NOTES_MODEL`, default
  `claude-opus-5`) for App Store and Play copy in all five locales (`en`,
  `fr`, `uk`, `de`, `es`) in one structured-output call, then trims each field
  at a line boundary to the store limits (3900 / 490 codepoints).
- Without the key, or when the call fails, it writes a generic "Stability and
  quality improvements" line to `en-US` only. Commit subjects are developer
  copy — they name migrations, libraries and internals — so they are printed
  to the terminal as raw material for hand-written notes, never published. The
  run also reports which locale files still hold the previous release's copy,
  so they can be translated by hand or through the same agent flow that
  maintains the Lingui catalogs.

`pnpm store:notes --check` reports whether user-facing commits landed after
the state file was written. It only warns and never blocks a release.

## Refresh procedure

1. Build the E2E app and capture on a Mac — see
   [screenshots/README.md](screenshots/README.md).
2. Compose the framed sets and review them.
3. Commit `screenshots/variants/**` and any caption changes. `screenshots/raw/`
   and `screenshots/variants/ci/` are gitignored.
4. `fastlane store_preflight`, then `fastlane ios ios_metadata`,
   `fastlane ios ios_screenshots`, `fastlane android android_metadata`, and
   `fastlane android android_screenshots` as needed.

`deliver` needs an editable App Store version to write into, and uploading a
build does not create one, so both iOS lanes pass `app_version` read from
`packages/app/package.json` (the same source `app.config.js` uses).

fastlane runs lane bodies from `packages/app/fastlane` but actions from
`packages/app`, so any path a lane resolves in plain Ruby must be anchored on
the `FASTLANE_DIR`/`APP_DIR` constants rather than written relative to the
working directory.
