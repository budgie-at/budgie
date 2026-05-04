export const RuleFormSelector = {
    SubmitButton: 'RuleForm.Footer.SubmitButton',
    DeleteButton: 'RuleForm.Footer.DeleteButton',
    ConditionSectionHeader: 'RuleForm.ConditionSection.Header',
    ConditionAddButton: 'RuleForm.ConditionSection.AddButton',
    ActionSectionHeader: 'RuleForm.ActionSection.Header',
    ActionAddButton: 'RuleForm.ActionSection.AddButton',
    MatchTypeSelector: 'RuleForm.ConditionMatchType',
    SelectorCard: (identifier: string) => `RuleForm.SelectorCard.${identifier}` as const
} as const;
