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

    yield* transactionTagsRepository.bulkCreate(
        sourceTags.map(({ tagId, source }) => ({ transactionId: canonicalTransactionId, tagId, isPrimary: false, source }))
    );
});
