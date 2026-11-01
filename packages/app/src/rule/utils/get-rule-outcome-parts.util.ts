import { RuleActionTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import type { RuleActionWithRelationsEntityInterface } from '@budgie/contracts';

const getActionOutcome = (action: RuleActionWithRelationsEntityInterface): string => {
    switch (action.type) {
        case RuleActionTypeEnum.SET_CATEGORY:
            return action.category?.title ?? '';
        case RuleActionTypeEnum.ADD_TAG:
            return isNotEmptyString(action.tag?.title) ? `#${action.tag.title}` : '';
        case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
        default:
            return action.account?.title ?? '';
    }
};

export const getRuleOutcomeParts = (actions: readonly RuleActionWithRelationsEntityInterface[]): string[] =>
    actions.map(getActionOutcome).filter(isNotEmptyString);
