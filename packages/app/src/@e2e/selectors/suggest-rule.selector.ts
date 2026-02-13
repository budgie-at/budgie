/* eslint-disable lingui/no-unlocalized-strings */
export const SuggestRuleSelectors = {
    Pill: 'SuggestRule.Pill',
    AddRuleButton: 'SuggestRule.AddRuleButton',
    BottomSheet: 'SuggestRule.BottomSheet',
    ConditionChip: (field: string) => `SuggestRule.ConditionChip.${field}`,
    ApplyToExistingToggle: 'SuggestRule.ApplyToExistingToggle',
    CreateRuleButton: 'SuggestRule.CreateRuleButton',
    ConfigureRuleButton: 'SuggestRule.ConfigureRuleButton',
    NoThanksButton: 'SuggestRule.NoThanksButton'
} as const;
