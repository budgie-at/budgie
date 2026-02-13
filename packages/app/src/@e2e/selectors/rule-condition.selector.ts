/* eslint-disable lingui/no-unlocalized-strings */
export const RuleConditionSelectors = {
    Row: (index: number) => `RuleForm.Condition.${index}.Row`,
    FieldSelector: (index: number) => `RuleForm.Condition.${index}.FieldSelector`,
    FieldSelectorValue: (index: number) => `RuleForm.Condition.${index}.FieldSelectorValue`,
    OperatorSelector: (index: number) => `RuleForm.Condition.${index}.OperatorSelector`,
    OperatorSelectorValue: (index: number) => `RuleForm.Condition.${index}.OperatorSelectorValue`,
    ValueInput: (index: number) => `RuleForm.Condition.${index}.ValueInput`,
    SecondaryValueInput: (index: number) => `RuleForm.Condition.${index}.SecondaryValueInput`,
    RemoveButton: (index: number) => `RuleForm.Condition.${index}.RemoveButton`,
    AccountSelector: (index: number) => `RuleForm.Condition.${index}.AccountSelector`,
    TransactionTypeSelector: (index: number) => `RuleForm.Condition.${index}.TransactionTypeSelector`,
    MccSelector: (index: number) => `RuleForm.Condition.${index}.MccSelector`,
    ExternalSourceSelector: (index: number) => `RuleForm.Condition.${index}.ExternalSourceSelector`
} as const;
