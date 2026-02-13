/* eslint-disable lingui/no-unlocalized-strings */
export const RuleActionSelectors = {
    Row: (index: number) => `RuleForm.Action.${index}.Row`,
    TypeSelector: (index: number) => `RuleForm.Action.${index}.TypeSelector`,
    TypeSelectorValue: (index: number) => `RuleForm.Action.${index}.TypeSelectorValue`,
    CategorySelector: (index: number) => `RuleForm.Action.${index}.CategorySelector`,
    TagSelector: (index: number) => `RuleForm.Action.${index}.TagSelector`,
    AccountSelector: (index: number) => `RuleForm.Action.${index}.AccountSelector`,
    RemoveButton: (index: number) => `RuleForm.Action.${index}.RemoveButton`
} as const;
