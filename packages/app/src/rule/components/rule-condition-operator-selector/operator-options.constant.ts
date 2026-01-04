import { RuleConditionOperatorEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const OPERATOR_LABELS: Record<RuleConditionOperatorEnum, MessageDescriptor> = {
    [RuleConditionOperatorEnum.EQUALS]: msg`Equals`,
    [RuleConditionOperatorEnum.NOT_EQUALS]: msg`Not Equals`,
    [RuleConditionOperatorEnum.CONTAINS]: msg`Contains`,
    [RuleConditionOperatorEnum.NOT_CONTAINS]: msg`Not Contains`,
    [RuleConditionOperatorEnum.MATCHES_REGEX]: msg`Matches Regex`,
    [RuleConditionOperatorEnum.GREATER_THAN]: msg`Greater Than`,
    [RuleConditionOperatorEnum.LESS_THAN]: msg`Less Than`,
    [RuleConditionOperatorEnum.BETWEEN]: msg`Between`,
    [RuleConditionOperatorEnum.IN]: msg`In List`
};
