# Rules Feature E2E Tests - Implementation Status

## Overview

15 Maestro E2E tests for the Rules feature. Setup flows work, rules tests need updates for iOS bottom sheet accessibility issues.

## Current State

### Completed
- [x] `config.yaml` updated with all 15 rules flows + 3 setup flows
- [x] TestID selectors verified in all rule components
- [x] `flows/setup/00.setup-account.flow.yaml` - PASSING
- [x] `flows/setup/00.setup-category.flow.yaml` - PASSING (coordinate-based taps)
- [x] `flows/setup/00.setup-tag.flow.yaml` - PASSING (coordinate-based taps)
- [x] `flows/shared/navigate-to-rules.flow.yaml` - Updated to go Home first
- [x] `flows/rules/01.rules-list-empty.flow.yaml` - PASSING
- [x] `flows/rules/02.rules-create-basic.flow.yaml` - PARTIALLY FIXED (needs more work)

### Remaining Work

#### Tests needing coordinate-based bottom sheet fixes:
- [ ] `03.rules-create-multiple-conditions.flow.yaml`
- [ ] `04.rules-create-multiple-actions.flow.yaml`
- [ ] `05.rules-edit.flow.yaml`
- [ ] `06.rules-delete.flow.yaml`
- [ ] `07.rules-toggle-enabled.flow.yaml`
- [ ] `08.rules-all-field-types.flow.yaml`
- [ ] `09.rule-applies-category.flow.yaml`
- [ ] `10.rule-applies-tag.flow.yaml`
- [ ] `11.rule-applies-multiple-actions.flow.yaml`
- [ ] `12.disabled-rule-not-applied.flow.yaml`
- [ ] `13.rule-apply-to-existing-toggle.flow.yaml`
- [ ] `14.rule-not-applied-when-condition-not-match.flow.yaml`
- [ ] `15.suggested-rule-applies-category.flow.yaml`

## Key Issue: Maestro iOS Bottom Sheet Detection

**Problem:** Maestro cannot reliably detect text/elements inside bottom sheets on iOS, even when visually present. Screenshots show elements are there, but Maestro's accessibility tree queries fail.

**Affected components:**
- Category selector bottom sheet
- Tag selector bottom sheet
- Field selector bottom sheets
- Operator selector bottom sheets

**Workaround pattern:**
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
- `RuleForm.Action.{index}.CategorySelector` - Category selector
- `RuleForm.Action.{index}.TagSelector` - Tag selector

### Suggest Rule
- `SuggestRule.BottomSheet` - Suggestion modal
- `SuggestRule.CreateRuleButton` - Quick create button

## Commands

```bash
# Run setup flows
APP_ID=com.vitalyiegorov.budgie maestro test flows/setup/

# Run single test
APP_ID=com.vitalyiegorov.budgie maestro test flows/rules/01.rules-list-empty.flow.yaml

# Run all rules tests (will fail until fixed)
APP_ID=com.vitalyiegorov.budgie maestro test flows/rules/
```

## Fix Strategy for Remaining Tests

1. **For each test file:**
   - Replace `tapOn: text: 'X'` in bottom sheets with coordinate taps
   - Replace `assertVisible: text: 'X'` with `assertVisible: id: 'X'` where possible
   - Add delay swipes before bottom sheet interactions
   - Use `RulesPage.CreateButton` testID instead of `ActionItem.0`

2. **Coordinate positions (approximate):**
   - First list item in bottom sheet: `50%, 28%`
   - Second list item: `50%, 38%`
   - Submit/Create button: `75%, 95%`
   - Input field in simple bottom sheet: `50%, 73%` (category) or `50%, 82%` (tag)

3. **Pattern for opening FAB and creating rule:**
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

## Notes

- Tests run in parallel by default with `maestro test flows/rules/` - this can cause interference
- Always navigate to Home first to ensure consistent state
- Test 15 requires CSV file pre-loaded in simulator for suggested rules
