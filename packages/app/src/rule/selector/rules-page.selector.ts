export const RulesPageSelector = {
    Page: 'RulesPage.Page',
    CreateButton: 'RulesPage.CreateButton',
    EmptyState: 'RulesPage.EmptyState',
    MatchingRulesFilter: 'RulesPage.MatchingRulesFilter',
    RuleCard: (index: number) => `RulesPage.RuleCard.${index}`,
    RuleCardEnabledSwitch: (index: number) => `RulesPage.RuleCardEnabledSwitch.${index}`,
    RuleCardConditions: (index: number) => `RulesPage.RuleCardConditions.${index}`,
    RuleCardActions: (index: number) => `RulesPage.RuleCardActions.${index}`
};
