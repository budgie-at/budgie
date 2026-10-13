import { RuleActionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { RuleCreateInputInterface } from '@budgie/contracts';

export const buildCategoryTagActions = (categoryId: number | null, tagIds: readonly number[]): RuleCreateInputInterface['actions'] => [
    ...(isPositiveNumber(categoryId) ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId, tagId: null, accountId: null }] : []),
    ...tagIds.filter(isPositiveNumber).map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG as const,
        categoryId: null,
        tagId,
        accountId: null
    }))
];
