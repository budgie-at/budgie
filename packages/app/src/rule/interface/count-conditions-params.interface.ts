import { RuleConditionCreateInputInterface, RuleConditionMatchTypeEnum } from '@budgie/contracts';

export interface CountConditionsParamsInterface {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
}
