import type { TransactionTagsEntityInterface } from '@budgie/contracts';

export const sortTransactionTagsByPrimary = <T extends Pick<TransactionTagsEntityInterface, 'tagId' | 'isPrimary'>>(
    transactionTags: readonly T[]
): T[] =>
    [...transactionTags].sort((first, second) => {
        if (first.isPrimary !== second.isPrimary) {
            return first.isPrimary ? -1 : 1;
        }

        return first.tagId - second.tagId;
    });
