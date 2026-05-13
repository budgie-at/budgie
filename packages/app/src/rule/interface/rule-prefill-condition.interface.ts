import type { RuleConditionFieldEnum } from '@budgie/contracts';

export interface RulePrefillConditionInterface {
    readonly field: RuleConditionFieldEnum;
    readonly value: string;
}
