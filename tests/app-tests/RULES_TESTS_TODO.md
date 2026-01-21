# Rules Feature E2E Tests - Implementation Status

## Overview

15 Maestro E2E tests for the Rules feature. All tests updated to use coordinate-based taps for iOS bottom sheet accessibility issues.

## Current State

### Completed
- [x] `config.yaml` updated with all 15 rules flows + 3 setup flows
- [x] TestID selectors verified in all rule components
- [x] `flows/setup/00.setup-account.flow.yaml` - PASSING
- [x] `flows/setup/00.setup-category.flow.yaml` - PASSING (coordinate-based taps)
- [x] `flows/setup/00.setup-tag.flow.yaml` - PASSING (coordinate-based taps)
- [x] `flows/shared/navigate-to-rules.flow.yaml` - Updated to go Home first
- [x] `flows/rules/01.rules-list-empty.flow.yaml` - PASSING
- [x] `flows/rules/02.rules-create-basic.flow.yaml` - FIXED (coordinate-based taps)
- [x] `flows/rules/03.rules-create-multiple-conditions.flow.yaml` - FIXED
- [x] `flows/rules/04.rules-create-multiple-actions.flow.yaml` - FIXED
- [x] `flows/rules/05.rules-edit.flow.yaml` - FIXED
- [x] `flows/rules/06.rules-delete.flow.yaml` - FIXED
- [x] `flows/rules/07.rules-toggle-enabled.flow.yaml` - FIXED
- [x] `flows/rules/08.rules-all-field-types.flow.yaml` - FIXED
- [x] `flows/rules/09.rule-applies-category.flow.yaml` - FIXED
- [x] `flows/rules/10.rule-applies-tag.flow.yaml` - FIXED
- [x] `flows/rules/11.rule-applies-multiple-actions.flow.yaml` - FIXED
- [x] `flows/rules/12.disabled-rule-not-applied.flow.yaml` - FIXED
- [x] `flows/rules/13.rule-apply-to-existing-toggle.flow.yaml` - FIXED
- [x] `flows/rules/14.rule-not-applied-when-condition-not-match.flow.yaml` - FIXED
- [x] `flows/rules/15.suggested-rule-applies-category.flow.yaml` - FIXED (requires CSV file setup)

## Key Issue: Maestro iOS Bottom Sheet Detection

**Problem:** Maestro cannot reliably detect text/elements inside bottom sheets on iOS, even when visually present. Screenshots show elements are there, but Maestro's accessibility tree queries fail.

**Affected components:**
- Category selector bottom sheet
- Tag selector bottom sheet
- Field selector bottom sheets
- Operator selector bottom sheets
- Action type selector bottom sheets

**Workaround pattern (applied to all tests):**
```yaml
# Instead of:
- tapOn:
    text: 'Test Category'

# Use coordinate-based taps:
- swipe:
    start: 50%, 50%
    end: 50%, 51%
    duration: 2000  # Wait for bottom sheet animation
- tapOn:
    point: 50%, 28%  # Tap at specific position
```

## TestID Reference

### Rules Page
- `RulesPage.Page` - Main container
- `RulesPage.CreateButton` - FAB action for creating rules
- `RulesPage.RuleCard.{index}` - Rule cards (0-indexed)
- `RulesPage.RuleCard.{index}.EnabledSwitch` - Toggle switch

### Rule Form
- `RuleForm.Page` - Form container
- `RuleForm.Footer.SubmitButton` - Create/Save button
- `RuleForm.Condition.{index}.ValueInput` - Condition value input
- `RuleForm.Condition.{index}.FieldSelector` - Field selector
- `RuleForm.Condition.{index}.OperatorSelector` - Operator selector
- `RuleForm.ConditionSection.AddButton` - Add condition button
- `RuleForm.Action.{index}.CategorySelector` - Category selector
- `RuleForm.Action.{index}.TagSelector` - Tag selector
- `RuleForm.Action.{index}.TypeSelector` - Action type selector
- `RuleForm.ActionSection.AddButton` - Add action button
- `RuleForm.ApplyToExistingToggle` - Apply to existing toggle

### Suggest Rule
- `SuggestRule.BottomSheet` - Suggestion modal
- `SuggestRule.AddRuleButton` - Add rule button on transaction form
- `SuggestRule.CreateRuleButton` - Quick create button
- `SuggestRule.ConditionChip.COMMENT` - Comment condition chip
- `SuggestRule.ApplyToExistingToggle` - Apply to existing toggle

## Commands

```bash
# Run setup flows
APP_ID=com.vitalyiegorov.budgie maestro test flows/setup/

# Run single test
APP_ID=com.vitalyiegorov.budgie maestro test flows/rules/01.rules-list-empty.flow.yaml

# Run all rules tests
APP_ID=com.vitalyiegorov.budgie maestro test flows/rules/
```

## Fix Patterns Applied

1. **FAB menu pattern:**
```yaml
- tapOn:
    id: 'CreateTransactionTrigger'
- extendedWaitUntil:
    visible:
      id: 'RulesPage.CreateButton'
    timeout: 3000
- waitForAnimationToEnd
- tapOn:
    id: 'RulesPage.CreateButton'
```

2. **Bottom sheet selection:**
```yaml
- tapOn:
    id: 'RuleForm.Action.0.CategorySelector'
# Wait for bottom sheet to open
- swipe:
    start: 50%, 50%
    end: 50%, 51%
    duration: 2000
# Tap on the first item (around 28% from top)
- tapOn:
    point: 50%, 28%
# Wait for bottom sheet to close
- swipe:
    start: 50%, 50%
    end: 50%, 51%
    duration: 1500
```

3. **Coordinate positions:**
   - First list item in bottom sheet: `50%, 28%`
   - Second list item: `50%, 38%`
   - Submit button: Use testID `RuleForm.Footer.SubmitButton`

## Notes

- Tests run in parallel by default with `maestro test flows/rules/` - this can cause interference
- Always navigate to Home first to ensure consistent state
- Test 15 requires CSV file pre-loaded in simulator for suggested rules:
  ```bash
  xcrun simctl addmedia booted tests/app-tests/fixtures/test-transactions.csv
  ```
