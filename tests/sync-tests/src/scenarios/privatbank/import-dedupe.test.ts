import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';
import {
    PRIVATBANK_CARD_ID,
    PRIVATBANK_STATEMENT_URI,
    StubPrivatbankFileClient,
    buildPrivatbankRow,
    seedPrivatbankAccount
} from '../../harness/file-sync/privatbank-statement-fixture';

const PRIVATBANK_PARSED_DATE_EXTERNAL_ID = '0a0ff77d892d63b61bc65af4412c1f00';
const PRIVATBANK_TRANSACTION_AMOUNT = 732_440_000;

const seedPrivatbankParsedDateTransaction = (accountId: number) =>
    Effect.gen(function* () {
        const row = buildPrivatbankRow();

        const transaction = yield* seed.bankPairExpense(
            { externalId: PRIVATBANK_PARSED_DATE_EXTERNAL_ID, operatedAt: row.deviceLocalDate },
            {
                amount: PRIVATBANK_TRANSACTION_AMOUNT,
                accountId
            }
        );

        yield* seed.updateTransaction(transaction.id, {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            title: row.description
        });
    });
const fetchPrivatbankTransactions = () =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(and(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.PRIVATBANK), isNull(TransactionEntityTable.deletedAt)));
    });

describe('privatbank/import-dedupe', () => {
    it.effect('reuses transactions imported with the old parsed-date external id and heals their time to the Kyiv statement time', () =>
        Effect.gen(function* () {
            const accountId = yield* seedPrivatbankAccount();
            const client = new StubPrivatbankFileClient();
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, client);
            const [importedTransaction] = client.getTransactions(PRIVATBANK_CARD_ID);

            yield* seedPrivatbankParsedDateTransaction(accountId);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const transactions = yield* fetchPrivatbankTransactions();

            expect(transactions).toHaveLength(1);
            expect(transactions[0]).toEqual(
                expect.objectContaining({ externalId: importedTransaction.id, operatedAt: buildPrivatbankRow().date })
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips import when the selected card is missing from the file', () =>
        Effect.gen(function* () {
            const client = new StubPrivatbankFileClient();
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, client);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, ['4731 **** **** 0000']);

            expect(yield* fetchPrivatbankTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
