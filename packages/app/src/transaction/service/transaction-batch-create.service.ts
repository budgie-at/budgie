import { Log, TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

import { transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { transactionMapEntryInputToCreateEntity } from '../utils/transaction-map-entry-input-to-create-entity.util';
import { transactionMapTagIdsToCreateEntities } from '../utils/transaction-map-tag-ids-to-create-entities.util';

import type { DB } from '@budgie/contracts';

class TransactionBatchCreateService {
    @Log(
        batch => `batchCreate:enter count=${batch.length}`,
        (result, batch) => `batchCreate:done requested=${batch.length} inserted=${result.length}`,
        (error, batch) => `batchCreate:throw count=${batch.length} error=${String(error)}`
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
