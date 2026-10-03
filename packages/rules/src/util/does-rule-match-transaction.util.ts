import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { evaluateRuleCondition, matchOperator } from './evaluate-rule-condition.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { RuleConditionEntityInterface, RuleWithRelationsEntityInterface } from '@budgie/contracts';

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

export const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    if (transactionInput.type === TransactionTypeEnum.ADJUSTMENT || !isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const matchesCondition = (condition: RuleConditionEntityInterface) => {
        const suggestValue = getSuggestRuleFieldValue(condition.field, suggestRuleData);

        return isDefined(suggestValue)
            ? matchOperator(condition.operator, suggestValue, condition.value, condition.secondaryValue)
            : evaluateRuleCondition(condition, transactionInput);
    };

    return rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY
        ? rule.conditions.some(matchesCondition)
        : rule.conditions.every(matchesCondition);
};
