# Popover Menu Overflow Fix — Design

**Issue:** [budgie-at/budgie#380](https://github.com/budgie-at/budgie/issues/380) — long press on the bottom transaction in the list shows a dropdown menu that falls off the screen.

**Branch:** `fix/long-press-dropdown-overflow-380`

## Problem

`PopoverMenu` (`packages/app/src/@generic/component/popover-menu/popover-menu.tsx:34`) always positions the menu **below** the anchor with no awareness of the menu's height, the screen height, or safe-area insets. When the long-pressed card sits near the bottom of the screen, the menu overflows.

## Fix

Heuristic flip in `PopoverMenu` itself, gated by a new `placement` prop:

```ts
type PopoverMenuPlacement = 'bottom' | 'auto';

interface Props {
    // existing props…
    readonly placement?: PopoverMenuPlacement; // default 'auto'
}
```

- `'bottom'` — preserve today's behavior (open below, no flip).
- `'auto'` (default) — open below if the menu fits; flip above otherwise.

### Algorithm

1. Add `menuHeight` state, initialized to `0`. Update via `onLayout` on the existing `Animated.View` (`event.nativeEvent.layout.height`).
2. Read `useSafeAreaInsets()` for `safeBottom`.
3. Derive placement during render (no effect):
   - `spaceBelow = screenHeight - safeBottom - (anchor.y + anchor.height) - ANCHOR_OFFSET`
   - When `placement === 'auto'` and `menuHeight > 0` and `menuHeight > spaceBelow`:
     `menuTop = anchor.y - menuHeight - ANCHOR_OFFSET`
   - Otherwise: today's `menuTop = anchor.y + anchor.height + ANCHOR_OFFSET`.
4. While `menuHeight === 0` on the first open under `placement === 'auto'`, hide the container with a local `opacity: 0` style override (ternary, not `&&`) so the user never sees the pre-measure frame. The override drops on the next render once `onLayout` populates `menuHeight`. The existing scale/opacity animation runs as normal — it just begins from the correct (possibly flipped) coordinates.

`anchor === undefined` keeps the existing fallback (`top = DEFAULT_MENU_TOP`); the flip is a no-op in that branch.

### Why these choices

- `onLayout`, not `measure()` — matches Vercel RN guidance (`ui-measure-views`); also faster and synchronous with paint.
- Position derived during render, not in a `useEffect` — matches `rerender-derived-state-no-effect`.
- No `useMemo` / `useCallback` — React 19 Compiler handles memoization.
- Ternary opacity gate, not `&&` — matches `rendering-no-falsy-and`.
- Animation untouched — only `transform` and `opacity` (`animation-gpu-properties`).

### Call sites

- `TransactionCard` long-press path → no change required; inherits `'auto'`.
- `TransactionActionsMenu` (`⋮` in transaction detail header) → no change; the trigger is at the top of the screen so `'auto'` collapses to `'bottom'` behavior.

## Validation

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```

Manual checks on iOS simulator:

- Long-press the bottom transaction in a list filled past one screen → menu opens **above** the row, fully visible.
- Long-press a top transaction → menu opens below, unchanged.
- Open the `⋮` menu on transaction detail → opens below, unchanged.

Existing Maestro flows that delete a transaction via long-press keep passing — `testID` selectors and content order are unchanged.

## Out of scope

- Horizontal clamping (no reported bug).
- `maxHeight` for very tall menus (current menus are short).
- Transform-origin tuning so the scale animation grows from the anchor side (cosmetic).
- Replacing with a native primitive.
