import { RuleConditionMatchTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const RULE_CONDITION_MATCH_TYPE_LABELS: Record<RuleConditionMatchTypeEnum, MessageDescriptor> = {
    [RuleConditionMatchTypeEnum.ALL]: msg`Match All`,
    [RuleConditionMatchTypeEnum.ANY]: msg`Match Any`
};
