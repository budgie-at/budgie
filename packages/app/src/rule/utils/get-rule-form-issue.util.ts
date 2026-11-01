import { RuleActionTypeEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { isValidRulePattern } from './is-valid-rule-pattern.util';

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

export const getRuleFormIssue = (values: Pick<RuleCreateInputInterface, 'conditions' | 'actions'>): MessageDescriptor | null => {
    const { conditions, actions } = values;

    if (conditions.some(condition => !isNotEmptyString(condition.value.trim()))) {
        return msg`Add a value to save`;
    }

    if (
        conditions.some(
            condition => condition.operator === RuleConditionOperatorEnum.BETWEEN && !isNotEmptyString(condition.secondaryValue?.trim())
        )
    ) {
        return msg`Add both amounts to save`;
    }

    if (
        conditions.some(condition => condition.operator === RuleConditionOperatorEnum.MATCHES_REGEX && !isValidRulePattern(condition.value))
    ) {
        return msg`Fix the pattern to save`;
    }

    if (!isNotEmptyArray(actions)) {
        return msg`Add an action to save`;
    }

    const actionWithoutTarget = actions.find(action => !hasActionTarget(action));

    return isDefined(actionWithoutTarget) ? ACTION_TARGET_ISSUE[actionWithoutTarget.type] : null;
};
