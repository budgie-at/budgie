import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, privatbankTransactionMapper } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { PrivatbankRowInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const PRIVATBANK_CARD_ID = '4731 **** **** 5524';
const PRIVATBANK_STATEMENT_URI = 'privatbank-statement.xlsx';
const PRIVATBANK_PARSED_DATE_EXTERNAL_ID = '0a0ff77d892d63b61bc65af4412c1f00';
const PRIVATBANK_TRANSACTION_AMOUNT = 732_440_000;

const buildPrivatbankBankAccount = (): SyncAccountInterface => ({
    id: PRIVATBANK_CARD_ID,
    provider: SyncProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD
});

const buildPrivatbankRow = (): PrivatbankRowInterface => ({
    rawDate: '19.05.2026 08:40:18',
    date: new Date('2026-05-19T06:40:18.000Z'),
    category: 'Комуналка та Інтернет',
    card: PRIVATBANK_CARD_ID,
    description: 'TRANZZO*NICUA*AGPAY, DNIPRO',
    cardAmount: -732.44,
    cardCurrency: 'UAH',
    operationAmount: 732.44,
    operationCurrency: 'UAH',
    endBalance: 12_345.67,
    balanceCurrency: 'UAH'
});

class StubPrivatbankFileClient implements FileBasedSyncClientInterface {
    private readonly transaction = privatbankTransactionMapper(buildPrivatbankRow());

    getAccounts(): SyncAccountInterface[] {
        return [buildPrivatbankBankAccount()];
    }

    getTransactions(accountId: string): SyncTransactionInterface[] {
        return accountId === PRIVATBANK_CARD_ID ? [this.transaction] : [];
    }
}

const seedPrivatbankAccount = () =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            title: 'Privatbank Card',
            externalId: PRIVATBANK_CARD_ID,
            externalSource: ExternalSourceEnum.PRIVATBANK
        });

        return account.id;
    });

const seedPrivatbankParsedDateTransaction = (accountId: number) =>
    Effect.gen(function* () {
        const row = buildPrivatbankRow();

        const transaction = yield* seed.bankPairExpense(
            { externalId: PRIVATBANK_PARSED_DATE_EXTERNAL_ID, operatedAt: row.date },
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
    it.effect('reuses transactions imported with the old parsed-date external id', () =>
        Effect.gen(function* () {
            const accountId = yield* seedPrivatbankAccount();
            const client = new StubPrivatbankFileClient();
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.PRIVATBANK, client);
            const [importedTransaction] = client.getTransactions(PRIVATBANK_CARD_ID);

            yield* seedPrivatbankParsedDateTransaction(accountId);

            yield* syncService.executeImportForSelectedAccounts(PRIVATBANK_STATEMENT_URI, [PRIVATBANK_CARD_ID]);

            const transactions = yield* fetchPrivatbankTransactions();

            expect(transactions).toHaveLength(1);
            expect(transactions[0]).toEqual(expect.objectContaining({ externalId: importedTransaction.id }));
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
