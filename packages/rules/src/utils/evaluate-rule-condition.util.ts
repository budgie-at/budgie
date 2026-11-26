import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { compileRuleRegex } from './compile-rule-regex.util';
import { parseRuleNumber } from './parse-rule-number.util';
import { resolveRuleMccCode } from './resolve-rule-mcc-code.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';

const getConditionFieldValue = (field: RuleConditionFieldEnum, input: RuleEvaluationInputInterface): string | number | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return input.title;
        case RuleConditionFieldEnum.COMMENT:
            return input.comment;
        case RuleConditionFieldEnum.AMOUNT:
            return input.amount;
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return input.fromAccountId ?? input.toAccountId;
        case RuleConditionFieldEnum.MCC_CODE:
            return resolveRuleMccCode(input.entries);
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return input.type;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return input.externalSource ?? null;
        default:
            return null;
    }
};

const matchNumericEquality = (fieldValue: number, conditionValue: string, isEquals: boolean): boolean => {
    const parsedNumber = parseRuleNumber(conditionValue);

    if (!isDefined(parsedNumber)) {
        return !isEquals;
    }

    return isEquals ? fieldValue === parsedNumber : fieldValue !== parsedNumber;
};

const matchInOperator = (fieldValue: string | number, conditionValue: string): boolean => {
    const inValues = conditionValue
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(isNotEmptyString);

    if (!isNotEmptyArray(inValues)) {
        return false;
    }

    if (isNumber(fieldValue)) {
        return inValues.some(item => parseRuleNumber(item) === fieldValue);
    }

    return inValues.includes(fieldValue.toLowerCase());
};

export const matchOperator = (
    operator: RuleConditionOperatorEnum,
    fieldValue: string | number | null,
    conditionValue: string,
    secondaryValue: string | null
): boolean => {
    if (!isDefined(fieldValue)) {
        return false;
    }

    switch (operator) {
        case RuleConditionOperatorEnum.EQUALS:
            return isNumber(fieldValue)
                ? matchNumericEquality(fieldValue, conditionValue, true)
                : fieldValue.toLowerCase() === conditionValue.toLowerCase();

        case RuleConditionOperatorEnum.NOT_EQUALS:
            return isNumber(fieldValue)
                ? matchNumericEquality(fieldValue, conditionValue, false)
                : fieldValue.toLowerCase() !== conditionValue.toLowerCase();

        case RuleConditionOperatorEnum.CONTAINS:
            return String(fieldValue).toLowerCase().includes(conditionValue.toLowerCase());

        case RuleConditionOperatorEnum.NOT_CONTAINS:
            return !String(fieldValue).toLowerCase().includes(conditionValue.toLowerCase());

        case RuleConditionOperatorEnum.MATCHES_REGEX: {
            const regex = compileRuleRegex(conditionValue);

            return isDefined(regex) && regex.test(String(fieldValue));
        }

        case RuleConditionOperatorEnum.GREATER_THAN: {
            const threshold = parseRuleNumber(conditionValue);

            return isNumber(fieldValue) && isDefined(threshold) && fieldValue > threshold;
        }

        case RuleConditionOperatorEnum.LESS_THAN: {
            const threshold = parseRuleNumber(conditionValue);

            return isNumber(fieldValue) && isDefined(threshold) && fieldValue < threshold;
        }

        case RuleConditionOperatorEnum.BETWEEN: {
            const minValue = parseRuleNumber(conditionValue);
            const maxValue = parseRuleNumber(secondaryValue);

            return isNumber(fieldValue) && isDefined(minValue) && isDefined(maxValue) && fieldValue >= minValue && fieldValue <= maxValue;
        }

        case RuleConditionOperatorEnum.IN:
            return matchInOperator(fieldValue, conditionValue);

        default:
            return false;
    }
};

export const evaluateRuleCondition = (condition: RuleConditionInputInterface, input: RuleEvaluationInputInterface): boolean => {
    const fieldValue = getConditionFieldValue(condition.field, input);

    return matchOperator(condition.operator, fieldValue, condition.value, condition.secondaryValue);
};
