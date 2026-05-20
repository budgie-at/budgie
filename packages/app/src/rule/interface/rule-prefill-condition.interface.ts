import type { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

export interface RulePrefillConditionInterface {
    readonly field: RuleConditionFieldEnum;
    readonly operator: RuleConditionOperatorEnum;
    readonly value: string;
}
