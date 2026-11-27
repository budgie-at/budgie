import { RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { compileRuleRegex } from './compile-rule-regex.util';
import { parseRuleNumber } from './parse-rule-number.util';

import type { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';
import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';
import type { SnapshotPredicateType } from '../type/snapshot-predicate.type';
import type { RuleCreateInputInterface } from '@budgie/contracts';

const NEVER_MATCH: SnapshotPredicateType = () => false;

const getNumericFieldValue = (field: RuleConditionFieldEnum, snapshot: RuleEvaluationSnapshotInterface): number | null => {
    if (field === RuleConditionFieldEnum.AMOUNT) {
        return snapshot.amount;
    }

    if (field === RuleConditionFieldEnum.ACCOUNT_ID) {
        return snapshot.accountId;
    }

    return null;
};

const getLowerStringFieldValue = (field: RuleConditionFieldEnum, snapshot: RuleEvaluationSnapshotInterface): string | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return snapshot.lowerTitle;
        case RuleConditionFieldEnum.COMMENT:
            return snapshot.lowerComment;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return snapshot.lowerType;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return snapshot.lowerExternalSource;
        case RuleConditionFieldEnum.MCC_CODE:
            return snapshot.lowerMccCode;
        case RuleConditionFieldEnum.AMOUNT:
            return String(snapshot.amount);
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return isDefined(snapshot.accountId) ? String(snapshot.accountId) : null;
        default:
            return null;
    }
};

const getRawStringFieldValue = (field: RuleConditionFieldEnum, snapshot: RuleEvaluationSnapshotInterface): string | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return snapshot.rawTitle;
        case RuleConditionFieldEnum.COMMENT:
            return snapshot.rawComment;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return snapshot.type;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return snapshot.rawExternalSource;
        case RuleConditionFieldEnum.MCC_CODE:
            return snapshot.rawMccCode;
        case RuleConditionFieldEnum.AMOUNT:
            return String(snapshot.amount);
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return isDefined(snapshot.accountId) ? String(snapshot.accountId) : null;
        default:
            return null;
    }
};

const isNumericField = (field: RuleConditionFieldEnum): boolean =>
    field === RuleConditionFieldEnum.AMOUNT || field === RuleConditionFieldEnum.ACCOUNT_ID;

const compileNumericEquality = (field: RuleConditionFieldEnum, value: string, isEquals: boolean): SnapshotPredicateType => {
    const parsedNumber = parseRuleNumber(value);

    if (!isDefined(parsedNumber)) {
        return isEquals ? NEVER_MATCH : snapshot => isDefined(getNumericFieldValue(field, snapshot));
    }

    return snapshot => {
        const fieldValue = getNumericFieldValue(field, snapshot);

        return isDefined(fieldValue) && (isEquals ? fieldValue === parsedNumber : fieldValue !== parsedNumber);
    };
};

const compileInCondition = (field: RuleConditionFieldEnum, value: string): SnapshotPredicateType => {
    const lowerValues = value
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(isNotEmptyString);

    if (!isNotEmptyArray(lowerValues)) {
        return NEVER_MATCH;
    }

    if (isNumericField(field)) {
        const numberSet = new Set(lowerValues.map(parseRuleNumber).filter(isDefined));

        if (numberSet.size === 0) {
            return NEVER_MATCH;
        }

        return snapshot => {
            const fieldValue = getNumericFieldValue(field, snapshot);

            return isDefined(fieldValue) && numberSet.has(fieldValue);
        };
    }

    const stringSet = new Set(lowerValues);

    return snapshot => {
        const fieldValue = getLowerStringFieldValue(field, snapshot);

        return isDefined(fieldValue) && stringSet.has(fieldValue);
    };
};

