import { RuleConditionFieldEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { evaluateRuleCondition, matchOperator } from './evaluate-rule-condition.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { RuleConditionEntityInterface } from '@budgie/contracts';

const getSuggestRuleFieldValue = (
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

export const evaluateConditionForDetection = (
    condition: RuleConditionEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    const suggestValue = getSuggestRuleFieldValue(condition.field, suggestRuleData);

    if (isDefined(suggestValue)) {
        return matchOperator(condition.operator, suggestValue, condition.value, condition.secondaryValue);
    }

    return evaluateRuleCondition(condition, transactionInput);
};
