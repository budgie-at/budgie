import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import { transactionMapEntryInputToCreateEntity } from './transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from './transaction-map-tag-ids-to-create-entities.util';

import type { UpsertTransactionEntriesAndTagsInputInterface } from '../interface/upsert-transaction-entries-and-tags-input.interface';

export const upsertTransactionEntriesAndTags = Effect.fn('upsertTransactionEntriesAndTags')(function* ({
    transactionId,
    input,
    operatedAt,
    isConsolidated
}: UpsertTransactionEntriesAndTagsInputInterface) {
    if (isConsolidated) {
        yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
    } else {
        yield* transactionEntryRepository.deleteByTransactionId(transactionId);
    }

    const valuations = yield* entryBaseValuationService.valueEntries(input.entries, operatedAt);

    yield* transactionEntryRepository.bulkCreate(
        input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId, valuations.get(entry)))
    );

    yield* transactionTagsRepository.deleteByTransactionId(transactionId);
    if (isNotEmptyArray(input.tagIds)) {
        yield* transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId));
    }
});
