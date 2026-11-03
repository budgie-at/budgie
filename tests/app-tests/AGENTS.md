# App Tests Package

Fixtures and scripts for Budgie's end-to-end tests. The tests themselves live in
[`e2e/`](../../e2e), a standalone [tester-army e2e](https://github.com/tester-army/e2e)
project that drives iOS simulators leased from the Mac Studio simlock farm:

- `e2e/tests/*.e2e.ts` (config `e2e/e2e.config.ts`): the PR suite, one test per
  feature area, shared steps in `e2e/support/budgie/`.
- `e2e/media/*.e2e.ts` (config `e2e/media.config.ts`): the media capture (store,
  landing and social screenshots, the media smoke, the Apple Pay guide screens)
  and the opt-in fixture builders. Capture scenes live in `e2e/support/media/scenes.ts`.

This package keeps what both read: database and file fixtures (`fixtures/`), the
showcase screenshot data (`fixtures/screenshots/`), and the scripts that stage
them (`scripts/setup-ios-e2e-fixtures.sh`, `scripts/prepare-date-sensitive-fixtures.js`,
`scripts/seed-screenshot-scene.sh`).

## Robustness Rules

1. Wait for the next screen's strongest identity once (`expect(...).toBeVisible()`). Do not stack extra assertions on the same wait.
2. After scrolling a pressable card into view, let the list settle once, then tap once.
3. Do not add retry wrappers around normal taps. Fix scroll, animation, or selector state instead. Retry only real native instability (a dropped first tap on a freshly shown keypad, a submit that sometimes does not take), with the smallest guard that proves load-bearing.
4. Prefer positive-state control flow: tap, then wait for the destination.
5. Refresh dynamic fixtures before running the suite, especially date-based database fixtures (`prepare-date-sensitive-fixtures.js`, which `setup-ios-e2e-fixtures.sh` runs).
6. Use exact `testID` selectors (`b.byId`) for stable controls. Use text only when no stable id exists, such as native alert buttons.
7. Keep tests pinned to English. A preferences test that changes language switches back before it ends.
8. Focus the real input before typing. After picking from a native search sheet, wait for its search field to disappear before tapping the form underneath.
9. No coordinate taps in committed tests. A relative `{ position }` is allowed only on a locator, to hit a spot inside the matched control.
10. Do not scroll to submit controls in sticky footers; wait for them and tap them directly.
11. For money assertions, assert the rendered rounded value or the card's accessibility text, not an unrounded internal decimal.

## Speed Rules

1. iOS's deep-link Open confirmation fires once per fresh simulator; `Budgie.start()` and the media capture prime it once per lease. Do not probe for it in business steps. The only other legitimate Open handling is inside the native Files picker (`selectFileFromAppProvider`).
2. Navigation helpers deep-link first and wait for the destination identity once.
3. Prefer seeded database fixtures over creating setup entities through the UI. UI creation belongs only where creation itself is the coverage. To regenerate a built fixture (`29.db`, `31-debt.db`, `31-transaction-info.db`), run `scripts/capture-fixture.sh <name>` against a fresh E2E build (it runs `e2e/media/fixtures.e2e.ts`), then commit the updated `fixtures/*.db`.

## Fixtures on the device

`setup-ios-e2e-fixtures.sh` is the one source of truth for what lands in the app's
`Documents/E2EFixtures`: the e2e suite runs it on the runner (its `APP_DATA_CONTAINER`
override points it at a local directory) and unpacks the result into the leased
simulator's container once per lease. Every test starts from `budgie.start({ fixture })`,
which makes one staged `NN.db` the live database.

## File Picker Rules

1. Treat file selection as one complete step: navigate the provider, open the folder, select the file, confirm the native `Open`.
2. In iOS Files, prefer native folder row ids over label text (`budgie \(E2E\), Container`, `E2EFixtures, Folder`).
3. When a picker step fails, read the accessibility tree in the failed test's `trace.md` before changing selectors: labels and tappable container ids are often different nodes.

## Build Rules

1. Preserve the app URL scheme in E2E builds. Do not delete `CFBundleURLTypes`; deep-link steps depend on `budgie://...`.
2. Prefer `npx expo prebuild -p ios --clean` for deterministic E2E iOS rebuilds when the generated native tree may already exist.
3. Do not duplicate native build hacks in multiple places. If a config plugin already injects a required Xcode build phase, do not repeat the same workaround in the workflow or local build commands.
4. Run e2e verification only against a fresh `APP_VARIANT=e2e` build of the current branch (or its `ios-e2e-app-e2e` CI artifact). Dev-client or Metro runs may reproduce a symptom, but they are not valid E2E pass evidence.
5. `expo run:ios` can serve a STALE cached EAS binary (`buildCacheProvider: 'eas'` in `app.config.js`); `--no-build-cache` does not stop it. Full procedure and other traps: see [E2E-RUNBOOK.md](./E2E-RUNBOOK.md).
6. After merging `main` into a branch that changes E2E fixtures, re-run every test touching that fixture: count/total assertions drift and `ts/lint/cpd` cannot catch it. See E2E-RUNBOOK.md.
