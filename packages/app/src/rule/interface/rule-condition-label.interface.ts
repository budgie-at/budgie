export interface RuleConditionLabelInterface {
    readonly fieldLabel: string;
    readonly field: string;
    readonly operator: string;
    readonly value: string;
    readonly rawValue: string;
    readonly isQuoted: boolean;
    readonly shortPredicate: string;
    readonly hasValue: boolean;
}
