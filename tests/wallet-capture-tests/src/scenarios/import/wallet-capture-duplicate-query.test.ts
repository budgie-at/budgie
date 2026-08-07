import { transactionRepository } from '@app/@generic/drizzle/db/db';
import { ExternalSourceEnum, TransactionEntryEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

describe('Wallet capture duplicate query', () => {
    it('returns a nearby matching expense and excludes a different amount', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
        const operatedAt = new Date('2026-08-07T10:00:00.000Z');
        const transaction = seed.bankPairExpense(
            { externalId: 'capture-existing', operatedAt },
            { accountId: account.id, amount: 125_000_000, mccCategoryId: null }
        );

        seed.updateTransaction(transaction.id, {
            externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
            title: 'Silpo'
        });

        await expect(
            transactionRepository.findPotentialExpenseDuplicate({
                accountId: account.id,
                amountInMicroUnits: 125_000_000,
                normalizedTitle: 'silpo',
                operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                timeWindowSeconds: 120
            })
        ).resolves.toBe(transaction.id);

        await expect(
            transactionRepository.findPotentialExpenseDuplicate({
                accountId: account.id,
                amountInMicroUnits: 126_000_000,
                normalizedTitle: 'silpo',
                operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                timeWindowSeconds: 120
            })
        ).resolves.toBeNull();
    });

    it('ignores historical moved consolidation entries', async () => {
        seed.instrument();
        const account = seed.account({ title: 'Wallet card' });
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

        await expect(
            transactionRepository.findPotentialExpenseDuplicate({
                accountId: account.id,
                amountInMicroUnits: 125_000_000,
                normalizedTitle: 'silpo',
                operatedAt: new Date('2026-08-07T10:01:30.000Z'),
                timeWindowSeconds: 120
            })
        ).resolves.toBeNull();
    });
});
