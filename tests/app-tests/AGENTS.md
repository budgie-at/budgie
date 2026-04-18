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

## Flow Design

1. Navigation coverage belongs in dedicated navigation flows. Business flows should not repeatedly retest the same navigation path.
2. Shared subflows should remove duplication, but not hide uncertain behavior behind generic retries.
3. Coordinate taps are last resort only. Prefer app selectors whenever possible.
4. Shared subflows must have one clear responsibility. Delete thin wrappers that only rename parameters or forward to another flow.
5. Use plain step sequences over nested `runFlow` blocks when the steps are linear and expected.

## File Picker Rules

1. Treat file selection as one complete subflow: navigate provider, open folder, select file, then confirm native `Open`.
2. In iOS Files, prefer native folder row ids over label text:
   - `budgie \(E2E\), Container`
   - `E2EFixtures, Folder`
3. `On My iPhone` currently has no stable tappable row id in Maestro hierarchy, so tap it by text and assert the picker root state separately if needed.
4. When debugging picker failures, inspect live hierarchy before changing selectors. Labels and tappable container ids are often different nodes.

## Import Rules

1. Import fixture flows should deep link straight to the target Settings anchor, not bootstrap app state defensively inside the subflow.
2. `import-database-from-settings.flow.yaml` owns direct database import only. Callers pass `FIXTURE_ROW_ID_MATCH` directly.
3. After database import triggered from a deep link, iOS restores the app to Settings. Wait for `SettingsPage.Container`, then tap `TabBar.Home`, then assert Home.
