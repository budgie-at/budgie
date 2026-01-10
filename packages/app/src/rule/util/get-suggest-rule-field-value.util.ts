import { RuleConditionFieldEnum } from '@budgie/contracts';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

export const getSuggestRuleFieldValue = (field: RuleConditionFieldEnum, data: SuggestRuleDataInterface): string => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return data.title;
        case RuleConditionFieldEnum.COMMENT:
            return data.comment ?? '';
        case RuleConditionFieldEnum.MCC_CODE:
            return data.mccCode ?? '';
        default:
            return '';
    }
};
