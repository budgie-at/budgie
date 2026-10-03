import { ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, SyncTransactionTypeEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, seed, testDb, TestLayer } from '../../harness';

import type { FileBasedSyncClientInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

const BANK_ACCOUNT_ID = 'AT_REFRESH';
const STATEMENT_URI = 'erste-refresh.pdf';

const buildBankAccount = (): SyncAccountInterface => ({
    id: BANK_ACCOUNT_ID,
    provider: SyncProviderEnum.ERSTE,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CHECKING,
    iban: BANK_ACCOUNT_ID
});

const buildTransaction = (): SyncTransactionInterface => ({
    id: 'refresh-transaction-1',
    provider: SyncProviderEnum.ERSTE,
    accountId: BANK_ACCOUNT_ID,
    type: SyncTransactionTypeEnum.EXPENSE,
    time: 1_768_302_000,
    description: 'REFRESH TEST',
    comment: '',
    mcc: 0,
    originalMcc: 0,
    amount: 10,
    operationAmount: 10,
    currencyCode: 980,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    category: '',
    feeAmount: 0
});

class RefreshFileClient implements FileBasedSyncClientInterface {
    getAccounts(): SyncAccountInterface[] {
        return [buildBankAccount()];
    }

    getTransactions(accountId: string): SyncTransactionInterface[] {
        return accountId === BANK_ACCOUNT_ID ? [buildTransaction()] : [];
    }
}

describe('import/file-import-refresh', () => {
    it.effect('persists the imported transaction and reports it as new after quick import', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({
                title: 'Refresh Bank',
                externalId: BANK_ACCOUNT_ID,
                externalSource: ExternalSourceEnum.ERSTE
            });
            yield* seed.sync({ accountId: account.id, provider: ExternalSourceEnum.ERSTE });
            const syncService = yield* makeStubFileBankSyncService(ExternalSourceEnum.ERSTE, new RefreshFileClient());

            const result = yield* syncService.quickImport(STATEMENT_URI);

            expect(result.newTransactionCount).toBe(1);
            expect(
                yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'refresh-transaction-1'))
            ).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
