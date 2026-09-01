# Fastlane store automation

App Store Connect screenshot delivery for Budgie (iOS only). Metadata copy is
not managed here.

## Layout

```text
fastlane/
├── Appfile                    # app_identifier, apple_id, team_id
├── Fastfile                   # store_preflight + ios ios_screenshots
└── screenshots/
    ├── deployed-variant.json  # which appearance the store currently carries
    ├── design/                # captions, palette and the composition script
    ├── raw/                   # gitignored capture output
    └── variants/<appearance>/ios/<asc-locale>/*.png
```

`Appfile` carries the **production** bundle id `com.vitalyiegorov.budgie` — the
listing `deliver` writes to. Screenshots are captured against the E2E build
(`com.vitalyiegorov.budgie.e2e`), which is a different binary with the same UI.
`team_id` defaults to the team id in `eas.json` and can be overridden with
`FASTLANE_TEAM_ID`.

## Lanes

```bash
fastlane store_preflight       # no credentials needed
fastlane ios ios_screenshots   # deliver the composed set
```

`store_preflight` resolves the active variant, reports how many screenshots each
locale carries, and fails when any PNG's pixel size matches no App Store slot.
Run it after touching the Fastfile or the compose script.

`ios_screenshots` runs `deliver` with `skip_binary_upload`, `skip_metadata`,
`overwrite_screenshots`, `run_precheck_before_submit: false` and
`submit_for_review: false`, so it only replaces the screenshot set on the
editable version and never touches copy, the binary, or review state.

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

The lane resolves the key **path** from the first of:

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

## Refresh procedure

1. Build the E2E app and capture on a Mac — see
   [screenshots/README.md](screenshots/README.md).
2. Compose the framed sets and review them.
3. Commit `screenshots/variants/**` and any caption changes. `screenshots/raw/`
   and `screenshots/variants/ci/` are gitignored.
4. `fastlane store_preflight`, then `fastlane ios ios_screenshots`.
