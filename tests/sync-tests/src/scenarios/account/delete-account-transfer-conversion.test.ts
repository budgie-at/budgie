import {
    ACCOUNT_DELETED_TRANSFER_CATEGORY_ID,
    AccountBalanceRepository,
    AccountTypeEnum,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { and, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    fetchDefaultStatistics,
    fetchEntriesByTransactionId,
    fetchTransactionById,
    seed,
    seedNestedTransferConsolidation,
    seedTransferAtFixedDate,
    testDb,
    TestLayer
} from '../../harness';

const seedHiddenTransferChild = (archivedAccountId: number, bankAccountId: number, cashAccountId: number) =>
    Effect.gen(function* () {
        const nested = yield* seedNestedTransferConsolidation(archivedAccountId, bankAccountId, cashAccountId);

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, nested.child.id),
                    eq(TransactionEntryEntityTable.accountId, archivedAccountId)
                )
            );

        return nested;
    });

describe('account/delete-account-transfer-conversion', () => {
    it.effect('converts only visible transfers into excluded income and expense and leaves hidden and archived ones intact', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const deletedAccount = yield* seed.account({ title: 'erste bank EUR', type: AccountTypeEnum.BANK });
            const otherArchivedAccount = yield* seed.account({ title: 'monobank EUR', type: AccountTypeEnum.BANK });
            const bankAccount = yield* seed.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH });
            const liveAccountIds = [bankAccount.id, cashAccount.id];
            const incomingTransfer = yield* seedTransferAtFixedDate(deletedAccount.id, cashAccount.id, 100 * PRECISION);
            const outgoingTransfer = yield* seedTransferAtFixedDate(bankAccount.id, deletedAccount.id, 40 * PRECISION);
            const archivedTransfer = yield* seedTransferAtFixedDate(deletedAccount.id, otherArchivedAccount.id, 25 * PRECISION);

            yield* accountArchiveService.archiveById(otherArchivedAccount.id);
            yield* accountArchiveService.archiveById(deletedAccount.id);

            const { canonical, child, grandchild } = yield* seedHiddenTransferChild(deletedAccount.id, bankAccount.id, cashAccount.id);

            const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances(liveAccountIds);
            const statisticsBefore = yield* fetchDefaultStatistics();
            const archivedTransferBefore = yield* fetchTransactionById(archivedTransfer.id);
            const childBefore = yield* fetchTransactionById(child.id);
            const canonicalEntriesBefore = yield* fetchEntriesByTransactionId(canonical.id);
            const childEntriesBefore = yield* fetchEntriesByTransactionId(child.id);
            const grandchildBefore = yield* fetchTransactionById(grandchild.id);

            expect(archivedTransferBefore.deletedAt).not.toBeNull();
            expect(childBefore.deletedAt).toBeNull();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            const incoming = yield* fetchTransactionById(incomingTransfer.id);
            const outgoing = yield* fetchTransactionById(outgoingTransfer.id);
            const [incomingEntry] = yield* fetchEntriesByTransactionId(incomingTransfer.id);
            const [outgoingEntry] = yield* fetchEntriesByTransactionId(outgoingTransfer.id);
            const statisticsAfter = yield* fetchDefaultStatistics();

            expect([incoming.type, incoming.fromAccountId, incoming.toAccountId]).toEqual([
                TransactionTypeEnum.INCOME,
                null,
                cashAccount.id
            ]);
            expect([outgoing.type, outgoing.fromAccountId, outgoing.toAccountId]).toEqual([
                TransactionTypeEnum.EXPENSE,
                bankAccount.id,
                null
            ]);
            expect(incomingEntry).toMatchObject({
                accountId: cashAccount.id,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: 100 * PRECISION,
                categoryId: ACCOUNT_DELETED_TRANSFER_CATEGORY_ID
            });
            expect(outgoingEntry).toMatchObject({
                accountId: bankAccount.id,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 40 * PRECISION,
                categoryId: ACCOUNT_DELETED_TRANSFER_CATEGORY_ID
            });

            expect(yield* fetchTransactionById(archivedTransfer.id)).toEqual({ ...archivedTransferBefore, fromAccountId: null });
            expect(yield* fetchEntriesByTransactionId(archivedTransfer.id)).toHaveLength(1);
            expect(yield* fetchTransactionById(child.id)).toEqual({ ...childBefore, fromAccountId: null });
            expect(yield* fetchEntriesByTransactionId(canonical.id)).toEqual(canonicalEntriesBefore);
            expect(yield* fetchEntriesByTransactionId(child.id)).toEqual(
                childEntriesBefore.filter(entry => entry.accountId !== deletedAccount.id)
            );
            expect(yield* fetchTransactionById(grandchild.id)).toEqual(grandchildBefore);

            expect(yield* accountBalanceRepository.getLedgerBalances(liveAccountIds)).toEqual(ledgerBefore);
            expect(statisticsAfter).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps statistics free of a transfer converted on an account deleted without archiving first', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const deletedAccount = yield* seed.account({ title: 'Old card', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH });
            const transfer = yield* seedTransferAtFixedDate(cashAccount.id, deletedAccount.id, 12 * PRECISION);
            const statisticsBefore = yield* fetchDefaultStatistics();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            expect((yield* fetchTransactionById(transfer.id)).type).toBe(TransactionTypeEnum.EXPENSE);
            expect(yield* fetchDefaultStatistics()).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the archived counterpart entry and hides the transfer when the only live entry sat on the deleted account', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const deletedAccount = yield* seed.account({ title: 'Old card', type: AccountTypeEnum.BANK });
            const archivedAccount = yield* seed.account({ title: 'Archived card', type: AccountTypeEnum.BANK });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH });
            const transfer = yield* seedTransferAtFixedDate(deletedAccount.id, archivedAccount.id, 30 * PRECISION);

            yield* accountArchiveService.archiveById(archivedAccount.id);

            const archivedEntryBefore = (yield* fetchEntriesByTransactionId(transfer.id)).filter(
                entry => entry.accountId === archivedAccount.id
            );
            const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances([cashAccount.id]);
            const statisticsBefore = yield* fetchDefaultStatistics();

            expect(archivedEntryBefore).toHaveLength(1);
            expect(archivedEntryBefore[0].deletedAt).not.toBeNull();

            yield* accountArchiveService.deleteById(deletedAccount.id);

            const transferAfter = yield* fetchTransactionById(transfer.id);

            expect(transferAfter.deletedAt).not.toBeNull();
            expect(transferAfter.fromAccountId).toBeNull();
            expect(yield* fetchEntriesByTransactionId(transfer.id)).toEqual(archivedEntryBefore);
            expect(yield* accountBalanceRepository.getLedgerBalances([cashAccount.id])).toEqual(ledgerBefore);
            expect(yield* fetchDefaultStatistics()).toEqual(statisticsBefore);
        }).pipe(Effect.provide(TestLayer))
    );
});
