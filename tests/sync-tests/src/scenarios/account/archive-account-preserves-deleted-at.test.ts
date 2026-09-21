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

const getLiveSummary = (accountId: number): { count: number; total: number } =>
    requireRow(
        testDb
            .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0)` })
            .from(TransactionEntryEntityTable)
            .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt)))
            .get()
    );

describe('account/archive-account-preserves-deleted-at', () => {
    it('archives every transaction of a large account without touching other accounts', async () => {
        seed.instrument({});
        const archivedAccount = seed.account({ title: 'Archived', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
        const untouchedAccount = seed.account({ title: 'Untouched', type: AccountTypeEnum.CASH, instrumentId: 1 });

        seedExpense(archivedAccount.id, 0, TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        seedExpense(archivedAccount.id, 1, TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        const untouchedTransactionId = seedExpense(untouchedAccount.id, 0, null);
        const preArchivedTransactionId = seedExpense(archivedAccount.id, 2, null);

        testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: PRE_ARCHIVED_AT })
            .where(eq(TransactionEntryEntityTable.transactionId, preArchivedTransactionId))
            .run();

        await accountService.archiveById(archivedAccount.id);

        expect(
            requireRow(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, archivedAccount.id)).get()).deletedAt
        ).not.toBeNull();

        const archivedSummary = getLiveSummary(archivedAccount.id);
        expect(archivedSummary.count).toBe(0);
        expect(archivedSummary.total).toBe(0);

        const untouchedSummary = getLiveSummary(untouchedAccount.id);
        expect(untouchedSummary.count).toBe(1);
        expect(untouchedSummary.total).toBe(ENTRY_AMOUNT);

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
