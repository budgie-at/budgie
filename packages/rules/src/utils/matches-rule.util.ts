import { RuleConditionMatchTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { evaluateRuleCondition } from './evaluate-rule-condition.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { RuleCreateInputInterface } from '@budgie/contracts';

export const matchesRule = (
    rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>,
    input: RuleEvaluationInputInterface,
    matchesCondition: (condition: RuleConditionInputInterface) => boolean = condition => evaluateRuleCondition(condition, input)
): boolean => {
    if (input.type === TransactionTypeEnum.ADJUSTMENT || !isNotEmptyArray(rule.conditions)) {
        return false;
    }

    return rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY
        ? rule.conditions.some(matchesCondition)
        : rule.conditions.every(matchesCondition);
};
