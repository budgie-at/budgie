# Budget Widget Long Press to Change Variant

## Overview

Add long press gesture to the budget widget on the homescreen to open the variant selector bottom sheet, allowing users to quickly switch between compact and detailed views.

## Interaction Flow

**Trigger:** Long press on the budget widget card (homescreen)

**Conditions:** Only active when:
- Budget exists (not showing "Set up your budget" state)
- Not in loading state

**Behavior:**
1. User long presses the budget widget
2. Haptic feedback fires (medium impact)
3. `BudgetWidgetVariantSelectorBottomSheet` opens
4. User selects a variant (or dismisses)
5. Selection saves to the budget entity
6. Widget re-renders with new variant

**Non-interference:** Regular tap still navigates to `/budget` page.

## Technical Implementation

### Files to Modify

**`packages/app/src/budget/components/budget-widget/budget-widget.tsx`**
- Import `Gesture` and `GestureDetector` from `react-native-gesture-handler`
- Create `Gesture.LongPress()` with medium haptic feedback
- Use `Gesture.Exclusive()` to compose with tap (long press priority, tap passes through)
- Add ref for `BudgetWidgetVariantSelectorBottomSheet`
- Render bottom sheet component
- Pass `onSelect` handler using existing `useUpdateBudgetWidgetVariantMutation`

### Reused Components (no changes needed)
- `BudgetWidgetVariantSelectorBottomSheet` - existing variant selector
- `useUpdateBudgetWidgetVariantMutation` - existing mutation for saving
- `useGetActiveBudgetQuery` - provides `budgetId` and current `variant`

## Edge Cases

1. **No budget state** - Long press does nothing (gesture not attached)
2. **Loading state** - Long press does nothing
3. **Tap during long press** - `Gesture.Exclusive()` ensures clean separation

## Design Decisions

- **Medium haptic** - Distinguishes from tap's light haptic
- **No visual indicator** - Long press is a discoverable power-user feature, matches iOS patterns
- **Reuse existing bottom sheet** - No new UI needed
