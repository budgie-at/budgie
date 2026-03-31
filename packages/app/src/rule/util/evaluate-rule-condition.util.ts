import { RuleConditionEntityInterface, RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';

const MAX_REGEX_LENGTH = 200;
const NESTED_QUANTIFIER_PATTERN = /([+*}])\)?[+*{]/u;

const hasNestedQuantifiers = (pattern: string): boolean => NESTED_QUANTIFIER_PATTERN.test(pattern);

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
            return input.entries[0]?.mccCode ?? null;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return input.type;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return input.externalSource ?? null;
        default:
            return null;
    }
};

const matchOperator = (
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
            return String(fieldValue).toLowerCase() === conditionValue.toLowerCase();

        case RuleConditionOperatorEnum.NOT_EQUALS:
            return String(fieldValue).toLowerCase() !== conditionValue.toLowerCase();

        case RuleConditionOperatorEnum.CONTAINS:
            return String(fieldValue).toLowerCase().includes(conditionValue.toLowerCase());

        case RuleConditionOperatorEnum.NOT_CONTAINS:
            return !String(fieldValue).toLowerCase().includes(conditionValue.toLowerCase());

        case RuleConditionOperatorEnum.MATCHES_REGEX:
            if (conditionValue.length > MAX_REGEX_LENGTH || hasNestedQuantifiers(conditionValue)) {
                return false;
            }
            try {
                const regex = new RegExp(conditionValue, 'iu');

                return regex.test(String(fieldValue));
            } catch {
                return false;
            }

        case RuleConditionOperatorEnum.GREATER_THAN:
            return isNumber(fieldValue) && fieldValue > Number(conditionValue);

        case RuleConditionOperatorEnum.LESS_THAN:
            return isNumber(fieldValue) && fieldValue < Number(conditionValue);

        case RuleConditionOperatorEnum.BETWEEN:
            if (!isNumber(fieldValue) || !isNotEmptyString(secondaryValue)) {
                return false;
            }

            return fieldValue >= Number(conditionValue) && fieldValue <= Number(secondaryValue);

        case RuleConditionOperatorEnum.IN: {
            const inValues = conditionValue.split(',').map(item => item.trim().toLowerCase());

            return inValues.includes(String(fieldValue).toLowerCase());
        }

        default:
            return false;
    }
};

export const evaluateRuleCondition = (
    condition: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>,
    input: RuleEvaluationInputInterface
): boolean => {
    const fieldValue = getConditionFieldValue(condition.field, input);

    return matchOperator(condition.operator, fieldValue, condition.value, condition.secondaryValue);
};
