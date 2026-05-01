# Popover Menu Overflow Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix [#380](https://github.com/budgie-at/budgie/issues/380) — long-press dropdown on the bottom transaction in the list falls off the screen — by making `PopoverMenu` flip above the anchor when it would overflow below.

**Architecture:** Single-file change to `packages/app/src/@generic/component/popover-menu/popover-menu.tsx`. Add a new `placement: 'bottom' | 'auto'` prop (default `'auto'`). Measure menu height via `onLayout`, read safe-area insets via `useSafeAreaInsets`, and pick the menu's `top` accordingly. Hide the pre-measure frame with a ternary `opacity: 0` style override. No call-site changes required.

**Tech Stack:** React 19 (Compiler — no manual memoization), React Native, react-native-reanimated 4, react-native-safe-area-context, NativeWind, TypeScript, Yarn 4 + Lerna + TurboRepo, ESLint 9.

**Spec:** `docs/superpowers/specs/2026-05-01-popover-menu-overflow-fix-design.md`

**Branch:** `fix/long-press-dropdown-overflow-380` (already created off `main`).

**Project rules to honor (CLAUDE.md):**
- Rule 2: No type assertions. No `as Type`, `@ts-ignore`, `@ts-expect-error`. (`as const` is fine.)
- Rule 3: No comments. Self-documenting code.
- Rule 13: No complex logic in JSX props — extract to variables.
- Rule 26: Always brace control-flow bodies.
- Rule 27: No unit tests — verification is `yarn ts && yarn lint && yarn deadcode && yarn cpd` plus manual testing.
- Rule 29: Interface fields are `readonly` by default.
- App rule: No `useMemo` / `useCallback` / `React.memo` (React 19 Compiler).
- App rule: Use `isDefined` from `@rnw-community/shared` for null/undefined checks.
- App rule: Use ternary, not `&&`, for conditional rendering style/value selection.

---

## File Structure

**Modified files:**

- `packages/app/src/@generic/component/popover-menu/popover-menu.tsx` — add `placement` prop, `menuHeight` state, `useSafeAreaInsets`, flip logic, opacity gate.

**No new files. No call-site changes.**

---

## Task 1: Implement the flip + opacity gate in `PopoverMenu`

**Files:**
- Modify: `packages/app/src/@generic/component/popover-menu/popover-menu.tsx` (entire file rewritten — small file, ~65 LOC)

- [ ] **Step 1: Replace the file with the updated implementation**

Open `packages/app/src/@generic/component/popover-menu/popover-menu.tsx` and replace its contents with:

```tsx
import { useLingui } from '@lingui/react/macro';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, Modal, Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { usePopoverAnimation } from './use-popover-animation.hook';

const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;

export type PopoverMenuPlacement = 'bottom' | 'auto';

export interface PopoverMenuAnchor {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

interface Props {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete?: EmptyFn;
    readonly children: ReactNode;
    readonly anchor?: PopoverMenuAnchor;
    readonly placement?: PopoverMenuPlacement;
}

export const PopoverMenu = ({ isOpen, onClose, onCloseComplete, children, anchor, placement = 'auto' }: Props) => {
    const { t } = useLingui();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const { bottom: safeBottom } = useSafeAreaInsets();
    const { isAnimatingOut, backdropStyle, menuStyle } = usePopoverAnimation(isOpen, onCloseComplete);
    const [menuHeight, setMenuHeight] = useState(0);

    const handleLayout = (event: LayoutChangeEvent) => {
        setMenuHeight(event.nativeEvent.layout.height);
    };

    const hasAnchor = isDefined(anchor);
    const spaceBelow = hasAnchor ? screenHeight - safeBottom - (anchor.y + anchor.height) - ANCHOR_OFFSET : 0;
    const shouldFlipAbove = hasAnchor && placement === 'auto' && menuHeight > 0 && menuHeight > spaceBelow;

    let menuTop = DEFAULT_MENU_TOP;
    if (hasAnchor && shouldFlipAbove) {
        menuTop = anchor.y - menuHeight - ANCHOR_OFFSET;
    } else if (hasAnchor) {
        menuTop = anchor.y + anchor.height + ANCHOR_OFFSET;
    }

    const menuRight = hasAnchor ? screenWidth - anchor.x - anchor.width : MENU_MARGIN;
    const isMeasuring = hasAnchor && placement === 'auto' && menuHeight === 0;
    const measuringStyle: ViewStyle | null = isMeasuring ? { opacity: 0 } : null;

    const menuContainerStyle: ViewStyle = { position: 'absolute', top: menuTop, right: menuRight };

    const shouldRender = isOpen || isAnimatingOut;

    const handleClose = () => void onClose();

    if (!shouldRender) {
        return null;
    }

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={handleClose}>
            <View className="flex-1" accessibilityViewIsModal>
                <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} accessibilityLabel={t`Close menu`}>
                    <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
                </Pressable>

                <View style={menuContainerStyle} accessibilityRole="menu">
                    <Animated.View
                        className="min-w-[220px] overflow-hidden rounded-2xl border border-secondary-corner bg-primary-reverse shadow-lg"
                        style={[menuStyle, measuringStyle]}
                        onLayout={handleLayout}
                    >
                        {children}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};
```

- [ ] **Step 2: Verify the file matches expectations**

