export interface RuleConditionLabelInterface {
    readonly fieldLabel: string;
    readonly field: string;
    readonly operator: string;
    readonly value: string;
    readonly listValue: string;
    readonly listOverflow: string | null;
    readonly hasValue: boolean;
    readonly sentenceTemplate: string;
    readonly phraseTemplate: string;
    readonly listTemplate: string;
}
