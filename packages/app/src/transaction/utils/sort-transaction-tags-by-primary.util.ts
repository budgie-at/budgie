import type { TransactionTagsEntityInterface } from '@budgie/contracts';

export const sortTransactionTagsByPrimary = <T extends Pick<TransactionTagsEntityInterface, 'tagId' | 'isPrimary'>>(
    transactionTags: readonly T[]
): T[] =>
    [...transactionTags].sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
            return a.isPrimary ? -1 : 1;
        }

        return a.tagId - b.tagId;
    });
