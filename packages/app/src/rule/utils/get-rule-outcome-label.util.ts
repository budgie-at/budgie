import { RuleActionTypeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import type { RuleActionWithRelationsEntityInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

const OUTCOME_SEPARATOR = ' · ';

const getActionOutcome = (action: RuleActionWithRelationsEntityInterface, translate: (descriptor: MessageDescriptor) => string) => {
    const accountTitle = action.account?.title ?? '';

    switch (action.type) {
        case RuleActionTypeEnum.SET_CATEGORY:
            return action.category?.title ?? '';
        case RuleActionTypeEnum.ADD_TAG:
            return isNotEmptyString(action.tag?.title) ? `#${action.tag.title}` : '';
        case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
        default:
            return translate(msg`Transfer to ${accountTitle}`);
    }
};

export const getRuleOutcomeLabel = (
    actions: readonly RuleActionWithRelationsEntityInterface[],
    translate: (descriptor: MessageDescriptor) => string
): string =>
    actions
        .map(action => getActionOutcome(action, translate))
        .filter(isNotEmptyString)
        .join(OUTCOME_SEPARATOR);
