import { RuleActionTypeEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { isValidRulePattern } from './is-valid-rule-pattern.util';

import type { RuleFormIssueInterface } from '../interface/rule-form-issue.interface';
import type { RuleCreateInputInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

const ACTION_TARGET_ISSUE: Record<RuleActionTypeEnum, MessageDescriptor> = {
    [RuleActionTypeEnum.SET_CATEGORY]: msg`Choose a category to save`,
    [RuleActionTypeEnum.ADD_TAG]: msg`Choose a tag to save`,
    [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: msg`Choose an account to save`
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

const findConditionIssue = (conditions: RuleCreateInputInterface['conditions']): RuleFormIssueInterface | null => {
    const emptyIndex = conditions.findIndex(condition => !isNotEmptyString(condition.value.trim()));

    if (emptyIndex >= 0) {
        return { message: msg`Add a value to save`, conditionIndex: emptyIndex };
    }

    const rangeIndex = conditions.findIndex(
        condition => condition.operator === RuleConditionOperatorEnum.BETWEEN && !isNotEmptyString(condition.secondaryValue?.trim())
    );

    if (rangeIndex >= 0) {
        return { message: msg`Add both amounts to save`, conditionIndex: rangeIndex };
    }

    const patternIndex = conditions.findIndex(
        condition => condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX && !isValidRulePattern(condition.value)
    );

    return patternIndex >= 0 ? { message: msg`Fix the pattern to save`, conditionIndex: patternIndex } : null;
};

export const getRuleFormIssue = (values: Pick<RuleCreateInputInterface, 'conditions' | 'actions'>): RuleFormIssueInterface | null => {
    const { conditions, actions } = values;
    const conditionIssue = findConditionIssue(conditions);

    if (isDefined(conditionIssue)) {
        return conditionIssue;
    }

    if (!isNotEmptyArray(actions)) {
        return { message: msg`Add an action to save`, conditionIndex: null };
    }

    const actionWithoutTarget = actions.find(action => !hasActionTarget(action));

    return isDefined(actionWithoutTarget) ? { message: ACTION_TARGET_ISSUE[actionWithoutTarget.type], conditionIndex: null } : null;
};
