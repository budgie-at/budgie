export const RuleConditionRowSelector = {
    Row: (index: number) => `RuleForm.Condition.${index}.Row` as const,
    FieldSelector: (index: number) => `RuleForm.Condition.${index}.FieldSelector` as const,
    OperatorSelector: (index: number) => `RuleForm.Condition.${index}.OperatorSelector` as const,
    ValueInput: (index: number) => `RuleForm.Condition.${index}.ValueInput` as const,
    SecondaryValueInput: (index: number) => `RuleForm.Condition.${index}.SecondaryValueInput` as const,
    RemoveButton: (index: number) => `RuleForm.Condition.${index}.RemoveButton` as const
} as const;
