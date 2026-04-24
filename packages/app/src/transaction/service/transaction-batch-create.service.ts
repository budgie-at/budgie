import { TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { bankSyncLog } from '../../sync/util/bank-sync-log.util';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { DB } from '@budgie/contracts';

class TransactionBatchCreateService {
    async create(batch: readonly TransactionCreateInputInterface[], tx: DB): Promise<TransactionEntityInterface[]> {
        bankSyncLog('service:batchCreate:enter', { batchCount: batch.length });
        const transactions = await transactionRepository.bulkCreate([...batch], tx);
        bankSyncLog('service:batchCreate:txInserted', { requested: batch.length, inserted: transactions.length });
        const batchEntries = transactions.flatMap((transaction, index) =>
            batch[index].entries.map(entry => transactionMapEntryInputToCreateEntity(entry, transaction.id))
        );
        const batchTags = transactions.flatMap((transaction, index) =>
            transactionMapTagIdsToCreateEntities(batch[index].tagIds, transaction.id, null)
        );
        bankSyncLog('service:batchCreate:entriesAndTagsPrepared', {
            entryCount: batchEntries.length,
            tagCount: batchTags.length
        });

        await Promise.all([transactionEntryRepository.bulkCreate(batchEntries, tx), transactionTagsRepository.bulkCreate(batchTags, tx)]);
        bankSyncLog('service:batchCreate:done', { transactionCount: transactions.length });

        return transactions;
    }
}

export const transactionBatchCreateService = new TransactionBatchCreateService();
