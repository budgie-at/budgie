import {
    RuleConditionEntityInterface,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { evaluateRuleCondition } from './evaluate-rule-condition.util';
import { getSuggestRuleFieldValue } from './get-suggest-rule-field-value.util';

const MAX_REGEX_LENGTH = 200;

const matchStringCondition = (operator: RuleConditionOperatorEnum, fieldValue: string, conditionValue: string): boolean => {
    const fieldLower = fieldValue.toLowerCase();
    const valueLower = conditionValue.toLowerCase();

    switch (operator) {
        case RuleConditionOperatorEnum.EQUALS:
            return fieldLower === valueLower;
        case RuleConditionOperatorEnum.NOT_EQUALS:
            return fieldLower !== valueLower;
        case RuleConditionOperatorEnum.CONTAINS:
            return fieldLower.includes(valueLower);
        case RuleConditionOperatorEnum.NOT_CONTAINS:
            return !fieldLower.includes(valueLower);
        case RuleConditionOperatorEnum.MATCHES_REGEX:
            if (conditionValue.length > MAX_REGEX_LENGTH) {
                return false;
            }
            try {
                return new RegExp(conditionValue, 'iu').test(fieldValue);
            } catch {
                return false;
            }
        default:
            return false;
    }
};

const evaluateConditionForDetection = (
    condition: RuleConditionEntityInterface,
    transactionInput: TransactionCreateInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    const suggestValue = getSuggestRuleFieldValue(condition.field, suggestRuleData);

    if (isDefined(suggestValue)) {
        return matchStringCondition(condition.operator, suggestValue, condition.value);
    }

    return evaluateRuleCondition(condition, transactionInput);
};

const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: TransactionCreateInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    if (!isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

    return rule.conditions[evaluator](condition => evaluateConditionForDetection(condition, transactionInput, suggestRuleData));
};

export const hasMatchingRule = (
    rules: RuleWithRelationsEntityInterface[],
    transactionInput: TransactionCreateInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => rules.some(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));
