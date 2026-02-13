import { RuleConditionOperatorEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const RULE_CONDITION_OPERATOR: Record<RuleConditionOperatorEnum, MessageDescriptor> = {
    [RuleConditionOperatorEnum.EQUALS]: msg`equals`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`not equals`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`contains`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`not contains`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`matches`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`>`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`<`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`between`,
    [RuleConditionOperatorEnum.IN]: msg`in`
};
