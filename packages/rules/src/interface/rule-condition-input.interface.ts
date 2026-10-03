import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

export interface RuleConditionInputInterface {
    readonly field: RuleConditionFieldEnum;
    readonly operator: RuleConditionOperatorEnum;
    readonly value: string;
    readonly secondaryValue: string | null;
}
