# App Tests Package

Maestro flows for Budgie.

## Robustness Rules

1. Wait for the next screen's strongest identity once. Do not stack extra `assertVisible` calls on top of the same wait.
2. After `scrollUntilVisible` on a pressable settings/account card, use one settle wait, then tap once.
3. Do not add retry wrappers around normal card taps. Fix scroll, animation, or selector state instead.
4. Prefer positive-state flow control: `tap -> extendedWaitUntil destination visible`.
5. Keep retries only for real native instability like app relaunch or submit confirmation.
6. Refresh dynamic fixtures before running the suite, especially date-based database fixtures.
7. Use exact `testID` selectors for stable controls. Use text only when no stable id exists.
8. If a guard proves load-bearing, keep the smallest specific guard instead of reintroducing blanket waits.
9. Use `3000` as the default `extendedWaitUntil` timeout. Increase only for clearly slow native or import work.
10. If a step is expected in the happy path, do not hide it behind `runFlow when:`. Wait for it explicitly and fail there if it does not appear.
11. Keep flows pinned to English. If a preferences flow changes language, it must switch back to English before it ends.
12. Before any `inputText`, focus the real input first with `tapOn`. For native selector sheets, prefer the visible search placeholder text over internal search-input ids.
13. After selecting an option from a native search sheet, wait for that search field to disappear before tapping the underlying form again.
14. For formatted numeric inputs that must be cleared and replaced, tap near the trailing edge first so the caret lands at the end before `eraseText`. For Budgie amount fields, use `point: '95%,50%'` on the input `testID` before clearing.
15. Do not take screenshots or run `maestro hierarchy` during an active Maestro run. Inspect only after failure or outside the run.
16. Do not use `hideKeyboard` in Maestro flows. It is unreliable here and can break later execution. Prefer flows that continue without explicit keyboard dismissal.
17. Do not `scrollUntilVisible` to submit controls that live in sticky footers. If the form already exposes the submit button outside scrollable content, wait for it and tap it directly.
18. For money assertions, prefer rendered rounded values over raw repository floats. If a balance selector is derived from what the user sees, assert that displayed value or the card accessibility text, not an unrounded internal decimal.
19. Native relaunch is a valid narrow retry case. If `launchApp` occasionally returns to SpringBoard, recover inside one shared relaunch-and-wait subflow, including tapping the app icon when needed, instead of duplicating ad hoc launch retries through business flows.

## Flow Design

1. Navigation coverage belongs in dedicated navigation flows. Business flows should not repeatedly retest the same navigation path.
2. Shared subflows should remove duplication, but not hide uncertain behavior behind generic retries.
3. Coordinate taps are last resort only. Prefer app selectors whenever possible.
4. For native confirmation dialogs whose button text also exists behind the dialog, tap the dialog action by `text` plus the proven dialog `index`. Do not use point taps for alert buttons.
5. Shared subflows must have one clear responsibility. Delete thin wrappers that only rename parameters or forward to another flow.
6. Use plain step sequences over nested `runFlow` blocks when the steps are linear and expected.

## File Picker Rules

1. Treat file selection as one complete subflow: navigate provider, open folder, select file, then confirm native `Open`.
2. In iOS Files, prefer native folder row ids over label text:
   - `budgie \(E2E\), Container`
   - `E2EFixtures, Folder`
3. `On My iPhone` currently has no stable tappable row id in Maestro hierarchy, so tap it by text only when it is actually visible and assert the picker root state separately.
4. When debugging picker failures, inspect live hierarchy before changing selectors. Labels and tappable container ids are often different nodes.
5. Use the same rule for native selector sheets: hierarchy often exposes a stable visible placeholder or title text that is more reliable than an internal input id.
6. Do not change shared file-picker or import subflows while implementing a business-flow feature unless the task explicitly asks for harness work. If a feature flow fails before fixture import completes, treat it as environment, simulator state, fixture setup, or harness flakiness first; restore shared subflows to their prior behavior and get explicit approval before editing `flows/subflows/import/*`.
7. Do not add coordinate taps, alternate picker strategies, or wider waits to shared import subflows as a reaction to one scenario failure. Prove the issue across multiple affected flows or isolate the workaround inside the scenario only after approval.

## Import Rules

1. `import-database-from-settings.flow.yaml` owns the full Settings import path. Callers pass `FIXTURE_ROW_ID_MATCH` directly and should not duplicate picker recovery logic.
2. iOS Files handoff is a valid narrow retry case. If the picker drops out of app state, re-establish Home and Settings, reopen `SettingsPage.ImportDatabaseCard`, and retry the picker once instead of scattering ad hoc retries in callers.
3. After database import, prefer the current app state if Home is already visible. If not, use the shared relaunch-and-wait subflow to recover to `TabBar.Home`.

## Build Rules

1. Preserve the app URL scheme in E2E builds. Do not delete `CFBundleURLTypes`; deep-link-based flows depend on `budgie://...`.
2. Prefer `npx expo prebuild -p ios --clean` for deterministic E2E iOS rebuilds when the generated native tree may already exist.
3. Do not duplicate native build hacks in multiple places. If a config plugin already injects a required Xcode build phase, do not repeat the same workaround in the workflow or local build commands.
4. Run Maestro verification only against a freshly rebuilt and reinstalled `APP_VARIANT=e2e` app. Dev-client or Metro runs may reproduce/debug a symptom, but they are not valid E2E pass evidence.
5. After changing app code, selectors, fixtures, native config, or Maestro flow assumptions, rebuild the E2E app, reinstall `com.vitalyiegorov.budgie.e2e`, refresh fixtures with `setup-ios-e2e-fixtures.sh`, then run the target flow or suite.
