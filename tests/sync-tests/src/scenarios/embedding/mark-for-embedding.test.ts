import { transactionRepository } from '@app/@generic/drizzle/db/db';
import { TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchTransactionById } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const seedTransaction = (type: TransactionTypeEnum, needsEmbedding: boolean) =>
    insertOne(TransactionEntityTable, {
        type,
        title: 'Manual transaction',
        externalId: null,
        comment: '',
        toAccountId: null,
        fromAccountId: null,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding
    });

describe('embedding/mark-for-embedding', () => {
    it('marks indexable transactions that are not already queued', async () => {
        const transaction = seedTransaction(TransactionTypeEnum.INCOME, false);

        await transactionRepository.markForEmbeddingByIds([transaction.id]);

        expect(fetchTransactionById(transaction.id).needsEmbedding).toBe(true);
    });

    it('does not mark transfers for embedding', async () => {
        const transaction = seedTransaction(TransactionTypeEnum.TRANSFER, false);

        await transactionRepository.markForEmbeddingByIds([transaction.id]);

        expect(fetchTransactionById(transaction.id).needsEmbedding).toBe(false);
    });
});
