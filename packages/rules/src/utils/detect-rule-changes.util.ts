import { isDefined } from '@rnw-community/shared';

import type { RuleChangesInterface } from '../interface/rule-changes.interface';

export const detectRuleChanges = (
    categoryId: number | null,
    originalCategoryId: number | null,
    tagIds: readonly number[],
    originalTagIds: readonly number[]
): RuleChangesInterface => {
    const sortedTagIds = [...tagIds].sort((left, right) => left - right);
    const sortedOriginalTagIds = [...originalTagIds].sort((left, right) => left - right);

    return {
        categoryChanged: isDefined(categoryId) && categoryId !== originalCategoryId,
        tagsChanged:
            sortedTagIds.length !== sortedOriginalTagIds.length || sortedTagIds.some((id, index) => id !== sortedOriginalTagIds[index])
    };
};
