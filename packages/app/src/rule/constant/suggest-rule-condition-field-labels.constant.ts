import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { MessageDescriptor } from '@lingui/core';

export const SUGGEST_RULE_CONDITION_FIELD_LABELS: Partial<Record<RuleConditionFieldEnum, MessageDescriptor>> = {
    [RuleConditionFieldEnum.TITLE]: msg`Title`,
    [RuleConditionFieldEnum.COMMENT]: msg`Comment`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC Code`
};
