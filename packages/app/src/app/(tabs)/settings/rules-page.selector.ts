export const RulesPageSelector = {
    Page: 'RulesPage.Page',
    EmptyState: 'RulesPage.EmptyState',
    CreateButton: 'RulesPage.CreateButton',
    RuleCard: (index: number) => `RulesPage.RuleCard.${index}` as const,
    RuleCardEnabledSwitch: (index: number) => `RulesPage.RuleCard.${index}.EnabledSwitch` as const,
    RuleCardOrderBadge: (index: number) => `RulesPage.RuleCard.${index}.OrderBadge` as const,
    RuleCardConditions: (index: number) => `RulesPage.RuleCard.${index}.Conditions` as const,
    RuleCardActions: (index: number) => `RulesPage.RuleCard.${index}.Actions` as const
} as const;
