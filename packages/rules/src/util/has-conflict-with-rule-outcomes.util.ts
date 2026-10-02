import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { HasConflictParamsInterface } from '../interface/has-conflict-params.interface';

export const hasConflictWithRuleOutcomes = (params: HasConflictParamsInterface): boolean => {
    const { userCategoryId, userTagIds, ruleOutcomes, categoryChanged, tagsChanged } = params;

    const hasCategoryConflict = categoryChanged && isDefined(ruleOutcomes.categoryId) && userCategoryId !== ruleOutcomes.categoryId;

    const userTagIdSet = new Set(userTagIds);
    const hasTagConflict =
        tagsChanged && isNotEmptyArray(ruleOutcomes.tagIds) && ruleOutcomes.tagIds.some(tagId => !userTagIdSet.has(tagId));

    return hasCategoryConflict || hasTagConflict;
};
