import { RuleActionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { RuleActionOutcomesInterface } from '../interface/rule-action-outcomes.interface';
import type { RuleWithRelationsEntityInterface } from '@budgie/contracts';

export const extractRuleActionOutcomes = (matchingRules: RuleWithRelationsEntityInterface[]): RuleActionOutcomesInterface => {
    const allActions = matchingRules.flatMap(rule => rule.actions);

    const firstCategoryAction = allActions.find(action => action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.categoryId));

    const tagIds = [
        ...new Set(
            allActions
                .filter(action => action.type === RuleActionTypeEnum.ADD_TAG && isDefined(action.tagId))
                .map(action => action.tagId)
                .filter(isDefined)
        )
    ];

    return { categoryId: firstCategoryAction?.categoryId ?? null, tagIds };
};
