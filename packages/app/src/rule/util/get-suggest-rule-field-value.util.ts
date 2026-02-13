import { RuleConditionFieldEnum } from '@budgie/contracts';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

export const getSuggestRuleFieldValue = (
    field: RuleConditionFieldEnum,
    data: Pick<SuggestRuleDataInterface, 'title' | 'comment' | 'mccCode'>
): string | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return data.title;
        case RuleConditionFieldEnum.COMMENT:
            return data.comment;
        case RuleConditionFieldEnum.MCC_CODE:
            return data.mccCode;
        default:
            return null;
    }
};
