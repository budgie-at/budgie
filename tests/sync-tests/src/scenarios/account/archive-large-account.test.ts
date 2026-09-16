import { accountService } from '@app/account/service/account.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { seed, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const TRANSACTION_COUNT = 400;
const CONSOLIDATED_COUNT = 60;
const ENTRY_AMOUNT = -1_000_000;
const PRE_ARCHIVED_AT = new Date(2026, 0, 1);

const seedExpense = (accountId: number, index: number, consolidationType: TransactionConsolidationTypeEnum | null): number => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: `Archived expense ${accountId}-${index}`,
        externalId: `archive-${accountId}-${index}`,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false,
        consolidationType
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: ENTRY_AMOUNT,
        exchangeRate: 1
    });

    return transaction.id;
};

const requireRow = <T>(row: T | undefined): T => {
    if (!isDefined(row)) {
        throw new Error('Expected a row');
    }

    return row;
};

const countLive = (accountId: number): number =>
    testDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(TransactionEntryEntityTable)
        .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt)))
        .all()
        .reduce((total, row) => total + row.count, 0);

const sumLive = (accountId: number): number =>
    testDb
        .select({ total: sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0)` })
        .from(TransactionEntryEntityTable)
        .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt)))
        .all()
        .reduce((total, row) => total + row.total, 0);

describe('account/archive-large-account', () => {
    it('archives every transaction of a large account without touching other accounts', async () => {
        seed.instrument({});
        const archivedAccount = seed.account({ title: 'Archived', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const untouchedAccount = seed.account({ title: 'Untouched', type: AccountTypeEnum.CASH, instrumentId: 1 });

        for (let index = 0; index < TRANSACTION_COUNT; index += 1) {
            const consolidationType = index < CONSOLIDATED_COUNT ? TransactionConsolidationTypeEnum.TRANSFER_PAIR : null;

            seedExpense(archivedAccount.id, index, consolidationType);
        }
        const untouchedTransactionId = seedExpense(untouchedAccount.id, 0, null);
        const preArchivedTransactionId = seedExpense(archivedAccount.id, TRANSACTION_COUNT, null);

        testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: PRE_ARCHIVED_AT })
            .where(eq(TransactionEntryEntityTable.transactionId, preArchivedTransactionId))
            .run();

        await accountService.archiveById(archivedAccount.id);

        expect(
            requireRow(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, archivedAccount.id)).get()).deletedAt
        ).not.toBeNull();
        expect(countLive(archivedAccount.id)).toBe(0);
        expect(countLive(untouchedAccount.id)).toBe(1);
        expect(sumLive(archivedAccount.id)).toBe(0);
        expect(sumLive(untouchedAccount.id)).toBe(ENTRY_AMOUNT);

        expect(
            requireRow(testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, untouchedTransactionId)).get())
                .deletedAt
        ).toBeNull();
        expect(
            testDb
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.fromAccountId, archivedAccount.id),
                        isNotNull(TransactionEntityTable.consolidationType),
                        isNull(TransactionEntityTable.deletedAt)
                    )
                )
                .all()
        ).toStrictEqual([]);
        expect(
            requireRow(
                testDb
                    .select()
                    .from(TransactionEntryEntityTable)
                    .where(eq(TransactionEntryEntityTable.transactionId, preArchivedTransactionId))
                    .get()
            ).deletedAt
        ).toStrictEqual(PRE_ARCHIVED_AT);
    });
});