const compileRangeCondition = (condition: RuleConditionInputInterface): SnapshotPredicateType => {
    if (!isNumericField(condition.field)) {
        return NEVER_MATCH;
    }

    const minValue = parseRuleNumber(condition.value);

    if (!isDefined(minValue)) {
        return NEVER_MATCH;
    }

    if (condition.operator === RuleConditionOperatorEnum.GREATER_THAN) {
        return snapshot => {
            const fieldValue = getNumericFieldValue(condition.field, snapshot);

            return isDefined(fieldValue) && fieldValue > minValue;
        };
    }

    if (condition.operator === RuleConditionOperatorEnum.LESS_THAN) {
        return snapshot => {
            const fieldValue = getNumericFieldValue(condition.field, snapshot);

            return isDefined(fieldValue) && fieldValue < minValue;
        };
    }

    const maxValue = parseRuleNumber(condition.secondaryValue);

    if (!isDefined(maxValue) || minValue > maxValue) {
        return NEVER_MATCH;
    }

    return snapshot => {
        const fieldValue = getNumericFieldValue(condition.field, snapshot);

        return isDefined(fieldValue) && fieldValue >= minValue && fieldValue <= maxValue;
    };
};

const compileCondition = (condition: RuleConditionInputInterface): SnapshotPredicateType => {
    const lowerValue = condition.value.toLowerCase();

    switch (condition.operator) {
        case RuleConditionOperatorEnum.EQUALS:
            return isNumericField(condition.field)
                ? compileNumericEquality(condition.field, condition.value, true)
                : snapshot => {
                      const fieldValue = getLowerStringFieldValue(condition.field, snapshot);

                      return isDefined(fieldValue) && fieldValue === lowerValue;
                  };

        case RuleConditionOperatorEnum.NOT_EQUALS:
            return isNumericField(condition.field)
                ? compileNumericEquality(condition.field, condition.value, false)
                : snapshot => {
                      const fieldValue = getLowerStringFieldValue(condition.field, snapshot);

                      return isDefined(fieldValue) && fieldValue !== lowerValue;
                  };

        case RuleConditionOperatorEnum.CONTAINS:
            return snapshot => {
                const fieldValue = getLowerStringFieldValue(condition.field, snapshot);

                return isDefined(fieldValue) && fieldValue.includes(lowerValue);
            };

        case RuleConditionOperatorEnum.NOT_CONTAINS:
            return snapshot => {
                const fieldValue = getLowerStringFieldValue(condition.field, snapshot);

                return isDefined(fieldValue) && !fieldValue.includes(lowerValue);
            };

        case RuleConditionOperatorEnum.MATCHES_REGEX: {
            const regex = compileRuleRegex(condition.value);

            if (!isDefined(regex)) {
                return NEVER_MATCH;
            }

            return snapshot => {
                const fieldValue = getRawStringFieldValue(condition.field, snapshot);

                return isDefined(fieldValue) && regex.test(fieldValue);
            };
        }

        case RuleConditionOperatorEnum.GREATER_THAN:
        case RuleConditionOperatorEnum.LESS_THAN:
        case RuleConditionOperatorEnum.BETWEEN:
            return compileRangeCondition(condition);

        case RuleConditionOperatorEnum.IN:
            return compileInCondition(condition.field, condition.value);

        default:
            return NEVER_MATCH;
    }
};

const getConditionCost = (condition: RuleConditionInputInterface): number => {
    if (condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX) {
        return 3;
    }

    if (condition.operator === RuleConditionOperatorEnum.CONTAINS || condition.operator === RuleConditionOperatorEnum.NOT_CONTAINS) {
        return 2;
    }

    if (isNumericField(condition.field) || condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE) {
        return 0;
    }

    return 1;
};

export const compileRule = (rule: Pick<RuleCreateInputInterface, 'conditions' | 'conditionMatchType'>): SnapshotPredicateType => {
    if (!isNotEmptyArray(rule.conditions)) {
        return NEVER_MATCH;
    }

    const orderedPredicates = [...rule.conditions]
        .sort((left, right) => getConditionCost(left) - getConditionCost(right))
        .map(compileCondition);

    if (orderedPredicates.length === 1) {
        const [singlePredicate] = orderedPredicates;

        return snapshot => snapshot.type !== TransactionTypeEnum.ADJUSTMENT && singlePredicate(snapshot);
    }

    return rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY
        ? snapshot => snapshot.type !== TransactionTypeEnum.ADJUSTMENT && orderedPredicates.some(predicate => predicate(snapshot))
        : snapshot => snapshot.type !== TransactionTypeEnum.ADJUSTMENT && orderedPredicates.every(predicate => predicate(snapshot));
};
