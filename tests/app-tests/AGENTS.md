# App Tests Package

Maestro flows for Budgie.

## Robustness Rules

1. Wait for the next screen's strongest identity once. Do not stack extra `assertVisible` calls on top of the same wait.
2. After `scrollUntilVisible` on a pressable settings/account card, use one settle wait, then tap once.
3. Do not add retry wrappers around normal card taps. Fix scroll, animation, or selector state instead.
4. Prefer positive-state flow control: `tap -> extendedWaitUntil destination visible`.
5. Keep retries only for real native instability like app relaunch or submit confirmation.
6. Refresh dynamic fixtures before running the suite, especially date-based database fixtures.
7. Use exact `testID` selectors for stable controls. Use text only when no stable id exists, such as native alert buttons.
8. If a guard proves load-bearing, keep the smallest specific guard instead of reintroducing blanket waits.
9. Use `3000` as the default `extendedWaitUntil` timeout. Increase only for clearly slow native or import work.
10. If a step is expected in the happy path, do not hide it behind `runFlow when:`. Wait for it explicitly and fail there if it does not appear.
11. Keep flows pinned to English. If a preferences flow changes language, it must switch back to English before it ends.
12. Before any `inputText`, focus the real input first with `tapOn`. For native selector sheets, prefer the visible search placeholder text over internal search-input ids.
13. After selecting an option from a native search sheet, wait for that search field to disappear before tapping the underlying form again.
14. Do not use coordinate taps in committed flows. If a flow cannot target the real control by `testID`, add or fix the app selector first. If a formatted input needs stable replacement, focus it by `testID`, then use keyboard-aware commands such as `eraseText` against the focused input.
15. Do not take screenshots or run `maestro hierarchy` during an active Maestro run. Inspect only after failure or outside the run.
16. Do not use `hideKeyboard` in Maestro flows. It is unreliable here and can break later execution. Prefer flows that continue without explicit keyboard dismissal.
17. Do not `scrollUntilVisible` to submit controls that live in sticky footers. If the form already exposes the submit button outside scrollable content, wait for it and tap it directly.
18. For money assertions, prefer rendered rounded values over raw repository floats. If a balance selector is derived from what the user sees, assert that displayed value or the card accessibility text, not an unrounded internal decimal.
19. Native relaunch is a valid narrow retry case. If `launchApp` occasionally returns to SpringBoard, recover inside one shared relaunch-and-wait subflow, including tapping the app icon when needed, instead of duplicating ad hoc launch retries through business flows.

## Speed Rules

1. The iOS deep-link Open confirmation fires once per fresh simulator, and `run-maestro-suite.sh` handles it by running `flows/setup/prime-deep-links.flow.yaml` before the suite. Do not add `when: visible: 'Open'` probes to business flows — each probe costs ~7s. The only other legitimate Open handling is the native Files picker inside `select-file-from-app-provider.flow.yaml`. Enforced by `selectors:check`.
2. Do not combine `optional: true` with `extendedWaitUntil` timeouts above 5000 — an absent element silently burns the whole timeout. Enforced by `selectors:check`.
3. Navigation subflows deep-link first and wait for the destination identity once. Do not reintroduce tab-tap fallbacks with long optional waits.
4. Prefer seeded database fixtures over creating setup entities through the UI. UI creation belongs only where creation itself is the coverage. To regenerate a captured fixture, run the matching `flows/setup/capture-*.flow.yaml` through `scripts/capture-fixture.sh <capture-flow> <fixture-name>` against a fresh E2E build, then commit the updated `fixtures/*.db`.

## Shards

CI runs the suite as 2 parallel shard jobs, driven by `rnw-community/mobile-ci`'s reusable `ios-maestro.yml` (`shard-count: 2`, `shard-manifest-dir: tests/app-tests/shards`). Shard files are zero-indexed to match mobile-ci's `shard-<index>.txt` contract: `shards/shard-0.txt` and `shards/shard-1.txt`. They list top-level flow file names; every `flows/*.flow.yaml` must appear in exactly one shard (enforced by `selectors:check` via `scripts/validate-shards.sh`, and fail-closed a second time by mobile-ci, which requires a manifest file for every shard index it runs). When adding a flow, add it to the lightest shard; rebalance using the per-flow timing table mobile-ci appends to the job step summary.

Per-flow database seeding is a mobile-ci `pre-flow-command` running `scripts/seed-flow-fixture.sh`, which mirrors `run-maestro-suite.sh`'s `seed_ios_database_fixture_if_needed`: it resolves each flow's `FIXTURE_ROW_ID_MATCH: 'NN.db'` marker (up to three `runFlow` levels deep), copies that fixture over the live database, and contributes `DATABASE_FIXTURE_SEEDED=true` plus `E2E_CSV_FIXTURES_URI` to that one flow's `maestro test` invocation. The once-per-shard fixture install stays a `pre-test-command` running `scripts/setup-ios-e2e-fixtures.sh`.

After a failed flow attempt mobile-ci runs `flows/setup/recover-after-failed-flow.flow.yaml` (app relaunch plus deep-link prime) on a best-effort basis. It must never clear the app data container: `pre-test-command` is the only thing that populates `Documents/E2EFixtures`, and mobile-ci never re-runs it.

