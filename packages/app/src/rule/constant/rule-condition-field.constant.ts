import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { MessageDescriptor } from '@lingui/core';

export const RULE_CONDITION_FIELD: Record<RuleConditionFieldEnum, MessageDescriptor> = {
    [RuleConditionFieldEnum.TITLE]: msg`Title`,
    [RuleConditionFieldEnum.COMMENT]: msg`Comment`,
    [RuleConditionFieldEnum.AMOUNT]: msg`Amount`,
    [RuleConditionFieldEnum.ACCOUNT_ID]: msg`Account`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC Code`,
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: msg`Type`,
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: msg`Source`
};
