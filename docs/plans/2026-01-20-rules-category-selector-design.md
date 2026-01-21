# Rules Category Selector Replacement

## Overview

Replace the custom category selector on the rules screen with the reusable `CategorySelectorBottomSheet` used by the transaction form.

## Current State

- `RuleActionCategorySelector` uses `RuleActionBottomSheetSelector` with `RuleSelectorSheet`
- Displays as vertical list without search
- No inline category creation

## Target State

- Keep `RuleSelectorField` for display (visual consistency with other rule fields)
- Use `CategorySelectorBottomSheet` for selection UI
- Gains: 3-column grid layout, search, inline category creation
- Prevent deselection (category required once selected)

## Implementation

**File:** `packages/app/src/rule/components/rule-action-category-selector/rule-action-category-selector.tsx`

**Remove:**
- `useSearchCategoriesQuery` (bottom sheet fetches its own data)
- Options mapping logic
- `RuleActionBottomSheetSelector` usage

**Add:**
- `CategorySelectorBottomSheet` import
- `useRef` for bottom sheet control
- `onSelect` handler that filters out `null` values

**Handler logic:**
```typescript
const handleSelect = (categoryId: number | null): void => {
    if (categoryId !== null) {
        onChange(categoryId);
        bottomSheetRef.current?.close();
    }
};
```

## Scope

Single file change.
