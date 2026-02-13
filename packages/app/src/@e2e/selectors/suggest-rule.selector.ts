/* eslint-disable lingui/no-unlocalized-strings */
export const SuggestRuleSelectors = {
    Pill: 'SuggestRule.Pill',
    AddRuleButton: 'SuggestRule.AddRuleButton',
    Modal: 'SuggestRule.Modal',
    ConditionChip: (field: string) => `SuggestRule.ConditionChip.${field}`,
    ApplyToExistingToggle: 'SuggestRule.ApplyToExistingToggle',
    CreateRuleButton: 'SuggestRule.CreateRuleButton'
} as const;
