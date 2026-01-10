import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

export const SUGGEST_RULE_FIELD_LABELS = {
    [RuleConditionFieldEnum.TITLE]: msg`title`,
    [RuleConditionFieldEnum.COMMENT]: msg`comment`,
    [RuleConditionFieldEnum.AMOUNT]: msg`amount`,
    [RuleConditionFieldEnum.ACCOUNT_ID]: msg`account`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC code`,
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: msg`type`,
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: msg`source`
};