Run: `cat packages/app/src/@generic/component/popover-menu/popover-menu.tsx | head -30`
Expected: First 30 lines show the new imports (`useState`, `LayoutChangeEvent`, `useSafeAreaInsets`), the `PopoverMenuPlacement` type export, and the start of the component with the new `placement = 'auto'` default.

- [ ] **Step 3: Confirm no other file imports the removed `PopoverMenuPlacement` symbol**

Run: `grep -r "PopoverMenuPlacement" packages/app/src --include="*.tsx" --include="*.ts"`
Expected: Only matches inside `popover-menu.tsx` itself. No other files import it (the prop has no consumers yet).

- [ ] **Step 4: Confirm no call-site break for `PopoverMenuAnchor`**

Run: `grep -rn "PopoverMenuAnchor" packages/app/src --include="*.tsx" --include="*.ts"`
Expected: 5 matches (transaction-card.tsx, transaction-actions-menu.tsx, transaction-list-context-menu.tsx, transaction-sections-list.tsx, transaction-menu-state.interface.ts) — all unchanged because the export is preserved.

---

## Task 2: Validate the change against the project's checks

**Files:** None — read-only validation.

- [ ] **Step 1: Format**

Run: `yarn format`
Expected: No errors. Prettier may auto-format the file; that's fine.

- [ ] **Step 2: TypeScript**

Run: `yarn ts`
Expected: Exit code 0. No type errors.

If `useSafeAreaInsets` errors with "Cannot find module" → run `yarn install` and retry; the package is already a transitive dep of the app.

- [ ] **Step 3: ESLint**

Run: `yarn lint`
Expected: Exit code 0. No new warnings or errors.

Common issues to watch for and fix inline if they appear:
- `curly` (rule 26): make sure every `if` body has braces — the snippet already does.
- `no-restricted-syntax` against `x !== null`: not applicable here (no null checks added).
- `react-compiler/...`: the snippet uses no `useMemo`/`useCallback`. If the compiler flags `setMenuHeight` inside `handleLayout`, it's a false positive — leave the closure as written.

- [ ] **Step 4: Dead-code detection**

Run: `yarn deadcode`
Expected: Exit code 0. The new `PopoverMenuPlacement` type is exported but unused by call sites; Knip should not flag it because it's a public API of the component module. If it does flag, leave it — call sites can opt in later via the prop.

- [ ] **Step 5: Code duplication**

Run: `yarn cpd`
Expected: Exit code 0. No new duplication introduced.

---

## Task 3: Manual verification on iOS simulator

**Files:** None — runtime verification.

- [ ] **Step 1: Boot the app**

Run: `cd packages/app && yarn ios`
Expected: iOS simulator opens with the app running on a notched device (default `iPhone 16 Pro` or similar). Wait for the Metro bundle and the home tab to render.

- [ ] **Step 2: Reproduce the original bug as a sanity check (optional)**

Skip this step if you trust the spec. Otherwise: temporarily revert just the placement default to `'bottom'` (or comment out the flip branch), reload, long-press the bottom transaction → confirm the menu falls off-screen. Restore the change before continuing.

- [ ] **Step 3: Verify the fix on the bottom transaction**

In the running app:
1. Open a tab with a transaction list that fills past one screen (Home tab `(tabs)/index.tsx` if there are enough seeded transactions; otherwise add a few via the keypad).
2. Scroll so a transaction sits at the bottom of the visible area, just above the tab bar.
3. Long-press that transaction.

Expected: The dropdown menu opens **above** the row, fully visible. No clipping by the tab bar or the home indicator.

- [ ] **Step 4: Verify a top transaction still opens below**

Long-press the topmost visible transaction.

Expected: Menu opens **below** the row, identical to today's behavior.

- [ ] **Step 5: Verify the `⋮` menu in transaction detail is unchanged**

Tap a transaction to open its detail screen. Tap the `⋮` button in the header.

Expected: Menu opens below the button, identical to today's behavior. No flicker.

- [ ] **Step 6: Verify there is no visual flicker on first open**

Open the long-press menu several times in quick succession on different rows.

Expected: Menu appears at its final (possibly flipped) position with no visible jump. The opacity gate hides the pre-measure frame.

---

## Task 4: Commit and push

**Files:** None — git only.

- [ ] **Step 1: Stage and commit**

Run:
```bash
git add packages/app/src/@generic/component/popover-menu/popover-menu.tsx
git commit -m "$(cat <<'EOF'
fix(app): flip popover menu above anchor when it overflows

Adds a placement prop to PopoverMenu (default 'auto') that flips the
menu above the anchor when there is not enough space below. Hides the
pre-measure frame with an opacity gate so users never see a wrong
position. Closes #380.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: Commit succeeds. Husky pre-commit hook runs (`yarn ts`, `lint-staged`, commitlint) and passes.

- [ ] **Step 2: Verify the branch is clean**

Run: `git status`
Expected: `nothing to commit, working tree clean` (apart from the untracked files that were already present at branch creation: `.claude/scheduled_tasks.lock`, `ERSTE/`).

- [ ] **Step 3: Push (only when user asks)**

Do not push automatically. Wait for the user's explicit instruction to push or open a PR. When asked, push with:

```bash
git push -u origin fix/long-press-dropdown-overflow-380
```

---

## Out of scope (do not implement)

- Horizontal clamping (no reported bug).
- `maxHeight` for very tall menus.
- Transform-origin tuning so the scale animation grows from the anchor side.
- Replacing with a native primitive.
- Changes to call sites — the default `'auto'` fixes the bug everywhere; no opt-in required.
