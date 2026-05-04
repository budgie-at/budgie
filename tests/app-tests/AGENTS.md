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

## Flow Design

1. Navigation coverage belongs in dedicated navigation flows. Business flows should not repeatedly retest the same navigation path.
2. Shared subflows should remove duplication, but not hide uncertain behavior behind generic retries.
3. Coordinate taps are last resort only. Prefer app selectors whenever possible.
