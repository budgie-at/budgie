import { isEmptyArray } from '@rnw-community/shared';

import type { DB, TransactionTagsRepository } from '@budgie/contracts';

export const consolidationCopySourceTransactionTags = async (
    transactionTagsRepository: Pick<TransactionTagsRepository, 'bulkCreate' | 'findByTransactionId' | 'findByTransactionIds'>,
    sourceTransactionIds: number[],
    canonicalTransactionId: number,
    tx: DB
): Promise<void> => {
    if (isEmptyArray(sourceTransactionIds)) {
        return;
    }

    const sourceTags = await transactionTagsRepository.findByTransactionIds(sourceTransactionIds, tx);
    const existingTags = await transactionTagsRepository.findByTransactionId(canonicalTransactionId, tx);
    const existingTagIds = new Set(existingTags.map(tag => tag.tagId));
    const uniqueTagIds = [...new Set(sourceTags.map(tag => tag.tagId))].filter(tagId => !existingTagIds.has(tagId));

    if (isEmptyArray(uniqueTagIds)) {
        return;
    }

    await transactionTagsRepository.bulkCreate(
        uniqueTagIds.map(tagId => ({
            transactionId: canonicalTransactionId,
            tagId,
            isPrimary: false
        })),
        tx
    );
};
