import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { AccountTypeEnum, BankSyncModeEnum, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobank, monobankStub, seed, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/consolidation-survives-resync', () => {
    it('re-importing a consolidated source transaction must not destroy the canonical TRANSFER (regression: bug 2)', async () => {
        const fromAccount = seed.account({ externalId: 'mono-acc-1', type: AccountTypeEnum.BANK_SYNC });
        const toAccount = seed.account({ externalId: 'mono-acc-2', type: AccountTypeEnum.BANK_SYNC });
        seed.bankSync({ accountId: fromAccount.id, mode: BankSyncModeEnum.FORWARD, forwardSyncFromAt: new Date(2026, 0, 1) });

        const operatedAt = new Date(2026, 0, 15);

        const sourceExpense = testDb
            .insert(TransactionEntityTable)
            .values({
                type: 'EXPENSE',
                title: 'Transfer expense',
                externalId: 'tx-expense-1',
                externalSource: 'MONOBANK',
                operatedAt,
                exchangeRate: 1,
                fromAccountId: fromAccount.id,
                toAccountId: null,
                comment: ''
            } as never)
            .returning()
            .all()[0];

        const sourceIncome = testDb
            .insert(TransactionEntityTable)
            .values({
                type: 'INCOME',
                title: 'Transfer income',
                externalId: 'tx-income-1',
                externalSource: 'MONOBANK',
                operatedAt,
                exchangeRate: 1,
                fromAccountId: null,
                toAccountId: toAccount.id,
                comment: ''
            } as never)
            .returning()
            .all()[0];

        const canonicalTransfer = testDb
            .insert(TransactionEntityTable)
            .values({
                type: 'TRANSFER',
                title: 'Canonical transfer',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: 1,
                fromAccountId: fromAccount.id,
                toAccountId: toAccount.id,
                consolidationType: 'TRANSFER_PAIR',
                comment: ''
            } as never)
            .returning()
            .all()[0];

        testDb
            .insert(TransactionEntryEntityTable)
            .values([
                {
                    transactionId: canonicalTransfer.id,
                    accountId: fromAccount.id,
                    type: 'CREDIT',
                    amount: 25_000_000,
                    exchangeRate: 1,
                    externalId: null,
                    originalTransactionId: null
                },
                {
                    transactionId: canonicalTransfer.id,
                    accountId: toAccount.id,
                    type: 'DEBIT',
                    amount: 25_000_000,
                    exchangeRate: 1,
                    externalId: null,
                    originalTransactionId: null
                },
                {
                    transactionId: canonicalTransfer.id,
                    originalTransactionId: sourceExpense.id,
                    accountId: fromAccount.id,
                    type: 'CREDIT',
                    amount: 25_000_000,
                    exchangeRate: 1,
                    externalId: 'tx-expense-1'
                },
                {
                    transactionId: canonicalTransfer.id,
                    originalTransactionId: sourceIncome.id,
                    accountId: toAccount.id,
                    type: 'DEBIT',
                    amount: 25_000_000,
                    exchangeRate: 1,
                    externalId: 'tx-income-1'
                }
            ] as never)
            .run();

        testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonicalTransfer.id } as never)
            .where(eq(TransactionEntityTable.id, sourceExpense.id))
            .run();
        testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonicalTransfer.id } as never)
            .where(eq(TransactionEntityTable.id, sourceIncome.id))
            .run();

        monobankStub.clientInfo(buildMonobank.clientInfoWith(['mono-acc-1']));
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-expense-1', amount: -25000, hold: false })]);

        await monobankSyncService.sync();

        const canonicalAfter = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.id, canonicalTransfer.id))
            .all();
        expect(canonicalAfter).toHaveLength(1);
        expect(canonicalAfter[0].deletedAt).toBeNull();
        expect(canonicalAfter[0].consolidationType).toBe('TRANSFER_PAIR');

        const sourceExpenseAfter = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.id, sourceExpense.id))
            .all();
        expect(sourceExpenseAfter[0].consolidationParentTransactionId).toBe(canonicalTransfer.id);

        const shadowEntry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-expense-1'))
            .all();
        expect(shadowEntry).toHaveLength(1);
        expect(shadowEntry[0].originalTransactionId).toBe(sourceExpense.id);
        expect(shadowEntry[0].transactionId).toBe(canonicalTransfer.id);
    });
});
