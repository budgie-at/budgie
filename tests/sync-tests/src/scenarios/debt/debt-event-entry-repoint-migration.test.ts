import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    TransactionEntryEntityTable,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { DebtEventCreateEntityInterface, TransactionCreateEntityInterface } from '@budgie/contracts';

const MIGRATION_SQL_PATH = resolve(
    fileURLToPath(import.meta.url),
    '../../../../../../packages/app/drizzle/0046_repoint_debt_event_entries.sql'
);
const OPERATED_AT = new Date('2026-06-05T09:00:00.000Z');
const ENTRY_AMOUNT = 100_000_000;

const seedPrimaryEntry = (transactionId: number, cashAccountId: number) =>
    insertOne(TransactionEntryEntityTable, {
        transactionId,
        accountId: cashAccountId,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        amount: ENTRY_AMOUNT,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: ENTRY_AMOUNT,
        toIban: null,
        originalTransactionId: null
    });

const seedExpenseTransaction = (cashAccountId: number) =>
    insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Coffee shop purchase',
        externalId: null,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        operatedAt: OPERATED_AT,
        comment: '',
        exchangeRate: 1,
        updatedBy: null,
        fromAccountId: cashAccountId,
        toAccountId: null
    } satisfies TransactionCreateEntityInterface);

const seedExpenseTransactionWithLiveEntry = (cashAccountId: number) => {
    const transaction = seedExpenseTransaction(cashAccountId);
    const entry = seedPrimaryEntry(transaction.id, cashAccountId);

    return { transaction, entry };
};

const seedReplacedPrimaryEntry = (transactionId: number, cashAccountId: number): number => {
    const staleEntry = seedPrimaryEntry(transactionId, cashAccountId);

    testDb
        .update(TransactionEntryEntityTable)
        .set({ deletedAt: OPERATED_AT })
        .where(eq(TransactionEntryEntityTable.id, staleEntry.id))
        .run();

    return staleEntry.id;
};

const seedDebtEvent = (debtAccountId: number, transactionId: number, transactionEntryId: number) =>
    insertOne(DebtEventEntityTable, {
        debtAccountId,
        transactionId,
        transactionEntryId,
        direction: DebtEventDirectionEnum.CLOSE,
        source: DebtEventSourceEnum.INCOME_ATTACHMENT,
        amount: ENTRY_AMOUNT,
        baseInstrumentId: 1,
        baseExchangeRate: 1,
        baseAmount: ENTRY_AMOUNT,
        operatedAt: OPERATED_AT
    } satisfies DebtEventCreateEntityInterface);

describe('debt event entry repoint migration', () => {
    it('repoints stale transaction_entry_id references to the live primary entry and leaves correct events untouched', async () => {
        const migrationSql = readFileSync(MIGRATION_SQL_PATH, 'utf8');
        const debtAccount = seed.account({ type: AccountTypeEnum.DEBT, debtType: AccountDebtTypeEnum.LENT, title: 'Lent debt account' });
        const staleCashAccount = seed.account({ type: AccountTypeEnum.BANK_SYNC, title: 'Stale reference cash account' });
        const correctCashAccount = seed.account({ type: AccountTypeEnum.BANK_SYNC, title: 'Correct reference cash account' });

        const { transaction: staleTransaction, entry: staleTransactionLiveEntry } = seedExpenseTransactionWithLiveEntry(
            staleCashAccount.id
        );
        const { transaction: correctTransaction, entry: correctTransactionLiveEntry } = seedExpenseTransactionWithLiveEntry(
            correctCashAccount.id
        );

        const staleTransactionEntryId = seedReplacedPrimaryEntry(staleTransaction.id, staleCashAccount.id);
        const staleDebtEvent = seedDebtEvent(debtAccount.id, staleTransaction.id, staleTransactionEntryId);
        const correctDebtEvent = seedDebtEvent(debtAccount.id, correctTransaction.id, correctTransactionLiveEntry.id);

        await testDb.$client.execAsync(migrationSql);

        const [repairedStaleEvent] = await testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.id, staleDebtEvent.id));
        const [unchangedCorrectEvent] = await testDb
            .select()
            .from(DebtEventEntityTable)
            .where(eq(DebtEventEntityTable.id, correctDebtEvent.id));

        expect(repairedStaleEvent?.transactionEntryId).toBe(staleTransactionLiveEntry.id);
        expect(unchangedCorrectEvent?.transactionEntryId).toBe(correctTransactionLiveEntry.id);
    });
});
