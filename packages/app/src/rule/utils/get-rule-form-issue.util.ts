import { RuleActionTypeEnum, RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { isValidRulePattern, parseRuleNumber } from '@budgie/rules';
import { msg } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { RuleFormIssueInterface } from '../interface/rule-form-issue.interface';
import type { RuleCreateInputInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

const ACTION_TARGET_ISSUE: Record<RuleActionTypeEnum, MessageDescriptor> = {
    [RuleActionTypeEnum.SET_CATEGORY]: msg`Choose a category to continue`,
    [RuleActionTypeEnum.ADD_TAG]: msg`Choose a tag to continue`,
    [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: msg`Choose an account to continue`
};

const hasActionTarget = (action: RuleCreateInputInterface['actions'][number]) => {
    switch (action.type) {
        case RuleActionTypeEnum.SET_CATEGORY:
            return isDefined(action.categoryId);
        case RuleActionTypeEnum.ADD_TAG:
            return isDefined(action.tagId);
        case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
        default:
            return isDefined(action.accountId);
    }
};

const isInvalidBetweenRange = (condition: RuleCreateInputInterface['conditions'][number]): boolean => {
    if (condition.operator !== RuleConditionOperatorEnum.BETWEEN) {
        return false;
    }

    const minValue = parseRuleNumber(condition.value);
    const maxValue = parseRuleNumber(condition.secondaryValue);

    return !isDefined(minValue) || !isDefined(maxValue) || minValue > maxValue;
};

const isInvalidAmountValue = (condition: RuleCreateInputInterface['conditions'][number]): boolean =>
    condition.field === RuleConditionFieldEnum.AMOUNT && !isDefined(parseRuleNumber(condition.value));

const findConditionIssue = (conditions: RuleCreateInputInterface['conditions']): RuleFormIssueInterface | null => {
    const emptyIndex = conditions.findIndex(condition => !isNotEmptyString(condition.value.trim()) || isInvalidAmountValue(condition));

    if (emptyIndex >= 0) {
        return { message: msg`Add a value to continue`, conditionIndex: emptyIndex };
    }

    const rangeIndex = conditions.findIndex(isInvalidBetweenRange);

    if (rangeIndex >= 0) {
        return { message: msg`Add both amounts to continue`, conditionIndex: rangeIndex };
    }

    const patternIndex = conditions.findIndex(
        condition => condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX && !isValidRulePattern(condition.value)
    );

    return patternIndex >= 0 ? { message: msg`Fix the pattern to continue`, conditionIndex: patternIndex } : null;
};

export const getRuleFormIssue = (values: Pick<RuleCreateInputInterface, 'conditions' | 'actions'>): RuleFormIssueInterface | null => {
    const { conditions, actions } = values;
    const conditionIssue = findConditionIssue(conditions);

    if (isDefined(conditionIssue)) {
        return conditionIssue;
    }

    if (!isNotEmptyArray(actions)) {
        return { message: msg`Add an action to continue`, conditionIndex: null };
    }

    const actionWithoutTarget = actions.find(action => !hasActionTarget(action));

    return isDefined(actionWithoutTarget) ? { message: ACTION_TARGET_ISSUE[actionWithoutTarget.type], conditionIndex: null } : null;
};
