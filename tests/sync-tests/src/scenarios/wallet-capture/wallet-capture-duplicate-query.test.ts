import { TransactionRepository } from '@budgie/contracts';
import { ExternalSourceEnum, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer, seed, walletCaptureSeedAccount } from '../../harness/wallet-capture';

describe('Wallet capture duplicate query', () => {
    it.effect('returns a nearby matching expense and excludes a different amount', () =>
        Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const account = walletCaptureSeedAccount();
            const operatedAt = new Date('2026-08-07T10:00:00.000Z');
            const transaction = seed.bankPairExpense(
                { externalId: 'capture-existing', operatedAt },
                { accountId: account.id, amount: 125_000_000, mccCategoryId: null }
            );

            seed.updateTransaction(transaction.id, {
                externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
                title: 'Silpo'
            });

            expect(
                yield* transactionRepository.findPotentialExpenseDuplicate({
                    accountId: account.id,
                    amountInMicroUnits: 125_000_000,
                    normalizedTitle: 'silpo',
                    operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                    timeWindowSeconds: 120
                })
            ).toBe(transaction.id);

            expect(
                yield* transactionRepository.findPotentialExpenseDuplicate({
                    accountId: account.id,
                    amountInMicroUnits: 126_000_000,
                    normalizedTitle: 'silpo',
                    operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                    timeWindowSeconds: 120
                })
            ).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(['АТБ', 'BILLA ÖSTERREICH'])('matches Unicode merchant %s without relying on SQLite lowercase', merchant =>
        Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const account = walletCaptureSeedAccount();
            const operatedAt = new Date('2026-08-07T10:00:00.000Z');
            const transaction = seed.bankPairExpense(
                { externalId: 'unicode-existing', operatedAt },
                { accountId: account.id, amount: 125_000_000, mccCategoryId: null }
            );
            seed.updateTransaction(transaction.id, { title: `  ${merchant}  ` });

            expect(
                yield* transactionRepository.findPotentialExpenseDuplicate({
                    accountId: account.id,
                    amountInMicroUnits: 125_000_000,
                    normalizedTitle: merchant.toLocaleLowerCase(),
                    operatedAt,
                    timeWindowSeconds: 120
                })
            ).toBe(transaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores historical moved consolidation entries', () =>
        Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const account = walletCaptureSeedAccount();
            const operatedAt = new Date('2026-08-07T10:00:00.000Z');
            const sourceTransaction = seed.bankPairExpense(
                { externalId: 'capture-moved-source', operatedAt },
                { accountId: account.id, amount: 125_000_000, mccCategoryId: null }
            );

            seed.updateTransaction(sourceTransaction.id, {
                externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
                title: 'Silpo'
            });

            testDb
                .update(TransactionEntryEntityTable)
                .set({ originalTransactionId: sourceTransaction.id })
                .where(eq(TransactionEntryEntityTable.transactionId, sourceTransaction.id))
                .run();

            expect(
                yield* transactionRepository.findPotentialExpenseDuplicate({
                    accountId: account.id,
                    amountInMicroUnits: 125_000_000,
                    normalizedTitle: 'silpo',
                    operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                    timeWindowSeconds: 120
                })
            ).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
