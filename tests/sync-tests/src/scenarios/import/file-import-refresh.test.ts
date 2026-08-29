import { databaseRefreshService } from '@app/@generic/service/database-refresh.service';
import { ExternalSourceEnum } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, SyncTransactionTypeEnum } from '@budgie/sync';
import { describe, expect, it } from 'vitest';

import { StubFileBankSyncService, seed } from '../../harness';

import type { FileBasedSyncClientInterface } from '@app/sync/interface/file-based-sync-client.interface';
import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

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
    it('bumps the app database refresh version after quick import writes transactions', async () => {
        const account = seed.account({ title: 'Refresh Bank', externalId: BANK_ACCOUNT_ID, externalSource: ExternalSourceEnum.ERSTE });
        seed.sync({ accountId: account.id, provider: ExternalSourceEnum.ERSTE });
        const syncService = new StubFileBankSyncService(ExternalSourceEnum.ERSTE, new RefreshFileClient());
        const initialVersion = databaseRefreshService.getSnapshot();
        let notificationCount = 0;
        const unsubscribe = databaseRefreshService.subscribe(() => {
            notificationCount += 1;
        });

        await syncService.quickImport(STATEMENT_URI);
        unsubscribe();

        expect(databaseRefreshService.getSnapshot()).toBe(initialVersion + 1);
        expect(notificationCount).toBe(1);
    });
});
