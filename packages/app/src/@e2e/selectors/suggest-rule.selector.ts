/* eslint-disable lingui/no-unlocalized-strings */
export const SuggestRuleSelectors = {
    Section: 'SuggestRule.Section',
    AddRuleButton: 'SuggestRule.AddRuleButton',
    BottomSheet: 'SuggestRule.BottomSheet',
    Modal: 'SuggestRule.Modal',
    ConditionChip: (field: string) => `SuggestRule.ConditionChip.${field}`,
    ApplyToExistingToggle: 'SuggestRule.ApplyToExistingToggle',
    CreateRuleButton: 'SuggestRule.CreateRuleButton',
    ConfigureRuleButton: 'SuggestRule.ConfigureRuleButton',
    NoThanksButton: 'SuggestRule.NoThanksButton'
} as const;
