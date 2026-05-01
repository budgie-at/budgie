import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';

import { transactionMapEntryInputToCreateEntity } from './transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from './transaction-map-tag-ids-to-create-entities.util';

import type { DB, TransactionUpdateServiceInputInterface } from '@budgie/contracts';

export const upsertTransactionEntriesAndTags = async (
    transactionId: number,
    input: TransactionUpdateServiceInputInterface,
    tx: DB,
    isConsolidated = false
): Promise<void> => {
    if (isConsolidated) {
        await transactionEntryRepository.deleteLedgerByTransactionId(transactionId, tx);
    } else {
        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
    }

    await transactionEntryRepository.bulkCreate(
        input.entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transactionId)),
        tx
    );

    await transactionTagsRepository.deleteByTransactionId(transactionId, tx);
    if (isNotEmptyArray(input.tagIds)) {
        await transactionTagsRepository.bulkCreate(transactionMapTagIdsToCreateEntities(input.tagIds, transactionId), tx);
    }
};
