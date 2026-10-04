import { TagSourceEnum } from '@budgie/contracts';
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
    const sourceByTagId = new Map<number, TagSourceEnum>();

    for (const tag of sourceTags) {
        if (!existingTagIds.has(tag.tagId) && sourceByTagId.get(tag.tagId) !== TagSourceEnum.USER) {
            sourceByTagId.set(tag.tagId, tag.source);
        }
    }

    yield* transactionTagsRepository.bulkCreate(
        [...sourceByTagId].map(([tagId, source]) => ({
            transactionId: canonicalTransactionId,
            tagId,
            isPrimary: false,
            source
        }))
    );
});
