import { describe, expect, it } from 'vitest';

import { BankAccountTypeEnum, BankProviderEnum, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';

import { seed, StubFileBankSyncService } from '../../harness';

import { databaseRefreshService } from '@app/@generic/service/database-refresh.service';

import type { FileBasedBankSyncClientInterface } from '@budgie/bank-sync';
import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

const BANK_ACCOUNT_ID = 'AT_REFRESH';
const STATEMENT_URI = 'erste-refresh.pdf';

const buildBankAccount = (): BankAccountInterface => ({
    id: BANK_ACCOUNT_ID,
    provider: BankProviderEnum.ERSTE,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    creditLimit: 0,
    type: BankAccountTypeEnum.CHECKING,
    iban: BANK_ACCOUNT_ID
});

const buildTransaction = (): BankTransactionInterface => ({
    id: 'refresh-transaction-1',
    provider: BankProviderEnum.ERSTE,
    accountId: BANK_ACCOUNT_ID,
    type: BankTransactionTypeEnum.EXPENSE,
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

class RefreshFileClient implements FileBasedBankSyncClientInterface {
    getAccounts(): BankAccountInterface[] {
        return [buildBankAccount()];
    }

    getTransactions(accountId: string): BankTransactionInterface[] {
        return accountId === BANK_ACCOUNT_ID ? [buildTransaction()] : [];
    }
}

describe('import/file-import-refresh', () => {
    it('bumps the app database refresh version after quick import writes transactions', async () => {
        const account = seed.account({ title: 'Refresh Bank', externalId: BANK_ACCOUNT_ID, externalSource: ExternalSourceEnum.ERSTE });
        seed.bankSync({ accountId: account.id, provider: ExternalSourceEnum.ERSTE });
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
