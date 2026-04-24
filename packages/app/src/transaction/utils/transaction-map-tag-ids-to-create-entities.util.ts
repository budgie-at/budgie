import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { TransactionTagsCreateEntityInterface } from '@budgie/contracts';

export const transactionMapTagIdsToCreateEntities = (
    tagIds: number[],
    transactionId: number,
    existingPrimaryTagId: number | null = null
): TransactionTagsCreateEntityInterface[] => {
    if (isEmptyArray(tagIds)) {
        return [];
    }

    const existingPrimarySurvived = isDefined(existingPrimaryTagId) && tagIds.includes(existingPrimaryTagId);
    const primaryTagId = existingPrimarySurvived ? existingPrimaryTagId : tagIds[0];

    return tagIds.map(tagId => ({ transactionId, tagId, isPrimary: tagId === primaryTagId }));
};
