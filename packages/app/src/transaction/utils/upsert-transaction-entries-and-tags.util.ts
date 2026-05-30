import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { entryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';

import { transactionMapEntryInputToCreateEntity } from './transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from './transaction-map-tag-ids-to-create-entities.util';

import type { UpsertTransactionEntriesAndTagsInputInterface } from '../interface/upsert-transaction-entries-and-tags-input.interface';
import type { DB } from '@budgie/contracts';

export const upsertTransactionEntriesAndTags = async (
    { transactionId, input, operatedAt, isConsolidated }: UpsertTransactionEntriesAndTagsInputInterface,
    tx: DB
): Promise<void> => {
    if (isConsolidated) {
        await transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
    } else {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
    }

    const valuations = await entryBaseValuationService.valueEntries(input.entries, operatedAt, null, tx);

    await transactionEntryRepository.bulkCreate(
        input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId, valuations.get(entry))),
        tx
    );

    await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    if (isNotEmptyArray(input.tagIds)) {
        await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId), tx);
    }
};
