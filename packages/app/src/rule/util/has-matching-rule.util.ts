import { RuleConditionEntityInterface, RuleConditionMatchTypeEnum, RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { evaluateRuleCondition, matchOperator } from './evaluate-rule-condition.util';
import { getSuggestRuleFieldValue } from './get-suggest-rule-field-value.util';

const evaluateConditionForDetection = (
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

export const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    if (!isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

    return rule.conditions[evaluator](condition => evaluateConditionForDetection(condition, transactionInput, suggestRuleData));
};
