import { isEmptyArray } from '@rnw-community/shared';

import type { TransactionTagsCreateEntityInterface } from '@budgie/contracts';

export const transactionMapTagIdsToCreateEntities = (tagIds: number[], transactionId: number): TransactionTagsCreateEntityInterface[] => {
    if (isEmptyArray(tagIds)) {
        return [];
    }

    const [primaryTagId] = tagIds;

    return tagIds.map(tagId => ({ transactionId, tagId, isPrimary: tagId === primaryTagId }));
};
