import { ExternalSourceEnum, LanguageEnum, TransactionEntityTable, TransactionViewRepository } from '@budgie/contracts';
import { AccountArchiveService, TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, testDb, TestLayer } from '../../harness';
import {
    PRIVATBANK_CARD_ID,
    PRIVATBANK_STATEMENT_URI,
    StubPrivatbankFileClient,
    seedPrivatbankAccount
} from '../../harness/file-sync/privatbank-statement-fixture';

const fetchPrivatbankTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.PRIVATBANK));

describe('privatbank/deleted-transaction-reimport', () => {
    it.effect('keeps a deleted imported transaction deleted when the same statement is imported again', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            yield* seedPrivatbankAccount;
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new StubPrivatbankFileClient());

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
            const [transaction] = yield* fetchPrivatbankTransactions();
            yield* transactionService.deleteById(transaction.id);
            expect(yield* (yield* TransactionViewRepository).getById(transaction.id, LanguageEnum.EN)).toBeUndefined();

            const review = yield* syncService.reviewImport(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
            expect(review.duplicateTransactionCount).toBe(review.parsedTransactionCount);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const transactions = yield* fetchPrivatbankTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].deletedAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports the statement again into a new account after the old account was archived', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const accountId = yield* seedPrivatbankAccount;
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, new StubPrivatbankFileClient());

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
            yield* accountArchiveService.archiveById(accountId);

            const review = yield* syncService.reviewImport(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);
            expect(review.duplicateTransactionCount).toBe(0);
            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const liveTransactions = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(
                    and(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.PRIVATBANK), isNull(TransactionEntityTable.deletedAt))
                );
            expect(liveTransactions).toHaveLength(review.parsedTransactionCount);
            expect(
                liveTransactions.every(transaction => transaction.fromAccountId !== accountId && transaction.toAccountId !== accountId)
            ).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});
