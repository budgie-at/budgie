import { RuleConditionFieldEnum } from '@budgie/contracts';

export interface RulePrefillConditionInterface {
    readonly field: RuleConditionFieldEnum;
    readonly value: string;
}

export interface RulePrefillDataInterface {
    readonly conditions: RulePrefillConditionInterface[];
    readonly categoryId: number | null;
    readonly tagIds: number[];
    readonly applyToExisting: boolean;
}
