import { TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { DB } from '@budgie/contracts';

class TransactionBatchCreateService {
    @Log(
        (batch, tx) =>
            `enter count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))}`,
        (result, batch, tx) =>
            `done count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))} insertedIds=${result
                .slice(0, 5)
                .map(row => row.id)
                .join(',')}`,
        (error, batch, tx) =>
            `throw count=${batch.length} externalIds=${batch
                .slice(0, 5)
                .map(input => input.externalId)
                .join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async create(batch: readonly TransactionCreateInputInterface[], tx: DB): Promise<TransactionEntityInterface[]> {
        const transactions = await transactionRepository.bulkCreate([...batch], tx);
        const batchEntries = transactions.flatMap((transaction, index) =>
            batch[index].entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transaction.id))
        );
        const batchTags = transactions.flatMap((transaction, index) =>
            transactionMapTagIdsToCreateEntities(batch[index].tagIds, transaction.id)
        );

        await Promise.all([transactionEntryRepository.bulkCreate(batchEntries, tx), transactionTagsRepository.bulkCreate(batchTags, tx)]);

        return transactions;
    }
}

export const transactionBatchCreateService = new TransactionBatchCreateService();
