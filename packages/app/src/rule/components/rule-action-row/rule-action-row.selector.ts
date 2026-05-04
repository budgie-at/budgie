export const RuleActionRowSelector = {
    Row: (index: number) => `RuleForm.Action.${index}.Row` as const,
    TypeSelector: (index: number) => `RuleForm.Action.${index}.TypeSelector` as const,
    CategorySelector: (index: number) => `RuleForm.Action.${index}.CategorySelector` as const,
    TagSelector: (index: number) => `RuleForm.Action.${index}.TagSelector` as const,
    AccountSelector: (index: number) => `RuleForm.Action.${index}.AccountSelector` as const,
    RemoveButton: (index: number) => `RuleForm.Action.${index}.RemoveButton` as const
} as const;
