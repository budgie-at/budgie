export interface RuleConditionLabelInterface {
    readonly fieldLabel: string;
    readonly field: string;
    readonly operator: string;
    readonly value: string;
    readonly listValue: string;
    readonly shortPredicate: string;
    readonly hasValue: boolean;
    readonly sentenceTemplate: string;
    readonly phraseTemplate: string;
}
