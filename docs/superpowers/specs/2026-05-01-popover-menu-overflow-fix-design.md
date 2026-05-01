# Popover Menu Overflow Fix — Design

**Issue:** [budgie-at/budgie#380](https://github.com/budgie-at/budgie/issues/380) — long press on the bottom transaction in the list shows a dropdown menu that falls off the screen.

**Branch:** `fix/long-press-dropdown-overflow-380`

## Problem

`PopoverMenu` (`packages/app/src/@generic/component/popover-menu/popover-menu.tsx`) always positions the menu **below** the anchor:

```ts
const menuTop = anchor ? anchor.y + anchor.height + ANCHOR_OFFSET : DEFAULT_MENU_TOP;
```

There is no awareness of the menu's height, the screen height, or safe-area insets. When the long-pressed card sits near the bottom of the screen, the menu overflows and gets clipped.

## Fix

Heuristic flip in `PopoverMenu` itself, gated by a new `placement` prop:

```ts
type PopoverMenuPlacement = 'bottom' | 'auto';

interface Props {
    // existing props…
    readonly placement?: PopoverMenuPlacement; // default 'auto'
}
```

- `'bottom'` — preserves today's behavior (open below, no flip).
- `'auto'` (default) — open below if it fits, otherwise flip above.

### Algorithm

1. Add `menuHeight` state, initialized to `0`.
2. `onLayout` on the existing `Animated.View` writes `event.nativeEvent.layout.height` into `menuHeight`.
3. Read `useSafeAreaInsets()` for `safeTop` and `safeBottom`.
4. Compute placement:
   - `spaceBelow = screenHeight - safeBottom - (anchor.y + anchor.height) - ANCHOR_OFFSET`
   - When `placement === 'auto'` and `menuHeight > spaceBelow`, place above:
     `menuTop = anchor.y - menuHeight - ANCHOR_OFFSET`
   - Otherwise: today's `menuTop = anchor.y + anchor.height + ANCHOR_OFFSET`.
5. Until `menuHeight > 0` on the first open, hide the menu container with a local `opacity: 0` style override so the user never sees a frame rendered at the wrong position. The override is dropped on the second render once `onLayout` populates `menuHeight`. The existing animation runs as normal — it just begins from the correct (possibly flipped) coordinates. (`useAnimatedStyle` returns a style object for `Animated.View`; passing the array `[menuStyle, isMeasuring ? { opacity: 0 } : null]` lets the literal override the animated opacity for the single pre-measure frame.)
6. When `isOpen` flips from `true` to `false`, reset `menuHeight` to `0` so the next open re-measures (anchor and content may differ).

`anchor === undefined` keeps the existing fallback (`top = DEFAULT_MENU_TOP`, `right = MENU_MARGIN`); flipping is a no-op in that path.

### Call sites

- `TransactionCard` long-press path → no change required; it inherits `'auto'`.
- `TransactionActionsMenu` (`⋮` in the transaction detail header) → no change; either `'auto'` or `'bottom'` produces the same result because the trigger is at the top of the screen.

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
