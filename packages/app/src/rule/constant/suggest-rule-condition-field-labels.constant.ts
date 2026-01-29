import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

export const SUGGEST_RULE_CONDITION_FIELD_LABELS = {
    [RuleConditionFieldEnum.TITLE]: msg`Title`,
    [RuleConditionFieldEnum.COMMENT]: msg`Comment`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC Code`
};
