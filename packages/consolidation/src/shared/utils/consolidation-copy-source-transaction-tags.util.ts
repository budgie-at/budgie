import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import type { TransactionTagsRepository } from '@budgie/contracts';
import type * as Context from 'effect/Context';

export const consolidationCopySourceTransactionTags = Effect.fn('consolidationCopySourceTransactionTags')(function* (
    transactionTagsRepository: Context.Service.Shape<typeof TransactionTagsRepository>,
    sourceTransactionIds: number[],
    canonicalTransactionId: number
) {
    if (isEmptyArray(sourceTransactionIds)) {
        return;
    }

    const sourceTags = yield* transactionTagsRepository.findByTransactionIds(sourceTransactionIds);
    const existingTags = yield* transactionTagsRepository.findByTransactionId(canonicalTransactionId);
    const existingTagIds = new Set(existingTags.map(tag => tag.tagId));
    const uniqueTagIds = [...new Set(sourceTags.map(tag => tag.tagId))].filter(tagId => !existingTagIds.has(tagId));

    if (isEmptyArray(uniqueTagIds)) {
        return;
    }

    yield* transactionTagsRepository.bulkCreate(
        uniqueTagIds.map(tagId => ({
            transactionId: canonicalTransactionId,
            tagId,
            isPrimary: false
        }))
    );
});