## Flow Design

1. Navigation coverage belongs in dedicated navigation flows. Business flows should not repeatedly retest the same navigation path.
2. Shared subflows should remove duplication, but not hide uncertain behavior behind generic retries.
3. Coordinate taps are prohibited. Use `testID`, visible text, accessibility label, or another Maestro selector that resolves through the UI hierarchy.
4. Shared subflows must have one clear responsibility. Delete thin wrappers that only rename parameters or forward to another flow.
5. Use plain step sequences over nested `runFlow` blocks when the steps are linear and expected.

## File Picker Rules

1. Treat file selection as one complete subflow: navigate provider, open folder, select file, then confirm native `Open`.
2. In iOS Files, prefer native folder row ids over label text:
    - `budgie \(E2E\), Container`
    - `E2EFixtures, Folder`
3. `On My iPhone` currently has no stable tappable row id in Maestro hierarchy, so tap it by text only when it is actually visible and assert the picker root state separately.
4. When debugging picker failures, inspect live hierarchy before changing selectors. Labels and tappable container ids are often different nodes.
5. Use the same rule for native selector sheets: hierarchy often exposes a stable visible placeholder or title text that is more reliable than an internal input id.

## Import Rules

1. `import-database-from-settings.flow.yaml` owns the full Settings import path. Callers pass `FIXTURE_ROW_ID_MATCH` directly and should not duplicate picker recovery logic.
2. iOS Files handoff is a valid narrow retry case. If the picker drops out of app state, re-establish Home and Settings, reopen `SettingsPage.ImportDatabaseCard`, and retry the picker once instead of scattering ad hoc retries in callers.
3. After database import, prefer the current app state if Home is already visible. If not, use the shared relaunch-and-wait subflow to recover to `TabBar.Home`.

## Landing Media Flows

Capture-only flows for the landing site's motion assets live in `flows/media/` and are
deliberately outside the E2E suite: `config.yaml` globs `flows/*.flow.yaml`, which does
not descend into `media/`, and `validate-shards.sh` only enumerates top-level flows.

1. `flows/media/<name>.flow.yaml` are the 26 interaction flows - the app states a deep
   link alone cannot express. `flows/media/<clip>.record.flow.yaml` are the 39 record
   wrappers: `startRecording` -> the interaction -> settle -> `stopRecording`.
2. Media flows follow the same selector rules as the suite: `testID` and text selectors
   only, deep-link first through the shared navigation subflows, wait for the
   destination identity once. Where a storyboard control has no stable `testID`, the
   flow stops at the last addressable state and carries a `FOLLOW-UP` comment naming the
   selector to add; never hand-build coordinates and never change app code for a capture.
3. Never add `launchApp`, `stopApp` or a relaunch to a media flow. `record-media-clips.sh`
   terminates and relaunches per cell, so a wrapper already starts from a cold app, and a
   relaunch inside the recording would put a launch frame at the head of the clip.
4. Prefer id-derived selectors over title-derived ones. The `showcase.db` locale overlays
   translate account, tag, budget and merchant titles, so a title-derived `testID` differs
   per locale; where only a title selector exists, take it as an `env` parameter with the
   English default and let the runner pass the translated value.
5. `record-media-clips.sh` mirrors `capture-store-screenshots.sh` cell for cell;
   `encode-media-clips.sh` reads every per-clip decision from `flows/media/clip-routes.json`.
   Raw recordings land in the gitignored `packages/landing/public/media-src/`; only the
   encoded delivery set under `packages/landing/public/media/` is an asset. GIF is never
   produced. Full workflow: [flows/media/README.md](./flows/media/README.md).

## Build Rules

1. Preserve the app URL scheme in E2E builds. Do not delete `CFBundleURLTypes`; deep-link-based flows depend on `budgie://...`.
2. Prefer `npx expo prebuild -p ios --clean` for deterministic E2E iOS rebuilds when the generated native tree may already exist.
3. Do not duplicate native build hacks in multiple places. If a config plugin already injects a required Xcode build phase, do not repeat the same workaround in the workflow or local build commands.
4. Run Maestro verification only against a freshly rebuilt and reinstalled `APP_VARIANT=e2e` app. Dev-client or Metro runs may reproduce/debug a symptom, but they are not valid E2E pass evidence.
5. After changing app code, selectors, fixtures, native config, or Maestro flow assumptions, rebuild the E2E app, reinstall `com.vitalyiegorov.budgie.e2e`, refresh fixtures with `setup-ios-e2e-fixtures.sh`, then run the target flow or suite.
6. `expo run:ios` can serve a STALE cached EAS binary (`buildCacheProvider: 'eas'` in `app.config.js`); `--no-build-cache` does not stop it. To verify code under test, force a local compile and confirm `MAESTRO_EXIT=0` from the actual run. Full procedure and other traps: see [E2E-RUNBOOK.md](./E2E-RUNBOOK.md).
7. After merging `main` into a branch that changes E2E fixtures, re-run every flow touching that fixture — count/total assertions drift and `ts/lint/cpd` cannot catch it. See E2E-RUNBOOK.md.
