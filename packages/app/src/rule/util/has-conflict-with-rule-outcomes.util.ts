import { isDefined } from '@rnw-community/shared';

import { RuleActionOutcomesInterface } from '../interface/rule-action-outcomes.interface';

interface HasConflictParams {
    readonly userCategoryId: number | null;
    readonly userTagIds: number[];
    readonly ruleOutcomes: RuleActionOutcomesInterface;
    readonly categoryChanged: boolean;
    readonly tagsChanged: boolean;
}

export const hasConflictWithRuleOutcomes = (params: HasConflictParams): boolean => {
    const { userCategoryId, userTagIds, ruleOutcomes, categoryChanged, tagsChanged } = params;

    const hasCategoryConflict = categoryChanged && isDefined(ruleOutcomes.categoryId) && userCategoryId !== ruleOutcomes.categoryId;

    const ruleTagIdSet = new Set(ruleOutcomes.tagIds);
    const userTagIdSet = new Set(userTagIds);
    const hasTagConflict =
        tagsChanged &&
        ruleOutcomes.tagIds.length > 0 &&
        (ruleTagIdSet.size !== userTagIdSet.size || ruleOutcomes.tagIds.some(tagId => !userTagIdSet.has(tagId)));

    return hasCategoryConflict || hasTagConflict;
};
