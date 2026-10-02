import { TransactionEmbeddingRepository } from '@budgie/categorization';
import { TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchTransactionById, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const seedTransaction = (type: TransactionTypeEnum, needsEmbedding: boolean) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntityTable, {
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
    });

describe('embedding/mark-for-embedding', () => {
    it.effect('marks indexable transactions that are not already queued', () =>
        Effect.gen(function* () {
            const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
            const transaction = yield* seedTransaction(TransactionTypeEnum.INCOME, false);

            yield* transactionEmbeddingRepository.markForEmbeddingByIds([transaction.id]);

            expect((yield* fetchTransactionById(transaction.id)).needsEmbedding).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not mark transfers for embedding', () =>
        Effect.gen(function* () {
            const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;
            const transaction = yield* seedTransaction(TransactionTypeEnum.TRANSFER, false);

            yield* transactionEmbeddingRepository.markForEmbeddingByIds([transaction.id]);

            expect((yield* fetchTransactionById(transaction.id)).needsEmbedding).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});
