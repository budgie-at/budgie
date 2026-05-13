import { RuleConditionMatchTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { evaluateConditionForDetection } from './evaluate-condition-for-detection.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { RuleConditionEntityInterface, RuleWithRelationsEntityInterface } from '@budgie/contracts';

export const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    if (!isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const matchesCondition = (condition: RuleConditionEntityInterface) =>
        evaluateConditionForDetection(condition, transactionInput, suggestRuleData);

    return rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY
        ? rule.conditions.some(matchesCondition)
        : rule.conditions.every(matchesCondition);
};
