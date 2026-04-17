export const RulesPageSelectors = {
    Page: 'RulesPage.Page',
    Header: 'RulesPage.Header',
    HeaderTitle: 'RulesPage.Header.Title',
    EmptyState: 'RulesPage.EmptyState',
    EmptyStateTitle: 'RulesPage.EmptyState.Title',
    List: 'RulesPage.List',
    CreateButton: 'RulesPage.CreateButton'
} as const;

export const RuleCardSelectors = {
    Card: (index: number) => `RulesPage.RuleCard.${index}`,
    DeleteAction: (index: number) => `RulesPage.RuleCard.${index}.DeleteAction`,
    EnabledSwitch: (index: number) => `RulesPage.RuleCard.${index}.EnabledSwitch`,
    OrderBadge: (index: number) => `RulesPage.RuleCard.${index}.OrderBadge`,
    ConditionsText: (index: number) => `RulesPage.RuleCard.${index}.Conditions`,
    ActionsText: (index: number) => `RulesPage.RuleCard.${index}.Actions`
} as const;
