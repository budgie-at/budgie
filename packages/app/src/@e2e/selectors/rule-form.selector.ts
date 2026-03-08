/* eslint-disable lingui/no-unlocalized-strings */
export const RuleFormSelectors = {
    Page: 'RuleForm.Page',
    Header: 'RuleForm.Header',
    SubmitButton: 'RuleForm.Footer.SubmitButton',
    DeleteButton: 'RuleForm.Footer.DeleteButton',
    ConditionSectionHeader: 'RuleForm.ConditionSection.Header',
    ConditionAddButton: 'RuleForm.ConditionSection.AddButton',
    ActionSectionHeader: 'RuleForm.ActionSection.Header',
    ActionAddButton: 'RuleForm.ActionSection.AddButton',
    MatchTypeSelector: 'RuleForm.ConditionMatchType',
    SelectorCard: (identifier: string) => `RuleForm.SelectorCard.${identifier}`
} as const;
