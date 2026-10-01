import { AccountArchiveService } from '@app/account/service/account-archive.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const ENTRY_AMOUNT = -1_000_000;
const PRE_ARCHIVED_AT = new Date(2026, 0, 1);

const seedExpense = (accountId: number, index: number, consolidationType: TransactionConsolidationTypeEnum | null) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
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

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: ENTRY_AMOUNT,
            exchangeRate: 1
        });

        return transaction.id;
    });

const requireRow = <T>(row: T | undefined): T => {
    if (!isDefined(row)) {
        throw new Error('Expected a row');
    }

    return row;
};

const getLiveSummary = (accountId: number) =>
    Effect.gen(function* () {
        return requireRow(
            (yield* testDb
                .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0)` })
                .from(TransactionEntryEntityTable)
                .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt))))[0]
        );
    });

describe('account/archive-account-preserves-deleted-at', () => {
    it.effect('archives every transaction of a large account without touching other accounts', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            yield* seed.instrument({});
            const archivedAccount = yield* seed.account({ title: 'Archived', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });
            const untouchedAccount = yield* seed.account({ title: 'Untouched', type: AccountTypeEnum.CASH, instrumentId: 1 });

            yield* seedExpense(archivedAccount.id, 0, TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            yield* seedExpense(archivedAccount.id, 1, TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            const untouchedTransactionId = yield* seedExpense(untouchedAccount.id, 0, null);
            const preArchivedTransactionId = yield* seedExpense(archivedAccount.id, 2, null);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ deletedAt: PRE_ARCHIVED_AT })
                .where(eq(TransactionEntryEntityTable.transactionId, preArchivedTransactionId));

            yield* accountArchiveService.archiveById(archivedAccount.id);

            expect(
                requireRow((yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.id, archivedAccount.id)))[0])
                    .deletedAt
            ).not.toBeNull();

            const archivedSummary = yield* getLiveSummary(archivedAccount.id);
            expect(archivedSummary.count).toBe(0);
            expect(archivedSummary.total).toBe(0);

            const untouchedSummary = yield* getLiveSummary(untouchedAccount.id);
            expect(untouchedSummary.count).toBe(1);
            expect(untouchedSummary.total).toBe(ENTRY_AMOUNT);

            expect(
                requireRow(
                    (yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, untouchedTransactionId)))[0]
                ).deletedAt
            ).toBeNull();
            expect(
                yield* testDb
                    .select({ id: TransactionEntityTable.id })
                    .from(TransactionEntityTable)
                    .where(
                        and(
                            eq(TransactionEntityTable.fromAccountId, archivedAccount.id),
                            isNotNull(TransactionEntityTable.consolidationType),
                            isNull(TransactionEntityTable.deletedAt)
                        )
                    )
            ).toStrictEqual([]);
            expect(
                requireRow(
                    (yield* testDb
                        .select()
                        .from(TransactionEntryEntityTable)
                        .where(eq(TransactionEntryEntityTable.transactionId, preArchivedTransactionId)))[0]
                ).deletedAt
            ).toStrictEqual(PRE_ARCHIVED_AT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a transfer live while one side is active and retires it once both sides are archived', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            yield* seed.instrument({});
            const fromAccount = yield* seed.account({ title: 'Transfer source', type: AccountTypeEnum.BANK, instrumentId: 1 });
            const toAccount = yield* seed.account({ title: 'Transfer target', type: AccountTypeEnum.BANK, instrumentId: 1 });
            const transfer = yield* insertOne(TransactionEntityTable, {
                type: TransactionTypeEnum.TRANSFER,
                title: 'Own transfer',
                comment: '',
                fromAccountId: fromAccount.id,
                toAccountId: toAccount.id,
                exchangeRate: 1
            });

            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: transfer.id,
                accountId: fromAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 1_000_000,
                exchangeRate: 1
            });
            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: transfer.id,
                accountId: toAccount.id,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: 1_000_000,
                exchangeRate: 1
            });
            const getTransferDeletedAt = () =>
                Effect.gen(function* () {
                    return requireRow(
                        (yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, transfer.id)))[0]
                    ).deletedAt;
                });

            yield* accountArchiveService.archiveById(fromAccount.id);
            expect(yield* getTransferDeletedAt()).toBeNull();

            yield* accountArchiveService.archiveById(toAccount.id);
            expect(yield* getTransferDeletedAt()).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
